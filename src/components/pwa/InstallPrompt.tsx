"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already dismissed হলে দেখাব না
    const dismissed = localStorage.getItem("pwa_dismissed");
    if (dismissed) return;

    // iOS Safari detect
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS-এ standalone mode নয় এবং browser এ হলে ৩ সেকেন্ড পর দেখাই
    if (ios && !("standalone" in navigator && (navigator as unknown as { standalone?: boolean }).standalone)) {
      setTimeout(() => setShow(true), 3000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShow(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa_dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] md:max-w-md md:left-auto md:right-4">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Install Tshastho App</p>
          {isIOS ? (
            <p className="text-xs text-purple-100 leading-snug">
              Tap <span className="font-bold">Share</span> → <span className="font-bold">Add to Home Screen</span>
            </p>
          ) : (
            <p className="text-xs text-purple-100 leading-snug">
              Fast access from home screen
            </p>
          )}
        </div>
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="bg-white text-purple-700 font-bold text-xs px-3 py-2 rounded-lg flex-shrink-0"
          >
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="text-white/70 hover:text-white flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
