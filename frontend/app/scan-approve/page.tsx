"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  QrCode,
  ShieldCheck,
} from "lucide-react";

export default function ScanApprovePage() {
  const params = useSearchParams();
  const requestId = params.get("request");
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [retry, setRetry] = useState(0);

  const confirm = useCallback(async () => {
    if (!requestId || !token) {
      setStatus("error");
      setMessage("Invalid QR code. Please ask the librarian for a new one.");
      return;
    }
    setStatus("loading");
    setMessage("");
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
  }, [requestId, token]);

  useEffect(() => {
    confirm();
  }, [confirm, retry]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-400 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">CPC Library</p>
            <p className="text-xs text-zinc-500">Borrow Request Confirmation</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl shadow-black/50">
          {status === "loading" && (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/15 text-blue-400 flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Confirming...</h1>
              <p className="text-sm text-zinc-400">
                Please wait while we confirm your borrow request.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600/15 text-emerald-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">
                <ShieldCheck className="inline w-5 h-5 mr-1" />
                Approved!
              </h1>
              <p className="text-sm text-zinc-400 mb-2">{message}</p>
              {bookTitle && (
                <p className="text-sm text-zinc-300 font-medium">
                  Book: <span className="text-white">{bookTitle}</span>
                </p>
              )}
              <p className="text-xs text-zinc-500 mt-4">
                You can now pick up your book at the library counter. Present your
                library ID or the confirmation at the counter.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-600/15 text-red-400 flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Approval Failed</h1>
              <p className="text-sm text-zinc-400 mb-4">{message}</p>
              <button
                onClick={() => setRetry((r) => r + 1)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
