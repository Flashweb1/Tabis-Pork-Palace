"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary btn-sm no-print">
      Print / Save as PDF
    </button>
  );
}
