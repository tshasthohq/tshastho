"use client";
import { useBranding } from "@/hooks/useBranding";

interface LogoProps {
  size?: number;
  showText?: boolean;
  showTagline?: boolean;
  variant?: "color" | "white" | "dark";
}

export function TshasthoLogo({ 
  size = 40, 
  showText = true, 
  showTagline = false,
  variant = "color" 
}: LogoProps) {
  const { branding } = useBranding();
  const textSize = size * 0.55;
  const taglineSize = size * 0.17;
  const baseId = `tsh-${Math.random().toString(36).substring(7)}`;
  
  const textColor = variant === "white" ? "#ffffff" : "#0f172a";
  const taglineColor = variant === "white" ? "rgba(255,255,255,0.8)" : "#64748b";

  // If admin uploaded logo, use it
  if (branding.logo && showText) {
    return (
      <img 
        src={branding.logo} 
        alt="Tshastho" 
        style={{ height: size, objectFit: "contain" }}
      />
    );
  }

  if (branding.logo && !showText) {
    return (
      <img 
        src={branding.logo} 
        alt="Tshastho" 
        style={{ height: size, objectFit: "contain" }}
      />
    );
  }

  // Default SVG fallback
  return (
    <div style={{ display: "inline-flex", alignItems: "flex-start", gap: size * 0.18 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id={`${baseId}-g1`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id={`${baseId}-g2`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id={`${baseId}-g3`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        <path
          d="M 18 22 Q 12 22 12 28 Q 12 34 18 34 L 42 34 Q 50 34 54 42 Q 58 34 66 34 L 82 34 Q 88 34 88 28 Q 88 22 82 22 Z"
          fill={`url(#${baseId}-g1)`}
        />
        <circle cx="32" cy="22" r="7" fill="white" />
        <path
          d="M 32 42 Q 28 50 28 62 L 28 86 Q 28 92 34 92 Q 40 92 40 86 L 40 68 Q 40 58 36 50 Z"
          fill={`url(#${baseId}-g3)`}
        />
        <path
          d="M 50 42 Q 60 50 62 64 Q 64 78 56 88 Q 54 91 50 90 Q 52 82 50 72 Q 48 62 46 52 Z"
          fill={`url(#${baseId}-g2)`}
        />
      </svg>

      {showText && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, paddingTop: size * 0.05 }}>
          <span
            style={{
              fontSize: textSize,
              fontWeight: 800,
              background: variant === "white" ? "none" : "linear-gradient(90deg, #2563eb 0%, #0891b2 40%, #10b981 100%)",
              WebkitBackgroundClip: variant === "white" ? "unset" : "text",
              WebkitTextFillColor: variant === "white" ? "#ffffff" : "transparent",
              backgroundClip: variant === "white" ? "unset" : "text",
              color: variant === "white" ? "#ffffff" : undefined,
              letterSpacing: "-0.8px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            Tshastho
          </span>
          {showTagline && (
            <span
              style={{
                fontSize: taglineSize,
                color: taglineColor,
                marginTop: size * 0.08,
                fontWeight: 400,
                letterSpacing: "0.3px",
              }}
            >
              {branding.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
