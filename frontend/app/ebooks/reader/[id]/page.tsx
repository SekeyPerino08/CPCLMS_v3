"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { PDFViewer } from "@/components/PDFViewer";
import ProtectedRoute from "@/components/ProtectedRoute";
import api from "@/lib/api";

export default function EBookReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [ebook, setEbook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEBook();
  }, [id]);

  const loadEBook = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ebooks/" + id);
      if (res.success && res.data) {
        setEbook(res.data);
      } else {
        setError("E-book not found");
      }
    } catch {
      setError("Failed to load e-book");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !ebook) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-4xl mb-4">[FILE]</p>
            <p className="text-zinc-500 mb-4">{error || "E-book not available"}</p>
            <button onClick={() => router.back()} className="text-emerald-600 hover:underline">Go Back</button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PDFViewer url={ebook.fileUrl} title={ebook.title} bookId={ebook.id} onClose={() => router.back()} />
    </ProtectedRoute>
  );
}
