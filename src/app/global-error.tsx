'use client';

// Global error boundary — Sentry integration (Item 24)
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'sans-serif', padding: 40 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Something went wrong</h1>
        <p style={{ color: '#555', marginTop: 8 }}>
          The error has been logged. Reference: {error.digest ?? 'unknown'}
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#2563eb',
            color: 'white',
            border: 0,
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
