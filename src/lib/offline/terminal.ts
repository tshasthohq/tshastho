// Client terminal identity + registration — Item 20

const LS_KEY = 'tshastho:pos-terminal-id';

export function getOrCreateTerminalId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(LS_KEY);
  if (!id) {
    id = 'term-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));
    window.localStorage.setItem(LS_KEY, id);
  }
  return id;
}

function detectOS(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'unknown';
}

export async function registerTerminal(deviceId: string, name?: string): Promise<void> {
  try {
    await fetch('/api/pharmacy/pos/terminals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'register',
        deviceId,
        name: name ?? 'POS ' + detectOS(),
        os: detectOS(),
        model: typeof navigator !== 'undefined' ? navigator.platform : undefined,
      }),
    });
  } catch { /* silent */ }
}

export async function heartbeatTerminal(deviceId: string): Promise<void> {
  try {
    await fetch('/api/pharmacy/pos/terminals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'heartbeat', deviceId }),
    });
  } catch { /* silent */ }
}
