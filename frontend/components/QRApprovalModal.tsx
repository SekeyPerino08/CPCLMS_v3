"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import { QrCode, Loader2, X, RefreshCw } from "lucide-react";

interface QRApprovalModalProps {
  request: any;
  onClose: () => void;
  onApproved: () => void;
}

const POLL_INTERVAL_MS = 3000;

export function QRApprovalModal({ request, onClose, onApproved }: QRApprovalModalProps) {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closedRef = useRef(false);

  // Fetch the unique QR code for this request
  const loadQR = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.generateRequestQR(request.id);
      if (res.success) {
        setQrData(res.data);
      } else {
        setError(res.error || "Failed to generate QR code");
      }
    } catch {
      setError("Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  }, [request.id]);

  useEffect(() => {
    closedRef.current = false;
    loadQR();
    return () => {
      closedRef.current = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [loadQR]);

  // Poll the request status — once it becomes APPROVED (the borrower scanned
  // the QR on their phone), auto-close the modal and notify the parent.
  const checkStatus = useCallback(async () => {
    if (closedRef.current) return;
    setPolling(true);
    try {
      const res = await api.getBorrowRequest(request.id);
      const found = res.data;
      if (found && found.status === "APPROVED") {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        onApproved();
        onClose();
      }
    } catch {
      // Ignore transient polling errors; keep trying
    } finally {
      setPolling(false);
    }
  }, [request.id, onApproved, onClose]);

  useEffect(() => {
    if (!qrData) return;
    pollRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [qrData, checkStatus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Approve via QR Code</h3>
              <p className="text-sm text-zinc-400">Borrower scans this to confirm</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Request summary */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 mb-4 text-sm">
          <p className="text-zinc-100 font-medium">{qrData?.bookTitle || request.book?.title || "Book"}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-zinc-500">
            {qrData?.accessionNo && <span>Accession: {qrData.accessionNo}</span>}
            {qrData?.memberName && <span>Member: {qrData.memberName}</span>}
            {qrData?.libraryId && <span>ID: {qrData.libraryId}</span>}
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        {/* QR code display */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : qrData ? (
          <div className="flex flex-col items-center">
            <div className="bg-white rounded-xl p-4 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrData.qrCode}
                alt="Approval QR Code"
                className="w-56 h-56"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <p className="text-xs text-zinc-500 text-center mb-3 max-w-xs">
              Have the borrower scan this QR code with their phone to confirm and approve the request.
              The request will auto-approve once scanned.
            </p>
            <button
              onClick={loadQR}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate QR
            </button>
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 text-xs ${polling ? "text-blue-400" : "text-zinc-500"}`}>
            {polling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {polling ? "Waiting for scan..." : "Request still pending"}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-xl border border-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
