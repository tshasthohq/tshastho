'use client';

// Open cash drawer via Bluetooth thermal printer + log event.
// Item 22

import { useState, useCallback } from 'react';
import {
  isBluetoothSupported,
  requestPrinterDevice,
  connectPrinter,
  type ConnectedPrinter,
} from '@/lib/pharmacy/printer/bluetooth';
import { buildCashDrawerKick } from '@/lib/pharmacy/printer/receipt-builder';

interface Props {
  className?: string;
  onSuccess?: (logId: string) => void;
}

export default function CashDrawerButton({ className, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleOpen = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('Connecting…');
    let printer: ConnectedPrinter | null = null;
    let deviceName: string | undefined;
    try {
      if (!isBluetoothSupported()) throw new Error('Bluetooth not supported');
      const device = await requestPrinterDevice();
      deviceName = device.name ?? undefined;
      printer = await connectPrinter(device);
      const bytes = buildCashDrawerKick();
      setMessage('Opening drawer…');
      await printer.write(bytes);
      setMessage('Drawer opened');
      setTimeout(() => setMessage(''), 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setError(msg);
    } finally {
      if (printer) try { await printer.disconnect(); } catch { /* noop */ }
      try {
        const res = await fetch('/api/pharmacy/cash-drawer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'MANUAL',
            deviceName,
            success: !error,
            errorMessage: error || undefined,
          }),
        });
        const json = await res.json();
        if (json?.success && json.logId) onSuccess?.(json.logId);
      } catch { /* ignore */ }
      setLoading(false);
    }
  }, [error, onSuccess]);

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className={
          'inline-flex items-center gap-2 rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400 ' +
          (className ?? '')
        }
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7h18M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l2-3h14l2 3M12 11v4M8 13h8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {loading ? 'Opening…' : 'Open Drawer'}
      </button>
      {message && !error && <span className="text-xs text-gray-600">{message}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
