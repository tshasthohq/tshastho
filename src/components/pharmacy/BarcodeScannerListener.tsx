'use client';

// Global barcode-scanner listener — Item 21
// Attaches a window keydown listener; detects keyboard-wedge scanner input.
// On scan, dispatches a CustomEvent 'tshastho:barcode-scanned' on window.

import { useEffect, useRef } from 'react';
import { createScannerDetector, playBeep, SCANNER_EVENT } from '@/lib/pharmacy/scanner-detector';

interface Props {
  /** Optional: filter scans by prefix (e.g. only when code starts with 'MED-') */
  prefixFilter?: string;
  /** Beep on successful detection */
  beep?: boolean;
  /** Beep on failed detection (short low tone) */
  failBeep?: boolean;
  /** Master enable toggle */
  enabled?: boolean;
}

export default function BarcodeScannerListener({
  prefixFilter,
  beep = true,
  failBeep = true,
  enabled = true,
}: Props) {
  const detectorRef = useRef<ReturnType<typeof createScannerDetector> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    const detector = createScannerDetector();
    detectorRef.current = detector;

    const onKey = (e: KeyboardEvent) => {
      // Skip if user is typing in a textarea (long-form input)
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'TEXTAREA') return;
      // Skip if inside a rich-text editor
      if (target && target.getAttribute('contenteditable') === 'true') return;

      const code = detector.handleKey(e);
      if (!code) return;

      const matches = !prefixFilter || code.startsWith(prefixFilter);
      if (!matches) return;

      // Prevent default for Enter that ended the scan (avoid form submit)
      if (beep) playBeep({ freq: 1400, durationMs: 70 });
      window.dispatchEvent(new CustomEvent(SCANNER_EVENT, { detail: { code } }));
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      detector.reset();
    };
  }, [enabled, prefixFilter, beep, failBeep]);

  return null;
}
