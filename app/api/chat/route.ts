import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GROQ_MODEL = "qwen/qwen3.8-27b";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000; // 2 detik, akan naik eksponensial
const RETRYABLE_STATUSES = [429, 503]; // rate-limit & overload

async function callGroqWithRetry(
  apiKey: string,
  body: object,
): Promise<{ data: Record<string, unknown>; status: number }> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    // Jika berhasil atau error bukan retryable, langsung return
    if (response.ok || !RETRYABLE_STATUSES.includes(response.status)) {
      return { data, status: response.status };
    }

    // 429/503 → tunggu lalu retry (exponential backoff)
    if (attempt < MAX_RETRIES - 1) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt); // 2s, 4s, 8s
      console.warn(
        `Groq ${response.status} (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    } else {
      // Semua retry gagal
      return { data, status: response.status };
    }
  }

  // Fallback (seharusnya tidak tercapai)
  return {
    data: { error: { message: "Max retries exceeded" } },
    status: 503,
  };
}

export async function POST(req: Request) {
  try {
    // Cek autentikasi — hanya user yang login yang bisa pakai chatbot
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu untuk menggunakan FitBot." },
        { status: 401 },
      );
    }

    const { messages } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not set in environment variables" },
        { status: 500 },
      );
    }

    // Ambil data profil fisik dan riwayat perhitungan BMI pengguna
    const userProfile = await prisma.account.findUnique({
      where: { id: auth.userId },
      select: {
        name: true,
        weight: true,
        height: true,
        birthdate: true,
        perhitungan: {
          orderBy: { created_at: "desc" },
          take: 3,
        },
      },
    });

    const latestBmi = userProfile?.perhitungan?.[0];
    const lastUserMessage = (messages?.[messages.length - 1]?.content || "")
      .trim()
      .toLowerCase();

    // ─────────────────────────────────────────────────────────────
    // OPTIMASI 1: ZERO-TOKEN SHORTCUT (Direct response dari DB)
    // ─────────────────────────────────────────────────────────────
    if (lastUserMessage === "cek tinggi & berat badan") {
      if (!userProfile?.height && !userProfile?.weight) {
        return NextResponse.json({
          response: `Halo **${userProfile?.name || "Sobat FitLife"}**! 👋\n\nData fisik kamu belum tercatat di profil. Silakan lengkapi tinggi dan berat badanmu di menu **Profil** agar FitBot bisa memberikan rekomendasi yang akurat!`,
        });
      }
      return NextResponse.json({
        response: `Halo **${userProfile?.name || "Sobat FitLife"}**! 👋\n\nBerikut data fisik kamu yang tercatat:\n* 📏 **Tinggi Badan:** ${userProfile.height ? `${userProfile.height} cm` : "Belum diisi"}\n* ⚖️ **Berat Badan:** ${userProfile.weight ? `${userProfile.weight} kg` : "Belum diisi"}\n\nIngin cek status BMI atau hitung kalori harianmu? Cukup klik menu shortcut di bawah! 😊`,
      });
    }

    if (lastUserMessage === "status bmi terakhir") {
      if (!latestBmi) {
        return NextResponse.json({
          response: `Halo **${userProfile?.name || "Sobat FitLife"}**! 👋\n\nKamu belum memiliki riwayat perhitungan BMI. Yuk coba hitung BMI kamu melalui kalkulator kesehatan FitLife untuk mengetahui status berat badanmu!`,
        });
      }
      const tgl = latestBmi.created_at
        ? new Date(latestBmi.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "-";
      const tips =
        latestBmi.status.toLowerCase().includes("ideal") ||
        latestBmi.status.toLowerCase().includes("normal")
          ? "Keren! Berat badanmu sudah ideal. Pertahankan pola makan seimbang dan olahraga teratur ya! 💪"
          : latestBmi.status.toLowerCase().includes("kurang")
            ? "Tips: Tingkatkan asupan kalori bernutrisi dan perbanyak protein sehat untuk menaikkan berat badan secara sehat."
            : "Tips: Coba lakukan defisit kalori moderat dan tingkatkan latihan kardio serta kekuatan 3-4x seminggu.";

      return NextResponse.json({
        response: `Berikut status BMI terakhir kamu (per **${tgl}**):\n\n* ⚖️ **Berat / Tinggi:** ${latestBmi.berat_badan} kg / ${latestBmi.tinggi_badan} cm\n* 📊 **Skor BMI:** **${latestBmi.bmi.toFixed(1)}**\n* 🏷️ **Kategori:** **${latestBmi.status}**\n\n${tips}`,
      });
    }

    if (lastUserMessage === "hitung kalori harian") {
      if (!userProfile?.weight || !userProfile?.height) {
        return NextResponse.json({
          response: `Halo **${userProfile?.name || "Sobat FitLife"}**! 👋\n\nUntuk menghitung kalori harian secara tepat, FitBot memerlukan data tinggi dan berat badanmu. Silakan lengkapi di menu **Profil** terlebih dahulu ya!`,
        });
      }
      const age = userProfile.birthdate
        ? Math.floor(
            (Date.now() - new Date(userProfile.birthdate).getTime()) /
              (365.25 * 24 * 3600 * 1000),
          )
        : 25;
      // Rumus Mifflin-St Jeor
      const bmr = Math.round(
        10 * userProfile.weight + 6.25 * userProfile.height - 5 * age + 5,
      );
      const tdeeSedentary = Math.round(bmr * 1.2);
      const tdeeModerate = Math.round(bmr * 1.55);
      const defisit = tdeeModerate - 400;

      return NextResponse.json({
        response: `Berikut estimasi kebutuhan kalori harianmu (Metode Mifflin-St Jeor):\n\n* 🧬 **BMR (Metabolisme Dasar):** ~**${bmr} kkal**/hari\n* 🚶 **Aktivitas Ringan:** ~**${tdeeSedentary} kkal**/hari\n* 🏃 **Aktivitas Sedang/Olahraga:** ~**${tdeeModerate} kkal**/hari\n\n🎯 **Rekomendasi Target:**\n* **Menjaga Berat Badan:** Konsumsi ~${tdeeModerate} kkal/hari\n* **Menurunkan Berat Badan (Defisit Sehat):** Konsumsi ~${defisit} kkal/hari\n* **Menaikkan Berat Badan (Surplus):** Konsumsi ~${tdeeModerate + 300} kkal/hari`,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // OPTIMASI 2: LEAN SYSTEM PROMPT (~80 token saja)
    // ─────────────────────────────────────────────────────────────
    const userSummary = userProfile
      ? `Data user: ${userProfile.name || "User"}, TB ${userProfile.height || "-"}cm, BB ${userProfile.weight || "-"}kg${latestBmi ? `, BMI ${latestBmi.bmi.toFixed(1)} (${latestBmi.status})` : ""}.`
      : "Data fisik user belum ada.";

    const systemPrompt = `Kamu FitBot, asisten kesehatan & olahraga resmi FitLife.id.
Aturan:
1. HANYA jawab topik kesehatan, nutrisi, makanan sehat, diet, dan olahraga. Tolak topik lain dengan singkat & ramah. Dilarang menulis kode/programming.
2. Jawab ringkas, to-the-point, maksimal 2-3 paragraf/poin singkat tanpa basa-basi berlebih.
3. ${userSummary}`;

    // ─────────────────────────────────────────────────────────────
    // OPTIMASI 3: SLIDING WINDOW CHAT HISTORY (Maks 4 pesan terakhir)
    // ─────────────────────────────────────────────────────────────
    const validMessages = (messages || []).filter(
      (m: { role: string; content: string }) =>
        m.content && m.content.trim() !== "",
    );
    const recentMessages = validMessages.slice(-4);

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...recentMessages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    // ─────────────────────────────────────────────────────────────
    // OPTIMASI 4: KONTROL MAX_TOKENS
    // ─────────────────────────────────────────────────────────────
    const requestBody = {
      model: GROQ_MODEL,
      messages: formattedMessages,
      temperature: 0.2,
      max_tokens: 350, // Dibatasi 350 agar output padat dan hemat token
    };

    const { data, status } = await callGroqWithRetry(apiKey, requestBody);

    if (status !== 200) {
      const errorMsg =
        (data.error as { message?: string })?.message ||
        "Gagal mendapatkan respons dari Groq";
      return NextResponse.json({ error: errorMsg }, { status });
    }

    const choices = data.choices as
      | { message?: { content?: string } }[]
      | undefined;
    const botResponse =
      choices?.[0]?.message?.content ||
      "Maaf, saya tidak dapat menjawab saat ini.";

    return NextResponse.json({ response: botResponse });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
