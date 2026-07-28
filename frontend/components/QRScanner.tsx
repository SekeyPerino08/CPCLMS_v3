"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const SCANNER_ELEMENT_ID = "qr-scanner-element";

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [lastResult, setLastResult] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, []);

  // List available cameras
  const listCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!mountedRef.current) return;
      if (devices.length > 0) {
        const camList = devices.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id.slice(0, 8)}` }));
        setCameras(camList);
        // Prefer back/environment camera
        const backCam = camList.find(
          (c) => c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("environment")
        );
        setSelectedCamera(backCam?.id || camList[0].id);
      } else {
        setError("No cameras found. Use manual entry below.");
      }
    } catch {
      if (mountedRef.current) {
        setError("Could not access camera list. Use manual entry below.");
      }
    }
  }, []);

  // Start scanner
  const startScanner = useCallback(async (cameraId: string) => {
    if (!cameraId) return;
    setScanning(true);
    setError("");

    try {
      // Ensure the element exists
      const existingEl = document.getElementById(SCANNER_ELEMENT_ID);
      if (!existingEl) {
        setError("Scanner element not found");
        setScanning(false);
        return;
      }

      // Clean up any previous instance
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
      }

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          if (!mountedRef.current) return;
          setLastResult(decodedText);
          // Debounce: prevent double-scan
          stopScanner();
          onScan(decodedText);
        },
        () => {
          // Ignore individual frame failures
        }
      );
    } catch (err: any) {
      if (!mountedRef.current) return;
      console.error("Scanner start failed:", err);

      // Fallback: try BarcodeDetector API
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        setError("html5-qrcode failed. Falling back to native BarcodeDetector...");
        tryFallbackBarcodeDetector();
      } else {
        setError(err?.message || "Failed to start camera. Use manual entry below.");
        setScanning(false);
      }
    }
  }, [onScan]);

  // Fallback: use native BarcodeDetector API
  const tryFallbackBarcodeDetector = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

      const videoEl = document.createElement("video");
      videoEl.srcObject = stream;
      videoEl.setAttribute("playsinline", "true");
      videoEl.play();

      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      const checkInterval = setInterval(async () => {
        if (!mountedRef.current) {
          clearInterval(checkInterval);
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        try {
          const barcodes = await detector.detect(videoEl);
          if (barcodes.length > 0) {
            clearInterval(checkInterval);
            stream.getTracks().forEach(t => t.stop());
            videoEl.remove();
            if (mountedRef.current) {
              setScanning(false);
              onScan(barcodes[0].rawValue);
            }
          }
        } catch {
          // continue scanning
        }
      }, 500);

      setTimeout(() => {
        clearInterval(checkInterval);
        stream.getTracks().forEach(t => t.stop());
        videoEl.remove();
        if (mountedRef.current) {
          setScanning(false);
          if (!lastResult) {
            setError("Scan timed out. Enter code manually.");
          }
        }
      }, 30000);
    } catch {
      if (mountedRef.current) {
        setError("Camera access denied. Use manual entry below.");
        setScanning(false);
      }
    }
  }, [onScan, lastResult]);

  // Stop scanner
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  // Initialize on mount
  useEffect(() => {
    listCameras();
  }, [listCameras]);

  // Start scanning when camera is selected
  useEffect(() => {
    if (selectedCamera && !scanning) {
      startScanner(selectedCamera);
    }
  }, [selectedCamera]);

  const handleCameraChange = (cameraId: string) => {
    stopScanner();
    setSelectedCamera(cameraId);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setLastResult(manualInput.trim());
      onScan(manualInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md rounded-xl bg-white shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-800">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-100 text-zinc-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera selector */}
        {cameras.length > 1 && (
          <div className="mb-3">
            <select
              value={selectedCamera}
              onChange={(e) => handleCameraChange(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Scanner viewport */}
        <div className="bg-zinc-900 rounded-lg overflow-hidden mb-4 relative" style={{ minHeight: "250px" }}>
          {/* HTML5 QR Code scanner mounts here */}
          <div id={SCANNER_ELEMENT_ID} className="w-full" style={{ minHeight: "250px" }} />

          {!scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-zinc-400 text-sm">Camera inactive</p>
            </div>
          )}

          {/* Scan overlay */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-emerald-400 rounded-lg opacity-60" />
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="text-xs text-white/70 bg-black/40 px-2 py-1 rounded-full">
                  Point at QR code
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error messages */}
        {error && (
          <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            {error}
          </div>
        )}

        {/* Manual entry */}
        <form onSubmit={handleManualSubmit} className="mb-3">
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Or enter code manually
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Paste QR data here..."
              className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Submit
            </button>
          </div>
        </form>

        {/* Control buttons */}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              if (scanning) {
                stopScanner();
              } else {
                setError("");
                listCameras();
              }
            }}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            {scanning ? "Stop Scanning" : "Restart Camera"}
          </button>
        </div>

        {/* Last result indicator */}
        {lastResult && (
          <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 truncate">
            ✅ Scanned: {lastResult.length > 50 ? lastResult.slice(0, 50) + "..." : lastResult}
          </div>
        )}
      </div>
    </div>
  );
}

// Extend Window type for BarcodeDetector
declare global {
  interface Window {
    BarcodeDetector?: new (config?: { formats: string[] }) => {
      detect(image: HTMLVideoElement): Promise<{ rawValue: string }[]>;
    };
  }
}

