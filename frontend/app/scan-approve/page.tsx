"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { QRScanner } from "@/components/QRScanner";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type ScanStatus = "idle" | "scanning" | "loading" | "success" | "error";

function parseApprovalData(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed, window.location.origin);
    const requestId = url.searchParams.get("request");
    const token = url.searchParams.get("token");
    if (requestId && token) {
      return { requestId, token };
    }
  } catch {
    // not a full URL; fallback below
  }

  const queryString = trimmed.includes("?") ? trimmed.split("?")[1] : trimmed;
  const params = new URLSearchParams(queryString);
  const requestId = params.get("request");
  const token = params.get("token");
  if (requestId && token) {
    return { requestId, token };
  }

  return null;
}

function ScanApproveContent() {
  const params = useSearchParams();
  const initialRequestId = params.get("request");
  const initialToken = params.get("token");

  const [status, setStatus] = useState<ScanStatus>("idle");
  const [message, setMessage] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [retry, setRetry] = useState(0);

  const confirmApproval = useCallback(async (requestId: string, token: string) => {
    setStatus("loading");
    setMessage("");
    setBookTitle("");

    try {
      const res = await api.approveByQRCode(requestId, token);
      if (res.success) {
        setStatus("success");
        setMessage("Your borrow request has been approved!");
        setBookTitle(res.data?.book?.title || "");
      } else {
        setStatus("error");
        setMessage(
          res.error ||
            "Unable to approve this request. It may already have been processed. Please contact the librarian."
        );
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again or ask the librarian for help.");
    }
  }, []);

  useEffect(() => {
    if (initialRequestId && initialToken) {
      confirmApproval(initialRequestId, initialToken);
    }
  }, [initialRequestId, initialToken, confirmApproval, retry]);

  const handleScan = async (scannedText: string) => {
    const approvalData = parseApprovalData(scannedText);
    if (!approvalData) {
      setStatus("error");
      setMessage("Invalid QR code. Please scan the librarian's approval QR code again.");
      setShowScanner(false);
      return;
    }

    setShowScanner(false);
    await confirmApproval(approvalData.requestId, approvalData.token);
  };

  const handleManualSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const approvalData = parseApprovalData(manualInput);
    if (!approvalData) {
      setStatus("error");
      setMessage("Invalid QR data. Paste the approval link or QR payload again.");
      return;
    }

    await confirmApproval(approvalData.requestId, approvalData.token);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-white">Scan QR Code to Confirm Borrowing</p>
            <p className="max-w-xl text-sm text-zinc-400">
              Use your device camera to scan the approval QR code shown by the librarian. The request will be approved automatically after a successful scan.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/30">
          {status === "success" ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-300">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <p className="text-xl font-semibold text-white">Borrow request approved</p>
                <p className="mt-2 text-sm text-zinc-400">{message}</p>
                {bookTitle && (
                  <p className="mt-2 text-sm text-zinc-200">
                    Book: <span className="font-medium text-white">{bookTitle}</span>
                  </p>
                )}
              </div>
              <div className="mt-3 flex justify-center gap-3">
                <a href="/" className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400">
                  Back to Home
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-emerald-300">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Scan with your camera</p>
                      <p className="text-xs text-zinc-500">Tap below to open the scanner.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("idle");
                      setMessage("");
                      setShowScanner(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                  >
                    <Camera className="w-4 h-4" />
                    Open Scanner
                  </button>
                </div>

                <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                  <p className="font-semibold text-white mb-3">Manual QR entry</p>
                  <form onSubmit={handleManualSubmit} className="space-y-3">
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(event) => setManualInput(event.target.value)}
                      placeholder="Paste approval link or QR data"
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Submit QR Data
                    </button>
                  </form>
                </div>
              </div>

              {(status === "loading" || status === "error") && (
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-blue-400">
                      {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{status === "loading" ? "Confirming approval" : "Scan error"}</p>
                      <p className="text-sm text-zinc-400">
                        {message || (status === "loading" ? "Please wait while we confirm your request." : "Please try again or contact the librarian.")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}

export default function ScanApprovePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
          <div className="text-zinc-300">Loading scan confirmation...</div>
        </div>
      }
    >
      <ScanApproveContent />
    </Suspense>
  );
}
