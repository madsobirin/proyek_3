"use client";

import { useState, useTransition, useRef } from "react";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Trash2,
  Calendar,
  Scale,
  Activity,
  History,
  Sparkles,
  Loader2,
  BarChart3,
  Download,
  FileText,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type PerhitunganItem = {
  id: number;
  user_id: number;
  tinggi_badan: number;
  berat_badan: number;
  bmi: number;
  status: string;
  gender?: string;
  usia?: number;
  aktivitas?: string;
  bmr?: number;
  tdee?: number;
  target_kalori?: number;
  berat_min?: number;
  berat_max?: number;
  protein?: number;
  karbohidrat?: number;
  lemak?: number;
  created_at: string;
  updated_at?: string;
};

type BMIRiwayatChartProps = {
  history: PerhitunganItem[];
  onRefreshHistory: () => void;
  isLoggedIn: boolean;
};

// ============================================================
// KOMPONEN TABEL RIWAYAT (untuk di-export ke PNG/PDF)
// ============================================================
function KartuRiwayatDigital({
  history,
  innerRef,
}: {
  history: PerhitunganItem[];
  innerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const fmtDate = (d: string | Date) => {
    try {
      return new Date(d).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(d);
    }
  };

  // Chronological (oldest → newest)
  const sortedChrono = [...history].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const first = sortedChrono[0];
  const last = sortedChrono[sortedChrono.length - 1];
  const deltaBerat =
    first && last
      ? parseFloat((last.berat_badan - first.berat_badan).toFixed(1))
      : 0;
  const avgBMI =
    history.length > 0
      ? parseFloat(
          (
            history.reduce((sum, h) => sum + h.bmi, 0) / history.length
          ).toFixed(1),
        )
      : 0;

  return (
    <div
      ref={innerRef}
      style={{
        position: "fixed",
        left: "-9999px",
        top: 0,
        width: "960px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: "#0a0f0d",
          color: "#ffffff",
          padding: "32px",
          borderRadius: "16px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0 }}>
              Riwayat Perhitungan BMI
            </h2>
            <p
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                margin: "4px 0 0 0",
              }}
            >
              Total {history.length} perhitungan
              {sortedChrono.length > 0 &&
                ` • ${fmtDate(first.created_at)} – ${fmtDate(
                  last.created_at,
                )}`}
            </p>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              textAlign: "right",
            }}
          >
            Dicetak:{" "}
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        {/* TABEL SEMUA RIWAYAT */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr style={{ background: "rgba(0,255,127,0.1)" }}>
              {[
                "No",
                "Tanggal",
                "Tinggi",
                "Berat",
                "BMI",
                "Status",
                "BMR",
                "TDEE",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 8px",
                    textAlign: "left",
                    color: "#00ff7f",
                    fontSize: "11px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid rgba(0,255,127,0.3)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedChrono
              .slice()
              .reverse()
              .map((item, idx) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <td style={{ padding: "10px 8px", color: "#9ca3af" }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: "10px 8px", color: "#d1d5db" }}>
                    {fmtDate(item.created_at)}
                  </td>
                  <td style={{ padding: "10px 8px", color: "#d1d5db" }}>
                    {item.tinggi_badan} cm
                  </td>
                  <td style={{ padding: "10px 8px", color: "#d1d5db" }}>
                    {item.berat_badan} kg
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      color: "#00ff7f",
                      fontWeight: 900,
                    }}
                  >
                    {item.bmi.toFixed(1)}
                  </td>
                  <td style={{ padding: "10px 8px", color: "#d1d5db" }}>
                    {item.status}
                  </td>
                  <td style={{ padding: "10px 8px", color: "#d1d5db" }}>
                    {item.bmr ? Math.round(item.bmr) : "-"}
                  </td>
                  <td style={{ padding: "10px 8px", color: "#d1d5db" }}>
                    {item.tdee ? Math.round(item.tdee) : "-"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Progress Summary */}
        {history.length > 1 && (
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              background: "rgba(0,255,127,0.05)",
              border: "1px solid rgba(0,255,127,0.2)",
              borderRadius: "12px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "10px",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Progress Berat
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  margin: "4px 0 0 0",
                  color: deltaBerat < 0 ? "#00ff7f" : "#f87171",
                }}
              >
                {deltaBerat >= 0 ? "+" : ""}
                {deltaBerat} kg
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Rata-rata BMI
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  margin: "4px 0 0 0",
                }}
              >
                {avgBMI}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: "10px",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Status Terakhir
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#00ff7f",
                  margin: "4px 0 0 0",
                }}
              >
                {last?.status ?? "-"}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: "10px",
            color: "#6b7280",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          Dibuat dengan Kalkulator BMI • Konsultasikan dengan dokter untuk hasil
          yang lebih akurat
        </p>
      </div>
    </div>
  );
}

export default function BMIRiwayatChart({
  history,
  onRefreshHistory,
  isLoggedIn,
}: BMIRiwayatChartProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(
    null,
  );
  const [, startTransition] = useTransition();

  // === Fitur Export Riwayat (PNG/PDF) ===
  const kartuRiwayatRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<"PNG" | "PDF" | null>(null);

  const handleExportPNG = async () => {
    if (!kartuRiwayatRef.current || history.length === 0) return;
    setExporting("PNG");
    try {
      const canvas = await html2canvas(kartuRiwayatRef.current, {
        backgroundColor: "#0a0f0d",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `Riwayat-BMI-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Export PNG gagal:", err);
    } finally {
      setExporting(null);
    }
  };

        const handleExportPDF = () => {
    if (history.length === 0) return;
    setExporting("PDF");
    try {
      // 1. SETUP PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.width; // 210mm
      const pageHeight = pdf.internal.pageSize.height; // 297mm
      const marginX = 14;
      const contentWidth = pageWidth - marginX * 2;

      // Warna palet (samakan dengan web)
      const PRIMARY: [number, number, number] = [0, 200, 100];      // hijau
      const PRIMARY_DARK: [number, number, number] = [0, 150, 75];  // hijau gelap
      const BG_DARK: [number, number, number] = [15, 23, 20];       // dark bg
      const TEXT_DARK: [number, number, number] = [30, 30, 30];
      const TEXT_MUTED: [number, number, number] = [120, 120, 120];
      const BORDER_LIGHT: [number, number, number] = [220, 220, 220];
      const BG_LIGHT: [number, number, number] = [246, 252, 249];

      // 2. HEADER BANNER
      // Banner gelap sebagai background header
      pdf.setFillColor(...BG_DARK);
      pdf.rect(0, 0, pageWidth, 32, "F");

      // Garis aksen hijau di bawah banner
      pdf.setFillColor(...PRIMARY);
      pdf.rect(0, 32, pageWidth, 1.5, "F");

      // Judul
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.text("Riwayat Perhitungan BMI", marginX, 14);

      // Subtitle
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(180, 200, 190);
      pdf.text(
        "Laporan progres berat badan & indeks massa tubuh",
        marginX,
        21,
      );

      // Info di kanan header
      pdf.setFontSize(8);
      pdf.setTextColor(200, 220, 210);
      const today = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      pdf.text(`Dicetak: ${today}`, pageWidth - marginX, 14, {
        align: "right",
      });
      pdf.text(`Total: ${history.length} catatan`, pageWidth - marginX, 21, {
        align: "right",
      });

      // 3. TABEL RIWAYAT
      const sortedChrono = [...history].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      const body = sortedChrono
        .slice()
        .reverse()
        .map((item, idx) => [
          idx + 1,
          new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          `${item.tinggi_badan}`,
          `${item.berat_badan}`,
          item.bmi.toFixed(1),
          item.status,
          item.bmr ? Math.round(item.bmr) : "-",
          item.tdee ? Math.round(item.tdee) : "-",
        ]);

      autoTable(pdf, {
        startY: 40,
        head: [
          [
            "No",
            "Tanggal",
            "Tinggi (cm)",
            "Berat (kg)",
            "BMI",
            "Status",
            "BMR",
            "TDEE",
          ],
        ],
        body: body,
        theme: "grid",
        headStyles: {
          fillColor: PRIMARY,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9.5,
          halign: "center",
          valign: "middle",
          cellPadding: { top: 3.5, bottom: 3.5, left: 2, right: 2 },
          lineWidth: 0,
        },
        bodyStyles: {
          fontSize: 9,
          textColor: TEXT_DARK,
          halign: "center",
          valign: "middle",
          cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
          lineColor: BORDER_LIGHT,
          lineWidth: 0.1,
        },
        alternateRowStyles: {
          fillColor: BG_LIGHT,
        },
        columnStyles: {
          0: { cellWidth: 12, fontStyle: "bold", textColor: TEXT_MUTED },
          1: { cellWidth: 30 },
          2: { cellWidth: 22 },
          3: { cellWidth: 22 },
          4: {
            cellWidth: 18,
            fontStyle: "bold",
            textColor: PRIMARY_DARK,
          },
          5: { cellWidth: 26, fontStyle: "bold" },
          6: { cellWidth: 24 },
          7: { cellWidth: 24 },
        },
        margin: { top: 40, left: marginX, right: marginX },
        didParseCell: (data) => {
          // Warnai kolom Status berdasarkan nilainya
          if (data.section === "body" && data.column.index === 5) {
            const status = String(data.cell.raw);
            if (status === "Normal") {
              data.cell.styles.textColor = [0, 150, 75];
            } else if (status === "Kurus") {
              data.cell.styles.textColor = [200, 150, 0];
            } else if (status === "Berlebih") {
              data.cell.styles.textColor = [220, 100, 50];
            } else if (status === "Obesitas") {
              data.cell.styles.textColor = [200, 50, 50];
            }
          }
        },
      });

      // 4. SUMMARY CARDS DI BAWAH TABEL
      const finalY =
        (pdf as unknown as { lastAutoTable: { finalY: number } })
          .lastAutoTable.finalY + 12;

      // Cek apakah masih cukup ruang (kalau tidak, tambah halaman baru)
      let summaryY = finalY;
      if (summaryY + 40 > pageHeight - 20) {
        pdf.addPage();
        summaryY = 20;
      }

      if (history.length > 1) {
        const first = sortedChrono[0];
        const last = sortedChrono[sortedChrono.length - 1];
        const deltaBerat = parseFloat(
          (last.berat_badan - first.berat_badan).toFixed(1),
        );
        const avgBMI = parseFloat(
          (
            history.reduce((sum, h) => sum + h.bmi, 0) / history.length
          ).toFixed(1),
        );

        // Judul section summary
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...TEXT_DARK);
        pdf.text("Ringkasan Progress", marginX, summaryY);
        summaryY += 6;

        // 3 kartu summary
        const cardGap = 4;
        const cardWidth = (contentWidth - cardGap * 2) / 3;
        const cardHeight = 24;

        const cards = [
          {
            label: "PROGRESS BERAT",
            value: `${deltaBerat >= 0 ? "+" : ""}${deltaBerat} kg`,
            color:
              deltaBerat < 0
                ? ([0, 150, 75] as [number, number, number])
                : deltaBerat > 0
                  ? ([200, 100, 50] as [number, number, number])
                  : ([100, 100, 100] as [number, number, number]),
          },
          {
            label: "RATA-RATA BMI",
            value: `${avgBMI}`,
            color: PRIMARY_DARK,
          },
          {
            label: "STATUS TERAKHIR",
            value: last.status,
            color: [0, 150, 75] as [number, number, number],
          },
        ];

        cards.forEach((card, i) => {
          const cardX = marginX + i * (cardWidth + cardGap);

          // Background kartu
          pdf.setFillColor(250, 252, 251);
          pdf.setDrawColor(...BORDER_LIGHT);
          pdf.setLineWidth(0.3);
          pdf.roundedRect(
            cardX,
            summaryY,
            cardWidth,
            cardHeight,
            2,
            2,
            "FD",
          );

          // Bar aksen kiri kartu
          pdf.setFillColor(...card.color);
          pdf.rect(cardX, summaryY, 1.2, cardHeight, "F");

          // Label
          pdf.setFontSize(7.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...TEXT_MUTED);
          pdf.text(card.label, cardX + 4, summaryY + 6);

          // Value
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...card.color);
          pdf.text(card.value, cardX + 4, summaryY + 17);
        });
      }

      // 5. FOOTER DI SETIAP HALAMAN
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);

        // Garis footer
        pdf.setDrawColor(...BORDER_LIGHT);
        pdf.setLineWidth(0.3);
        pdf.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...TEXT_MUTED);

        pdf.text(
          "Dibuat dengan Kalkulator BMI • Konsultasikan dengan dokter untuk hasil yang lebih akurat",
          marginX,
          pageHeight - 7,
        );

        pdf.text(`Halaman ${i} dari ${pageCount}`, pageWidth - marginX, pageHeight - 7, {
          align: "right",
        });
      }

      // 6. SAVE
      pdf.save(`Riwayat-BMI-${Date.now()}.pdf`);
    } catch (err) {
      console.error("Export PDF gagal:", err);
    } finally {
      setExporting(null);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  const sortedChrono = [...history].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const oldestEntry = sortedChrono.length > 0 ? sortedChrono[0] : null;
  const latestEntry =
    sortedChrono.length > 0 ? sortedChrono[sortedChrono.length - 1] : null;
  const prevEntry =
    sortedChrono.length > 1 ? sortedChrono[sortedChrono.length - 2] : null;

  const recentDelta =
    latestEntry && prevEntry
      ? parseFloat((latestEntry.berat_badan - prevEntry.berat_badan).toFixed(1))
      : 0;

  const totalDelta =
    latestEntry && oldestEntry && sortedChrono.length > 1
      ? parseFloat(
          (latestEntry.berat_badan - oldestEntry.berat_badan).toFixed(1),
        )
      : 0;

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/perhitungan?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        startTransition(() => {
          onRefreshHistory();
        });
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatXAxisLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const date = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      const time = d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return { date, time };
    } catch {
      return { date: dateStr, time: "" };
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  };

  const width = 650;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const weights = sortedChrono.map((d) => d.berat_badan);
  const minW = Math.min(...weights, 30);
  const maxW = Math.max(...weights, 100);
  const yMin = Math.max(0, Math.floor(minW - 3));
  const yMax = Math.ceil(maxW + 3);
  const yRange = yMax - yMin || 1;

  const points = sortedChrono.map((item, index) => {
    const x =
      sortedChrono.length === 1
        ? width / 2
        : paddingX +
          (index / (sortedChrono.length - 1)) * (width - paddingX * 2);
    const y =
      height -
      paddingY -
      ((item.berat_badan - yMin) / yRange) * (height - paddingY * 2);
    return { x, y, item, index };
  });

  let linePathD = "";
  if (points.length === 1) {
    linePathD = `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`;
  } else if (points.length > 1) {
    linePathD = points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cx1 = prev.x + (p.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (p.x - prev.x) / 2;
      const cy2 = p.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
    }, "");
  }

  const areaPathD =
    points.length > 1
      ? `${linePathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : "";

  const activePoint =
    hoveredPointIndex !== null && points[hoveredPointIndex]
      ? points[hoveredPointIndex]
      : points[points.length - 1];

  return (
    <div className="bg-card-dark border border-card-border rounded-3xl p-6 md:p-8 mb-10 overflow-hidden shadow-xl relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title Header + Tombol Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider mb-2">
            <Activity size={12} /> Progress Tracking
          </div>
          <h2 className="text-xl md:text-2xl font-black text-text-light flex items-center gap-2">
            Riwayat & Tren Berat Badan
          </h2>
          <p className="text-text-muted text-xs md:text-sm mt-1">
            Visualisasi perubahan berat badan dan indeks massa tubuh dari setiap
            pengukuran Anda.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className="text-xs text-text-muted font-bold bg-background-base border border-card-border px-3.5 py-2 rounded-xl flex items-center gap-1.5">
              <History size={14} className="text-primary" />
              {history.length} Catatan
            </span>

            {/* Tombol Export PNG */}
            <button
              onClick={handleExportPNG}
              disabled={exporting !== null || history.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-background-base border border-card-border hover:border-primary/50 hover:bg-primary/5 text-text-light transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export tabel riwayat ke PNG"
            >
              {exporting === "PNG" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} className="text-primary" />
              )}
              {exporting === "PNG" ? "Memproses..." : "Export PNG"}
            </button>

            {/* Tombol Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={exporting !== null || history.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-primary hover:bg-primary-hover text-background-dark transition-all shadow-[0_0_16px_rgba(0,255,127,0.3)] hover:shadow-[0_0_24px_rgba(0,255,127,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export tabel riwayat ke PDF"
            >
              {exporting === "PDF" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )}
              {exporting === "PDF" ? "Memproses..." : "Export PDF"}
            </button>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 px-4 bg-background-base/40 border border-card-border/60 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
            <BarChart3 size={24} className="text-primary" />
          </div>
          <h3 className="text-base font-bold text-text-light mb-1">
            Belum Ada Riwayat Perhitungan
          </h3>
          <p className="text-text-muted text-xs max-w-md mx-auto">
            Hitung BMI Anda menggunakan form di atas untuk mulai mencatat dan
            memantau tren perkembangan kesehatan Anda secara otomatis.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6 relative z-10">
            {/* Card 1: Berat Terbaru */}
            <div className="bg-background-base/60 border border-card-border rounded-2xl p-4">
              <p className="text-[11px] font-bold text-text-muted mb-1 flex items-center gap-1">
                <Scale size={13} className="text-primary" /> Berat Terbaru
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-text-light">
                  {latestEntry?.berat_badan}
                </span>
                <span className="text-xs font-bold text-text-muted">kg</span>
              </div>
              {history.length > 1 && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold">
                  {recentDelta < 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                      <TrendingDown size={11} /> {Math.abs(recentDelta)} kg
                    </span>
                  ) : recentDelta > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
                      <TrendingUp size={11} /> +{recentDelta} kg
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-text-muted bg-white/5 px-2 py-0.5 rounded-md border border-card-border">
                      <Minus size={11} /> Tetap
                    </span>
                  )}
                  <span className="text-text-muted/60">
                    vs pengukuran lalu
                  </span>
                </div>
              )}
            </div>

            {/* Card 2: BMI Terkini */}
            <div className="bg-background-base/60 border border-card-border rounded-2xl p-4">
              <p className="text-[11px] font-bold text-text-muted mb-1 flex items-center gap-1">
                <Activity size={13} className="text-primary" /> BMI Terkini
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary">
                  {latestEntry?.bmi?.toFixed(1)}
                </span>
              </div>
              <span className="inline-block mt-2 text-[10px] font-black px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/25">
                {latestEntry?.status}
              </span>
            </div>

            {/* Card 3: Total Perubahan */}
            <div className="bg-background-base/60 border border-card-border rounded-2xl p-4">
              <p className="text-[11px] font-bold text-text-muted mb-1">
                Total Perubahan
              </p>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-black ${
                    totalDelta < 0
                      ? "text-green-400"
                      : totalDelta > 0
                        ? "text-yellow-400"
                        : "text-text-light"
                  }`}
                >
                  {sortedChrono.length <= 1
                    ? "—"
                    : totalDelta > 0
                      ? `+${totalDelta}`
                      : totalDelta}
                </span>
                {sortedChrono.length > 1 && (
                  <span className="text-xs font-bold text-text-muted">kg</span>
                )}
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                {sortedChrono.length <= 1
                  ? "Butuh ≥2 catatan untuk melihat perubahan"
                  : `Pengukuran pertama → terbaru`}
              </p>
            </div>

            {/* Card 4: Insight */}
            <div className="bg-background-base/60 border border-card-border rounded-2xl p-4 flex flex-col justify-between">
              <p className="text-[11px] font-bold text-text-muted flex items-center gap-1">
                <Sparkles size={12} className="text-primary" /> Status Tren
              </p>
              <div className="text-xs font-bold leading-tight text-text-light my-1">
                {totalDelta < -0.5
                  ? "📉 Penurunan konsisten"
                  : totalDelta > 0.5
                    ? "📈 Kenaikan terdeteksi"
                    : "⚖️ Berat relatif stabil"}
              </div>
              <p className="text-[10px] text-text-muted">
                {history.length} x total pencatatan
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-background-base/80 border border-card-border rounded-2xl p-4 md:p-6 mb-8 relative">
            <div className="flex items-center justify-between text-xs text-text-muted font-bold mb-1">
              <span>↑ Berat Badan (kg)</span>
              <span>Urutan Pengukuran (terlama → terbaru) →</span>
            </div>
            <p className="text-[10px] text-text-muted/50 mb-4">
              Klik titik pada grafik untuk melihat detail pengukuran
            </p>

            <div className="relative w-full overflow-x-auto">
              <div className="min-w-[500px]">
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-auto overflow-visible"
                >
                  <defs>
                    <linearGradient
                      id="bmiAreaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-primary, #00ff7f)"
                        stopOpacity="0.35"
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-primary, #00ff7f)"
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                    <filter
                      id="glow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite
                        in="SourceGraphic"
                        in2="blur"
                        operator="over"
                      />
                    </filter>
                  </defs>

                  {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                    const yVal =
                      height - paddingY - ratio * (height - paddingY * 2);
                    const labelVal = Math.round(yMin + ratio * yRange);
                    return (
                      <g key={idx}>
                        <line
                          x1={paddingX}
                          y1={yVal}
                          x2={width - paddingX}
                          y2={yVal}
                          stroke="currentColor"
                          className="text-card-border"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={paddingX - 8}
                          y={yVal + 3}
                          fill="currentColor"
                          className="text-[9px] fill-text-muted/60 font-mono"
                          textAnchor="end"
                        >
                          {labelVal}
                        </text>
                      </g>
                    );
                  })}

                  {areaPathD && (
                    <path d={areaPathD} fill="url(#bmiAreaGradient)" />
                  )}

                  {linePathD && (
                    <path
                      d={linePathD}
                      fill="none"
                      stroke="var(--color-primary, #00ff7f)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glow)"
                    />
                  )}

                  {points.map((p, idx) => {
                    const isHovered = activePoint?.index === idx;
                    return (
                      <g
                        key={p.item.id}
                        className="cursor-pointer transition-transform duration-200"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onClick={() => setHoveredPointIndex(idx)}
                      >
                        {isHovered && (
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="10"
                            fill="var(--color-primary, #00ff7f)"
                            fillOpacity="0.25"
                            className="animate-ping"
                          />
                        )}
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? "6.5" : "4.5"}
                          fill="var(--color-background-dark, #0d131a)"
                          stroke="var(--color-primary, #00ff7f)"
                          strokeWidth={isHovered ? "3" : "2.5"}
                        />
                        {(() => {
                          const { date, time } = formatXAxisLabel(
                            p.item.created_at,
                          );
                          const cls = isHovered
                            ? "fill-primary"
                            : "fill-text-muted/60";
                          return (
                            <>
                              <text
                                x={p.x}
                                y={height - 14}
                                fill="currentColor"
                                className={`text-[9px] font-bold ${cls}`}
                                textAnchor="middle"
                              >
                                {date}
                              </text>
                              <text
                                x={p.x}
                                y={height - 3}
                                fill="currentColor"
                                className={`text-[8px] ${cls}`}
                                textAnchor="middle"
                              >
                                {time}
                              </text>
                            </>
                          );
                        })()}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {activePoint && (
              <div className="mt-4 pt-4 border-t border-card-border/60 flex flex-wrap items-center justify-between gap-3 bg-card-dark/60 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold text-text-light flex items-center gap-1.5">
                    <Calendar size={13} className="text-text-muted" />
                    {formatDate(activePoint.item.created_at)}
                    <span className="text-text-muted font-normal">
                      pukul {formatTime(activePoint.item.created_at)}
                    </span>
                    <span className="ml-1 text-[10px] text-text-muted/50 font-normal bg-white/5 border border-card-border px-2 py-0.5 rounded-md">
                      Pengukuran ke-{activePoint.index + 1} dari {points.length}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-text-muted">Tinggi: </span>
                    <span className="font-bold text-text-light">
                      {activePoint.item.tinggi_badan} cm
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Berat: </span>
                    <span className="font-black text-primary">
                      {activePoint.item.berat_badan} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">BMI: </span>
                    <span className="font-bold text-text-light">
                      {activePoint.item.bmi.toFixed(1)}
                    </span>
                    <span className="ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {activePoint.item.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History List Table */}
          <div>
            <h3 className="text-sm font-black text-text-light flex items-center gap-2 mb-3">
              <History size={15} className="text-primary" />
              Daftar Catatan Perhitungan
            </h3>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-background-base/60 border border-card-border/80 hover:border-primary/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-card-dark border border-card-border flex items-center justify-center text-primary font-black text-xs shrink-0">
                      {item.bmi.toFixed(1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-text-light">
                          {item.berat_badan} kg
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-card-border text-text-muted">
                          {item.tinggi_badan} cm
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    title="Hapus entri ini"
                    className="p-2 text-text-muted/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
                  >
                    {deletingId === item.id ? (
                      <Loader2
                        size={15}
                        className="animate-spin text-red-400"
                      />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Kartu tabel tersembunyi untuk di-export */}
      {history.length > 0 && (
        <KartuRiwayatDigital history={history} innerRef={kartuRiwayatRef} />
      )}
    </div>
  );
}