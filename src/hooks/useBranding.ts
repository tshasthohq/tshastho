"use client";
import { useEffect, useState } from "react";

interface Branding {
  logo: string;
  tagline: string;
  bannerHome: string;
  bannerOrders: string;
  supportPhone: string;
  supportEmail: string;
}

const defaultBranding: Branding = {
  logo: "",
  tagline: "Connected Healthcare. Trusted Care.",
  bannerHome: "",
  bannerOrders: "",
  supportPhone: "01737326555",
  supportEmail: "",
};

let cachedBranding: Branding | null = null;

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(cachedBranding || defaultBranding);
  const [loading, setLoading] = useState(!cachedBranding);

  useEffect(() => {
    if (cachedBranding) {
      setLoading(false);
      return;
    }

    fetch("/api/branding")
      .then(res => res.json())
      .then(data => {
        if (data.branding) {
          cachedBranding = data.branding;
          setBranding(data.branding);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { branding, loading };
}
