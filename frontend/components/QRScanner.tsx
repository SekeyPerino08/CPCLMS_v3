"use client";

import { useState, useEffect, useRef } from "react";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setScanning(true);
    setError("");
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        setError("Camera not available. Use manual entry below.");
        setScanning(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        scanBarcode();
      } else {
        setError("BarcodeDetector not supported. Use manual entry below.");
        setScanning(false);
      }
    } catch {
      setError("Camera access denied. Use manual entry below.");
      setScanning(false);
    }
  };

  const scanBarcode = async () => {
    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const check = setInterval(async () => {
        if (!videoRef.current || !streamRef.current) {
          clearInterval(check);
          return;
        }
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            clearInterval(check);
            stopCamera();
            onScan(barcodes[0].rawValue);
          }
        } catch {
          // continue
        }
      }, 500);
      setTimeout(() => {
        clearInterval(check);
        if (scanning) {
          setScanning(false);
          setError("Scan timed out. Enter code manually.");
        }
      }, 30000);
    } catch {
      setError("Barcode detector failed. Enter manually.");
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-xl bg-white shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-800">Scan QR Code</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-100 text-zinc-400">Close</button>
        </div>
        <div className="bg-zinc-900 rounded-lg overflow-hidden mb-4" style={{ minHeight: "200px" }}>
          {scanning ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" style={{ minHeight: "200px" }} />
          ) : (
            <div className="flex items-center justify-center" style={{ minHeight: "200px" }}>
              <p className="text-zinc-400 text-sm">Camera inactive</p>
            </div>
          )}
        </div>
        {error && (
          <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">{error}</div>
        )}
        <form onSubmit={handleManualSubmit}>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Or enter code manually</label>
          <div className="flex gap-2">
            <input type="text" value={manualInput} onChange={(e) => setManualInput(e.target.value)} placeholder="Paste QR data here..." className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <button type="submit" disabled={!manualInput.trim()} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">Submit</button>
          </div>
        </form>
        <div className="mt-4 flex justify-center">
          <button onClick={scanning ? stopCamera : startCamera} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            {scanning ? "Stop Scanning" : "Restart Camera"}
          </button>
        </div>
      </div>
    </div>
  );
}
