"use client";

import React from "react";

export function Dialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => props.onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/50 max-h-[85vh] overflow-y-auto">
        <button
          onClick={() => props.onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none z-10"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {props.children}
      </div>
    </div>
  );
}

export function DialogHeader(props: { className?: string; children: React.ReactNode }) {
  return <div className={`flex flex-col space-y-1.5 mb-4 ${props.className || ""}`}>{props.children}</div>;
}

export function DialogTitle(props: { className?: string; children: React.ReactNode }) {
  return <h2 className={`text-lg font-semibold text-white ${props.className || ""}`}>{props.children}</h2>;
}

export function DialogDescription(props: { className?: string; children: React.ReactNode }) {
  return <p className={`text-sm text-zinc-400 ${props.className || ""}`}>{props.children}</p>;
}
