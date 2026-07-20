"use client";

import { useState, useEffect, useRef } from "react";

interface PDFViewerProps {
  url: string;
  title: string;
  bookId: string;
  onClose: () => void;
}

export function PDFViewer({ url, title, bookId, onClose }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const iframeRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("bookmark:" + bookId);
    if (saved) {
      try { JSON.parse(saved); } catch {}
    }
  }, [bookId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-5xl rounded-xl bg-white shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 shrink-0">
          <h2 className="text-lg font-semibold text-zinc-800 truncate">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100 text-zinc-400">&#x2715;</button>
        </div>
        <div className="relative flex-1 bg-zinc-100" style={{ minHeight: "65vh" }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0"
            title={title}
            onLoad={() => setLoading(false)}
            onError={() => { setError("Failed to load PDF"); setLoading(false); }}
            allow="fullscreen"
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 shrink-0">
          <button onClick={() => window.open(url, "_blank")}
            className="text-xs px-3 py-1.5 bg-zinc-100 rounded-lg hover:bg-zinc-200 text-zinc-600">
            Open in new tab
          </button>
          <button onClick={() => { if (iframeRef.current) { iframeRef.current.requestFullscreen(); } }}
            className="text-xs px-3 py-1.5 bg-zinc-100 rounded-lg hover:bg-zinc-200 text-zinc-600">
            Fullscreen
          </button>
        </div>
      </div>
    </div>
  );
}
