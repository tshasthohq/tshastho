import { sendPush } from "@/lib/push";
import { BloodGroup } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { eligibleWhere, groupLabel } from "@/lib/blood";

const MAX_ALERTS = 30;
const PER_HOUR = 2;

type Req = {
  id: string;
  requesterId: string;
  bloodGroup: BloodGroup;
  district: string;
  upazila: string | null;
  hospital: string;
  urgency: string;
  units: number;
};

export async function alertDonors(req: Req): Promise<number> {
  const candidates = await prisma.bloodDonor.findMany({
    where: {
      ...eligibleWhere(),
      bloodGroup: req.bloodGroup,
      district: req.district,
      userId: { not: req.requesterId },
    },
    select: { userId: true, upazila: true, verified: true },
    take: 200,
  });
  if (candidates.length === 0) return 0;

  const ids = candidates.map((c) => c.userId);
  const recent = await prisma.notification.findMany({
    where: {
      userId: { in: ids },
      category: "BLOOD_ALERT",
      createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
    },
    select: { userId: true },
  });
  const cnt = new Map<string, number>();
  for (const r of recent) cnt.set(r.userId, (cnt.get(r.userId) || 0) + 1);

  const score = (c: { upazila: string | null; verified: boolean }) =>
    (req.upazila && c.upazila === req.upazila ? 2 : 0) + (c.verified ? 1 : 0);

  const targets = candidates
    .filter((c) => (cnt.get(c.userId) || 0) < PER_HOUR)
    .sort((a, b) => score(b) - score(a))
    .slice(0, MAX_ALERTS);
  if (targets.length === 0) return 0;

  const urgent = req.urgency === "CRITICAL";
  await prisma.notification.createMany({
    data: targets.map((t) => ({
      userId: t.userId,
      title: `${urgent ? "Urgent: " : ""}${groupLabel(req.bloodGroup)} blood needed`,
      message: `${req.units} bag(s) needed at ${req.hospital}, ${req.district}. Tap to see and help.`,
      type: "alert",
      category: "BLOOD_ALERT",
      link: "/blood-bank",
    })),
  });
  const pushTitle = `${urgent ? "Urgent: " : ""}${groupLabel(req.bloodGroup)} blood needed`;
  const pushBody = `${req.units} bag(s) needed at ${req.hospital}, ${req.district}. Tap to help.`;
  await Promise.allSettled(
    targets.map((t) =>
      sendPush(t.userId, { title: pushTitle, body: pushBody, url: "/blood-bank", tag: `blood-${req.id}` })
    )
  );
  return targets.length;
}
