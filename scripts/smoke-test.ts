// UAT smoke tests — Item 25
// Hits real API endpoints with a test session cookie.
// Run: APP_URL=http://localhost:3000 npx tsx scripts/smoke-test.ts

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const COOKIE = process.env.UAT_COOKIE || ''; // paste session cookie

interface TestResult {
  name: string;
  ok: boolean;
  status?: number;
  ms: number;
  detail?: string;
}

const results: TestResult[] = [];

async function hit(name: string, path: string, opts?: RequestInit): Promise<TestResult> {
  const start = Date.now();
  try {
    const res = await fetch(APP_URL + path, {
      ...opts,
      headers: {
        ...(opts?.headers ?? {}),
        ...(COOKIE ? { cookie: COOKIE } : {}),
      },
    });
    const ms = Date.now() - start;
    const ok = res.status >= 200 && res.status < 400;
    let detail = '';
    if (!ok) {
      detail = (await res.text().catch(() => '')).slice(0, 200);
    }
    return { name, ok, status: res.status, ms, detail };
  } catch (err) {
    return {
      name,
      ok: false,
      ms: Date.now() - start,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  console.log('🔥 Smoke tests @', APP_URL);
  console.log('Cookie:', COOKIE ? 'set' : 'MISSING (some tests may 401)');
  console.log('');

  const tests: Array<() => Promise<TestResult>> = [
    // Health
    () => hit('Homepage', '/'),
    () => hit('Pharmacy POS page', '/pharmacy/pos'),
    // APIs (expect 200/201 or 401 — both prove server up)
    () => hit('Barcode scan API', '/api/pharmacy/pos/scan?barcode=UAT-MED-001'),
    () => hit('Cash drawer list', '/api/pharmacy/cash-drawer'),
    () => hit('Recalls list', '/api/pharmacy/recalls'),
    () => hit('Staff commissions', '/api/pharmacy/staff/commissions'),
    () => hit('Retention stats', '/api/pharmacy/prescriptions/retention/stats'),
    () => hit('Reviews list', '/api/pharmacy/reviews?pharmacyId=uat-pharmacy-001'),
    // Public health check
    () => hit('Next health route', '/api/health').catch(() => ({ name: 'Next health route', ok: false, ms: 0, detail: 'no /api/health route' })),
  ];

  for (const t of tests) {
    const r = await t();
    results.push(r);
    const icon = r.ok ? '✅' : (r.status === 401 ? '🔒' : '❌');
    const statusStr = r.status ? String(r.status) : 'ERR';
    console.log(`${icon} [${statusStr}] ${r.name} (${r.ms}ms)${r.detail ? ' — ' + r.detail : ''}`);
  }

  const pass = results.filter((r) => r.ok).length;
  const warn = results.filter((r) => r.status === 401).length;
  const fail = results.length - pass - warn;

  console.log('');
  console.log(`📊 Summary: ${pass} pass | ${warn} auth-required | ${fail} fail | ${results.length} total`);

  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error('Smoke test runner failed:', e);
  process.exit(1);
});
