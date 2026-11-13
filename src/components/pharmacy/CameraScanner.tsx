"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, RefreshCw } from "lucide-react";

interface Props {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function CameraScanner({ onScan, onClose }: Props) {
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "camera-reader";

  useEffect(() => {
    // স্ক্যানার চালু করা
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          supportedScanTypes: [0], // Camera based scan
        };

        await scanner.start(
          { facingMode: "environment" }, // পেছনের ক্যামেরা ব্যবহার করবে
          config,
          (decodedText) => {
            // স্ক্যান সফল হলে
            onScan(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // স্ক্যান এরর (কন্টিনিউয়াসলি হবে, তাই কিছু করতে হবে না)
          }
        );
      } catch (err) {
        console.error(err);
        setError("Camera access denied or not available.");
      }
    };

    startScanner();

    // ক্লিনআপ: মডাল বন্ধ হলে ক্যামেরা অফ হবে
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Camera size={18} className="text-indigo-400" /> Scan Barcode
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-700 text-white rounded-full hover:bg-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative w-full aspect-square bg-black flex items-center justify-center">
          <div id={elementId} className="w-full h-full"></div>
          
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900">
              <p className="text-red-400 text-sm font-medium">{error}</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm">Close</button>
            </div>
          ) : (
             <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/50 rounded-lg m-8"></div>
          )}
        </div>

        <div className="p-4 text-center bg-slate-800">
          <p className="text-xs text-slate-400">Position barcode within the frame.</p>
        </div>
      </div>
    </div>
  );
}
