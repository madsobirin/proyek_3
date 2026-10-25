import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface NewsApiArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles?: NewsApiArticle[];
  message?: string;
  code?: string;
}

export async function GET(request: NextRequest) {
  try {
    const apiKey =
      process.env.NEWS_API_KEY ||
      process.env.NEWSAPI_KEY ||
      process.env.NEWS_APIKEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "API key NewsAPI belum dikonfigurasi di environment.",
          articles: [],
          totalResults: 0,
        },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(20, Math.max(1, parseInt(searchParams.get("pageSize") || "9", 10)));

    // Query khusus kesehatan, gizi, diet, atau sesuai pencarian pengguna
    const query = search
      ? `${search} AND (kesehatan OR gizi OR diet OR nutrisi OR fitness)`
      : "kesehatan OR diet OR gizi OR nutrisi";

    const targetUrl = new URL("https://newsapi.org/v2/everything");
    targetUrl.searchParams.set("q", query);
    targetUrl.searchParams.set("sortBy", "publishedAt");
    targetUrl.searchParams.set("page", page.toString());
    targetUrl.searchParams.set("pageSize", pageSize.toString());

    const res = await fetch(targetUrl.toString(), {
      headers: {
        "X-Api-Key": apiKey,
      },
      next: { revalidate: 1800 }, // Cache 30 menit untuk hemat kuota
    });

    const data: NewsApiResponse = await res.json();

    if (!res.ok || data.status !== "ok") {
      return NextResponse.json(
        {
          error: data.message || "Gagal mengambil data dari NewsAPI.",
          articles: [],
          totalResults: 0,
        },
        { status: 200 }
      );
    }

    const cleanedArticles = (data.articles || [])
      .filter((art) => art.title && art.title !== "[Removed]" && art.url)
      .map((art) => ({
        title: art.title,
        description: art.description,
        url: art.url,
        image: art.urlToImage,
        source: art.source?.name || "Berita",
        author: art.author,
        publishedAt: art.publishedAt,
      }));

    return NextResponse.json({
      status: "ok",
      totalResults: data.totalResults || cleanedArticles.length,
      articles: cleanedArticles,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching NewsAPI:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan internal saat mengambil berita.",
        articles: [],
        totalResults: 0,
      },
      { status: 500 }
    );
  }
}
