"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  disabled?: boolean;
}

export function BarcodeScanner({ onScan, disabled }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = useId().replace(/:/g, "");

  const stopScanner = async () => {
    const instance = scannerRef.current;
    scannerRef.current = null;
    if (instance) {
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
        instance.clear();
      } catch {
        // Ignore cleanup errors
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isScanning) return;

    let cancelled = false;
    const html5QrCode = new Html5Qrcode(regionId);
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 140 } },
        (decodedText) => {
          if (cancelled) return;
          void stopScanner().then(() => {
            onScan(decodedText.trim());
          });
        },
        () => {
          // Ignore per-frame decode misses
        }
      )
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Kamerazugriff fehlgeschlagen.";
        setError(
          message.includes("Permission") || message.includes("NotAllowed")
            ? "Kameraberechtigung verweigert. Bitte Barcode manuell eingeben."
            : "Kamera konnte nicht gestartet werden."
        );
        setIsScanning(false);
      });

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [isScanning, onScan, regionId]);

  return (
    <div className="space-y-2">
      {!isScanning ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setError(null);
            setIsScanning(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <Camera className="h-4 w-4" />
          <span>Ausweis-Barcode scannen</span>
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-black dark:border-zinc-800">
          <div id={regionId} className="w-full" />
          <button
            type="button"
            onClick={() => void stopScanner()}
            aria-label="Scanner schließen"
            className="absolute right-2 top-2 z-10 rounded-full bg-zinc-900/80 p-1.5 text-white transition hover:bg-zinc-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
