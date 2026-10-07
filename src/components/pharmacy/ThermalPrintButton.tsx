'use client';

// Thermal print button — Bluetooth ESC/POS primary, browser print fallback.
// Item 12 — Tshastho Pharmacy

import { useState, useCallback } from 'react';
import type { ReceiptData, PrinterConnectionType } from '@/lib/pharmacy/printer/types';
import { buildReceipt } from '@/lib/pharmacy/printer/receipt-builder';
import {
  isBluetoothSupported,
  requestPrinterDevice,
  connectPrinter,
  type ConnectedPrinter,
} from '@/lib/pharmacy/printer/bluetooth';

interface Props {
  receipt: ReceiptData;
  orderId?: string;
  onSuccess?: (logId: string) => void;
  onError?: (err: string) => void;
  className?: string;
}

type Status = 'idle' | 'connecting' | 'printing' | 'ok' | 'error';

export default function ThermalPrintButton({
  receipt,
  orderId,
  onSuccess,
  onError,
  className,
}: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  const logPrint = useCallback(
    async (params: {
      connectionType: PrinterConnectionType;
      deviceName?: string;
      bytesSent: number;
      success: boolean;
      errorMessage?: string;
    }) => {
      try {
        const res = await fetch('/api/pharmacy/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId ?? null,
            connectionType: params.connectionType,
            paperWidth: receipt.paperWidth,
            deviceName: params.deviceName ?? null,
            bytesSent: params.bytesSent,
            success: params.success,
            errorMessage: params.errorMessage ?? null,
            receiptData: receipt,
          }),
        });
        const json = await res.json();
        if (json?.success && json.logId) return json.logId as string;
        return null;
      } catch {
        return null;
      }
    },
    [orderId, receipt],
  );

  const handleBluetoothPrint = useCallback(async () => {
    setStatus('connecting');
    setMessage('Requesting printer…');
    let printer: ConnectedPrinter | null = null;
    let bytesSent = 0;
    try {
      if (!isBluetoothSupported()) {
        throw new Error('Web Bluetooth not supported. Use Chrome/Edge on HTTPS.');
      }
      const device = await requestPrinterDevice();
      setMessage(`Connecting to ${device.name ?? 'printer'}…`);
      printer = await connectPrinter(device);
      const bytes = buildReceipt(receipt);
      bytesSent = bytes.length;
      setMessage(`Sending ${bytesSent} bytes…`);
      setStatus('printing');
      await printer.write(bytes);
      setStatus('ok');
      setMessage(`Printed on ${device.name ?? 'printer'}`);
      const logId = await logPrint({
        connectionType: 'bluetooth',
        deviceName: device.name ?? undefined,
        bytesSent,
        success: true,
      });
      if (logId) onSuccess?.(logId);
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setMessage(msg);
      onError?.(msg);
      await logPrint({
        connectionType: 'bluetooth',
        bytesSent,
        success: false,
        errorMessage: msg,
      });
    } finally {
      if (printer) {
        try { await printer.disconnect(); } catch { /* noop */ }
      }
    }
  }, [receipt, logPrint, onSuccess, onError]);

  const handleBrowserPrint = useCallback(async () => {
    setStatus('printing');
    setMessage('Opening browser print…');
    try {
      window.print();
      setStatus('ok');
      setMessage('Browser print dialog opened');
      const logId = await logPrint({
        connectionType: 'browser',
        bytesSent: 0,
        success: true,
      });
      if (logId) onSuccess?.(logId);
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus('error');
      setMessage(msg);
      onError?.(msg);
      await logPrint({
        connectionType: 'browser',
        bytesSent: 0,
        success: false,
        errorMessage: msg,
      });
    }
  }, [logPrint, onSuccess, onError]);

  const isBusy = status === 'connecting' || status === 'printing';
  const btSupported = isBluetoothSupported();

  return (
    <div className="inline-flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleBluetoothPrint}
          disabled={isBusy || !btSupported}
          title={btSupported ? 'Print via Bluetooth thermal printer' : 'Bluetooth not available'}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
            isBusy || !btSupported
              ? 'cursor-not-allowed bg-gray-200 text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } ${className ?? ''}`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6.5 6.5L17.5 17.5M6.5 17.5L17.5 6.5M12 2v20" strokeLinecap="round" />
          </svg>
          {status === 'connecting' ? 'Connecting…' : status === 'printing' ? 'Printing…' : 'Print (Bluetooth)'}
        </button>

        <button
          type="button"
          onClick={handleBrowserPrint}
          disabled={isBusy}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Browser Print
        </button>
      </div>

      {message && (
        <p
          className={`text-xs ${
            status === 'error' ? 'text-red-600' : status === 'ok' ? 'text-green-600' : 'text-gray-600'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
