"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { BookOpen, ShieldCheck, QrCode, Loader2, XCircle } from "lucide-react";
import { QRScanner } from "@/components/QRScanner";

function parseApprovalData(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed, window.location.origin);
    const requestId = url.searchParams.get("request");
    const token = url.searchParams.get("token");
    if (requestId && token) return { requestId, token };
  } catch {
    // not a full URL
  }

  const queryString = trimmed.includes("?") ? trimmed.split("?")[1] : trimmed;
  const params = new URLSearchParams(queryString);
  const requestId = params.get("request");
  const token = params.get("token");
  if (requestId && token) return { requestId, token };

  return null;
}

export function BookBorrowModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  books: any[];
  onSuccess: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "submitting" | "error">("scanning");
  const [error, setError] = useState("");

  const count = props.books.length;
  const maxReached = count >= 3;

  useEffect(() => {
    if (props.open) {
      setScanStatus("scanning");
      setError("");
    } else {
      setScanStatus("idle");
      setLoading(false);
      setError("");
      setNotes("");
    }
  }, [props.open]);

  const submitRequest = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.createBorrowRequest({
        bookIds: props.books.map((b) => b.id),
        notes: notes || undefined,
      });
      if (res.success) {
        props.onSuccess();
        props.onOpenChange(false);
        setNotes("");
      } else {
        setError(res.error || "Failed to submit request. Please try again.");
        setScanStatus("error");
      }
    } catch (err: any) {
      setError(err?.message || "Network error. Please try again.");
      setScanStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (scannedText: string) => {
    setError("");
    const approvalData = parseApprovalData(scannedText);
    if (!approvalData) {
      setError("Invalid QR code. Please scan the librarian's approval QR code.");
      setScanStatus("error");
      return;
    }

    setScanStatus("submitting");
    await submitRequest();
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogHeader>
        <DialogTitle>Scan librarian QR to confirm borrow request</DialogTitle>
        <DialogDescription>
          Use your device camera to scan the QR code provided by the librarian before sending your borrow request.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Scan the approval QR code</p>
              <p className="text-sm text-zinc-400 mt-1">
                The camera will activate when this modal opens. After a successful scan, your borrow request will be sent automatically.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 overflow-hidden">
            <QRScanner onScan={handleScan} onClose={() => props.onOpenChange(false)} />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Selected Books</p>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-0.5 ring-1 ${
                  maxReached
                    ? "bg-blue-500/15 text-blue-400 ring-blue-500/30"
                    : "bg-zinc-800 text-zinc-400 ring-zinc-700"
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                {count}/3 books
              </span>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto">
              {props.books.map((book, idx) => (
                <div key={book.id} className="flex items-center gap-3 px-2 py-2 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/15 text-blue-400 flex items-center justify-center text-base shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-100 text-sm truncate">{book.title}</p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {book.author} · <span className="text-zinc-400">{book.accessionNo}</span>
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">#{idx + 1}</span>
                </div>
              ))}
            </div>

            {maxReached && (
              <p className="mt-3 text-xs text-blue-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                You&apos;ve reached the maximum of 3 books per transaction.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Notes <span className="text-zinc-500">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., For research paper reference"
              rows={3}
              className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              disabled={scanStatus === "submitting" || loading}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              onClick={() => props.onOpenChange(false)}
              className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
              disabled={scanStatus === "submitting" || loading}
            >
              Cancel
            </Button>
            <div className="w-full sm:w-auto">
              <Button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
                disabled={scanStatus !== "submitting" || loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending request...
                  </span>
                ) : (
                  "Submitting request"
                )}
              </Button>
            </div>
          </div>
          {scanStatus === "scanning" && (
            <div className="mt-2 text-sm text-zinc-400">Scanning... point your camera at the QR code.</div>
          )}
          {scanStatus === "error" && !error && (
            <div className="mt-2 text-sm text-red-400">Scan failed. Try again or use manual entry.</div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
