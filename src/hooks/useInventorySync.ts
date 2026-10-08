'use client';

// Terminal lifecycle + inventory sync tick — Item 20
import { useEffect, useState } from 'react';
import { getOrCreateTerminalId, registerTerminal, heartbeatTerminal } from '@/lib/offline/terminal';

export function useInventorySync(opts?: { heartbeatMs?: number; tickMs?: number }) {
  const heartbeatMs = opts?.heartbeatMs ?? 60_000;
  const tickMs = opts?.tickMs ?? 30_000;
  const [terminalId, setTerminalId] = useState<string>('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = getOrCreateTerminalId();
    setTerminalId(id);
    registerTerminal(id).catch(() => undefined);

    const hb = setInterval(() => {
      heartbeatTerminal(id).catch(() => undefined);
    }, heartbeatMs);

    const t = setInterval(() => setTick((n) => n + 1), tickMs);

    return () => {
      clearInterval(hb);
      clearInterval(t);
    };
  }, [heartbeatMs, tickMs]);

  return { terminalId, tick };
}
