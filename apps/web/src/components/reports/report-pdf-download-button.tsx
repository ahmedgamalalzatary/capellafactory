"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReportPdfDownloadButtonProps = {
  label: string;
  filename: string;
  tableId: string;
};

export function ReportPdfDownloadButton({
  label,
  filename,
  tableId,
}: ReportPdfDownloadButtonProps) {
  function onDownload() {
    const table = document.getElementById(tableId);

    if (!table) {
      return;
    }

    const printRoot = document.createElement("section");
    printRoot.setAttribute("data-report-print-root", "true");
    printRoot.innerHTML = `
      <h1>${label}</h1>
      <p>${new Date().toLocaleString("en-GB")} - ${filename}</p>
      ${table.outerHTML}
    `;

    const style = document.createElement("style");
    style.setAttribute("data-report-print-style", "true");
    style.textContent = `
      [data-report-print-root="true"] { display: none; }
      @media print {
        body > *:not([data-report-print-root="true"]) { display: none !important; }
        [data-report-print-root="true"] {
          display: block;
          direction: rtl;
          padding: 24px;
          color: #0f172a;
          font-family: Arial, sans-serif;
        }
        [data-report-print-root="true"] h1 { font-size: 22px; margin: 0 0 8px; }
        [data-report-print-root="true"] p { color: #475569; margin: 0 0 18px; }
        [data-report-print-root="true"] table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        [data-report-print-root="true"] th,
        [data-report-print-root="true"] td {
          border: 1px solid #cbd5e1;
          padding: 8px;
          text-align: center;
        }
        [data-report-print-root="true"] th { background: #f1f5f9; }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(printRoot);
    window.print();
    window.setTimeout(() => {
      printRoot.remove();
      style.remove();
    }, 1000);
  }

  return (
    <Button type="button" variant="outline" onClick={onDownload}>
      <FileDown />
      {label}
    </Button>
  );
}
