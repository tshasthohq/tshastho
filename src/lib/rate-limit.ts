// Simple in-memory rate limiter (Replace with Redis/Upstash in production)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10;

export function rateLimit(ip: string): { success: boolean; limit: number; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > WINDOW_MS) {
    record.count = 0;
    record.lastReset = now;
  }

  record.count++;
  rateLimitMap.set(ip, record);

  const remaining = Math.max(0, MAX_REQUESTS - record.count);
  return { success: record.count <= MAX_REQUESTS, limit: MAX_REQUESTS, remaining };
}
