"use client";

import { useState, useRef } from "react";

interface QRDisplayModalProps {
  open: boolean;
  onClose: () => void;
  qrCodeDataUrl: string;
  title: string;
  bookTitle?: string;
  dueDate?: string;
  accessionNo?: string;
}

export function QRDisplayModal({
  open,
  onClose,
  qrCodeDataUrl,
  title,
  bookTitle,
  dueDate,
  accessionNo,
}: QRDisplayModalProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      // Try to copy the QR data URL as text
      await navigator.clipboard.writeText(qrCodeDataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy the raw data
      try {
        const textToCopy = bookTitle
          ? `Book: ${bookTitle}\nAccession: ${accessionNo || "N/A"}\nDue: ${dueDate || "N/A"}`
          : qrCodeDataUrl;
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Ignore if clipboard unavailable
      }
    }
  };

  const handleDownload = () => {
    try {
      const link = document.createElement("a");
      link.href = qrCodeDataUrl;
      link.download = `qr-${accessionNo || "book"}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>QR Code - ${title}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;padding:20px;">
          <h2 style="margin-bottom:8px;color:#1a1a2e;">${title}</h2>
          ${bookTitle ? `<p style="margin-bottom:4px;color:#555;">${bookTitle}</p>` : ""}
          ${accessionNo ? `<p style="margin-bottom:16px;color:#888;font-size:14px;">Accession: ${accessionNo}</p>` : ""}
          <img src="${qrCodeDataUrl}" style="width:300px;height:300px;image-rendering:pixelated;" />
          ${dueDate ? `<p style="margin-top:16px;color:#555;">Due: ${dueDate}</p>` : ""}
          <p style="margin-top:24px;color:#999;font-size:12px;">CPC Library Management System</p>
          <script>
            window.onload = function() { setTimeout(function() { window.print(); }, 500); };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-sm rounded-xl bg-white shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Book details */}
        {bookTitle && (
          <div className="bg-zinc-50 rounded-lg p-3 mb-4 text-sm">
            <p className="font-medium text-zinc-800">{bookTitle}</p>
            <div className="flex gap-3 mt-1 text-xs text-zinc-500">
              {accessionNo && <span>ID: {accessionNo}</span>}
              {dueDate && <span>Due: {dueDate}</span>}
            </div>
          </div>
        )}

        {/* QR Code image */}
        <div
          ref={qrRef}
          className="bg-white rounded-xl border-2 border-zinc-200 p-4 mb-4 flex items-center justify-center"
          style={{ minHeight: "220px" }}
        >
          {imgError ? (
            <div className="text-center text-zinc-400">
              <p className="text-4xl mb-2">📱</p>
              <p className="text-sm">QR code unavailable</p>
            </div>
          ) : (
            <img
              src={qrCodeDataUrl}
              alt="QR Code for book borrowing"
              className="max-w-full h-auto"
              style={{ width: 200, height: 200, imageRendering: "pixelated" }}
              onError={() => setImgError(true)}
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-1 p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-200"
            title="Download QR Code"
          >
            <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-[10px] text-zinc-500">Download</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex flex-col items-center gap-1 p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-200"
            title="Print QR Code"
          >
            <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="text-[10px] text-zinc-500">Print</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex flex-col items-center gap-1 p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-200"
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] text-zinc-500">{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>

        <p className="text-[10px] text-zinc-400 text-center mt-3">
          Show this QR code at the library counter to borrow or return books.
        </p>
      </div>
    </div>
  );
}

