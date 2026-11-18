import * as webpush from 'web-push';

let ready = false;
function init() {
  if (ready) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:support@tshastho.com', pub, priv);
  ready = true;
  return true;
}

export async function sendPush(userId: string, payload: { title: string; body: string; url?: string; tag?: string }) {
  try {
    if (!init()) return;
    const { prisma } = await import('@/lib/prisma');
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload)
        );
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: s.endpoint } });
        }
      }
    }));
  } catch (e) {
    console.error('[PUSH]', e);
  }
}
