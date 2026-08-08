"use client";

import { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { BookOpen, ShieldCheck } from "lucide-react";

export function BookBorrowModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  books: any[];
  onSuccess: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const count = props.books.length;
  const maxReached = count >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
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
      }
    } catch (err: any) {
      setError(err?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogHeader>
        <DialogTitle>Request to Borrow ({count} book{count !== 1 ? "s" : ""})</DialogTitle>
        <DialogDescription>Submit a request to borrow these books from the library.</DialogDescription>
      </DialogHeader>

      {/* Book list */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Selected Books</p>
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

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-800 max-h-52 overflow-y-auto">
          {props.books.map((book, idx) => (
            <div key={book.id} className="flex items-center gap-3 px-3 py-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600/15 text-blue-400 flex items-center justify-center text-base shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-100 text-sm truncate">{book.title}</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {book.author} · <span className="text-zinc-400">{book.accessionNo}</span>
                </p>
              </div>
              <span className="text-xs text-zinc-600 font-mono shrink-0">#{idx + 1}</span>
            </div>
          ))}
        </div>

        {maxReached && (
          <p className="mt-2 text-xs text-blue-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            You&apos;ve reached the maximum of 3 books per transaction.
          </p>
        )}
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Notes <span className="text-zinc-500">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., For research paper reference"
            rows={3}
            className="flex w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={() => props.onOpenChange(false)}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
