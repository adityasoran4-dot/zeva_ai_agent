import React from "react";
import { FileSpreadsheet, FileText, File as FilePdf } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportSection {
  title: string;
  headers: string[];
  data: any[];
}

interface ExportButtonsProps {
  /** Legacy single-section usage */
  data?: any[];
  filename: string;
  headers?: string[];
  title: string;
  /** Multi-section usage: each entry becomes its own sheet/section */
  sections?: ExportSection[];
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ data, filename, headers, title, sections }) => {
  // Normalise: always work with an array of sections
  const allSections: ExportSection[] = sections && sections.length > 0
    ? sections
    : [{ title, headers: headers || (data && data.length > 0 ? Object.keys(data[0]) : []), data: data || [] }];

  // ── Excel ──────────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    allSections.forEach((section, idx) => {
      const rows = section.data.length > 0 ? section.data : [{}];
      // Build rows using only the declared header order
      const sheetData = rows.map((item: any) =>
        section.headers.reduce((acc: any, h) => { acc[h] = item[h] ?? ""; return acc; }, {})
      );
      const worksheet = XLSX.utils.json_to_sheet(sheetData, { header: section.headers });
      // Sheet names must be ≤ 31 chars and unique
      let sheetName = section.title.replace(/[\\\/:*?[\]]/g, "").slice(0, 28);
      if (workbook.SheetNames.includes(sheetName)) sheetName = `${sheetName}_${idx + 1}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // ── CSV ────────────────────────────────────────────────────────────────────
  const exportToCSV = () => {
    const csvParts: string[] = [];
    allSections.forEach((section) => {
      // Section title header
      csvParts.push(`"=== ${section.title} ==="`);
      if (section.data.length === 0) {
        csvParts.push(section.headers.map(h => `"${h}"`).join(","));
        csvParts.push("");
        return;
      }
      const rows = section.data.map((item: any) =>
        section.headers.reduce((acc: any, h) => { acc[h] = item[h] ?? ""; return acc; }, {})
      );
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: section.headers });
      csvParts.push(XLSX.utils.sheet_to_csv(worksheet));
      csvParts.push(""); // blank line separator
    });
    const csv = csvParts.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── PDF ────────────────────────────────────────────────────────────────────
  const exportToPDF = () => {
    const doc = new jsPDF();
    let currentY = 15;
    doc.setFontSize(14);
    doc.text(title, 14, currentY);
    currentY += 8;

    allSections.forEach((section) => {
      doc.setFontSize(11);
      doc.setTextColor(45, 154, 165);
      doc.text(section.title, 14, currentY);
      currentY += 4;
      doc.setTextColor(0, 0, 0);

      const rows = section.data.length > 0
        ? section.data.map((item: any) => section.headers.map(h => String(item[h] ?? "")))
        : [[...section.headers.map(() => "")]];

      autoTable(doc, {
        head: [section.headers],
        body: rows,
        startY: currentY,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [45, 154, 165] },
        margin: { left: 14, right: 14 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`${filename}.pdf`);
  };

  return (
    <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 mb-3 sm:mb-4">
      <button
        onClick={exportToCSV}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs sm:text-sm transition-colors shadow-sm min-w-[70px] sm:min-w-[85px]"
        title="Download CSV"
      >
        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
        <span className="font-medium">CSV</span>
      </button>
      <button
        onClick={exportToExcel}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs sm:text-sm transition-colors shadow-sm min-w-[70px] sm:min-w-[85px]"
        title="Download Excel"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
        <span className="font-medium">Excel</span>
      </button>
      <button
        onClick={exportToPDF}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs sm:text-sm transition-colors shadow-sm min-w-[70px] sm:min-w-[85px]"
        title="Download PDF"
      >
        <FilePdf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
        <span className="font-medium">PDF</span>
      </button>
    </div>
  );
};

export default ExportButtons;
