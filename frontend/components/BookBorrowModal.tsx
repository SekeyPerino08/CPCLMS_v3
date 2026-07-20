"use client";

import { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function BookBorrowModal(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  book: any;
  onSuccess: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      props.onSuccess();
      props.onOpenChange(false);
      setNotes("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogHeader>
        <DialogTitle>Request to Borrow</DialogTitle>
        <DialogDescription>Submit a request to borrow this book from the library.</DialogDescription>
      </DialogHeader>

      <div className="bg-zinc-50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-lg">📖</div>
          <div className="min-w-0">
            <p className="font-medium text-zinc-800 text-sm truncate">{props.book.title}</p>
            <p className="text-xs text-zinc-500 truncate">{props.book.author} · {props.book.accessionNo}</p>
          </div>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Notes <span className="text-zinc-400">(optional)</span></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., For research paper reference"
            rows={3}
            className="flex w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)} className="flex-1" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
