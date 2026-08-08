"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface BookmarkData {
  pageNumber: number;
  timestamp: number;
  totalPages: number;
}

interface PDFViewerProps {
  url: string;
  title: string;
  bookId: string;
  onClose: () => void;
}

const STORAGE_KEY_PREFIX = "bookmark:";

function getBookmark(bookId: string): BookmarkData | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + bookId);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveBookmark(bookId: string, data: BookmarkData): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + bookId, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

export function PDFViewer({ url, title, bookId, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scale, setScale] = useState<number>(1.0);
  const [resumePrompt, setResumePrompt] = useState<BookmarkData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const bm = getBookmark(bookId);
    if (bm && bm.pageNumber > 1) {
      setResumePrompt(bm);
      setPageNumber(bm.pageNumber);
    } else if (bm && bm.pageNumber === 1) {
      // Already at start, just restore scale if saved
    }
  }, [bookId]);

  // Debounced save bookmark on page change
  const debouncedSaveBookmark = useCallback((page: number, total: number) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveBookmark(bookId, {
        pageNumber: page,
        timestamp: Date.now(),
        totalPages: total,
      });
    }, 500);
  }, [bookId]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  function onDocumentLoadSuccess({ numPages: pages }: { numPages: number }) {
    setNumPages(pages);
    setLoading(false);
    // Save initial bookmark
    debouncedSaveBookmark(pageNumber, pages);
  }

  function onDocumentLoadError(err: Error) {
    console.error("PDF load error:", err);
    setError("Failed to load PDF document. The file may be corrupted or inaccessible.");
    setLoading(false);
  }

  function changePage(offset: number) {
    const nextPage = pageNumber + offset;
    if (nextPage >= 1 && nextPage <= numPages) {
      setPageNumber(nextPage);
      debouncedSaveBookmark(nextPage, numPages);
    }
  }

  function goToPage(page: number) {
    const p = Math.max(1, Math.min(page, numPages));
    setPageNumber(p);
    debouncedSaveBookmark(p, numPages);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      changePage(-1);
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      changePage(1);
    }
  }

  function zoomIn() {
    setScale((s) => Math.min(s + 0.25, 3.0));
  }

  function zoomOut() {
    setScale((s) => Math.max(s - 0.25, 0.5));
  }

  function fitToWidth() {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 32;
      const estimatedPageWidth = 600;
      const newScale = containerWidth / estimatedPageWidth;
      setScale(Math.round(newScale * 100) / 100);
    }
  }

  function handleResume() {
    setResumePrompt(null);
  }

  function dismissResume() {
    setResumePrompt(null);
    setPageNumber(1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-50 w-full max-w-6xl rounded-xl bg-white shadow-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-200 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-800 truncate pr-2">{title}</h2>
            {numPages > 0 && !error && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Page {pageNumber} of {numPages}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
            aria-label="Close viewer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Resume prompt */}
        {resumePrompt && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-amber-800">
              📖 Resume from page <strong>{resumePrompt.pageNumber}</strong> (last read{" "}
              {Math.round((Date.now() - resumePrompt.timestamp) / 60000)} min ago)
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleResume}
                className="px-3 py-1 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Resume
              </button>
              <button
                onClick={dismissResume}
                className="px-3 py-1 text-xs font-medium bg-white text-zinc-600 rounded-lg border border-zinc-300 hover:bg-zinc-50 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Main content area */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-auto bg-zinc-100 flex flex-col items-center p-4"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          style={{ minHeight: "50vh", maxHeight: "calc(95vh - 140px)" }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-zinc-500">Loading PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md">
                <p className="text-4xl mb-3">📄</p>
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:underline"
                >
                  Open PDF directly instead
                </a>
              </div>
            </div>
          )}

          {!error && (
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              className="flex flex-col items-center"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-xl rounded-lg overflow-hidden"
                loading={
                  <div className="flex items-center justify-center py-20">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              />
            </Document>
          )}
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-zinc-200 shrink-0 bg-white rounded-b-xl flex-wrap gap-2">
          {/* Page navigation */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-600 transition-colors"
              aria-label="Previous page"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-zinc-500 whitespace-nowrap">
              <input
                type="number"
                min={1}
                max={numPages}
                value={pageNumber}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-10 text-center text-sm border border-zinc-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              {" / "}{numPages}
            </span>
            <button
              onClick={() => changePage(1)}
              disabled={pageNumber >= numPages}
              className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-600 transition-colors"
              aria-label="Next page"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-600 transition-colors"
              aria-label="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xs text-zinc-500 w-12 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-600 transition-colors"
              aria-label="Zoom in"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={fitToWidth}
              className="ml-1 px-2 py-1 text-xs rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
              title="Fit to width"
            >
              Fit
            </button>
          </div>

          {/* Utility buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => window.open(url, "_blank")}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              New Tab
            </button>
            <button
              onClick={() => {
                if (containerRef.current?.requestFullscreen) {
                  containerRef.current.requestFullscreen();
                }
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Fullscreen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

