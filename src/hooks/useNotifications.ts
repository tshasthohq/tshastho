"use client";
import { useCallback, useEffect, useRef, useState } from "react";

let audioCtx: AudioContext | null = null;

function unlockAudio() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch {}
}

export function playNotificationSound() {
  try {
    unlockAudio();
    if (!audioCtx || audioCtx.state !== "running") return;
    const ctx = audioCtx;
    const t0 = ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = t0 + i * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.55);
    });
    if (navigator.vibrate) navigator.vibrate(120);
  } catch {}
}

export function useNotifications(opts: { sound?: boolean; intervalMs?: number } = {}) {
  const { sound = true, intervalMs = 15000 } = opts;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const seen = useRef<Set<string> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/summary", { cache: "no-store", credentials: "include" });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      const list: any[] = data.notifications || [];
      if (seen.current === null) {
        seen.current = new Set(list.map((n) => n.id));
      } else {
        const fresh = list.filter((n) => !n.isRead && !seen.current!.has(n.id));
        list.forEach((n) => seen.current!.add(n.id));
        if (fresh.length > 0 && sound) playNotificationSound();
      }
      setNotifications(list);
      setUnread(data.unread || 0);
    } catch {}
    setLoading(false);
  }, [sound]);

  useEffect(() => {
    const onTap = () => unlockAudio();
    window.addEventListener("pointerdown", onTap, { once: true });
    window.addEventListener("keydown", onTap, { once: true });
    refresh();
    const timer = setInterval(() => { if (!document.hidden) refresh(); }, intervalMs);
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pointerdown", onTap);
      window.removeEventListener("keydown", onTap);
    };
  }, [refresh, intervalMs]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onMsg = (e: MessageEvent) => { if (e.data?.type === "push-received") refresh(); };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await fetch("/api/notifications/summary", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((p) => p.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    await fetch("/api/notifications/summary", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  }, []);

  return { notifications, unread, loading, refresh, markRead, markAllRead };
}
