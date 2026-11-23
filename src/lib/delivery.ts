import { prisma } from "@/lib/prisma";

const db: any = prisma;

export const LATE_MINUTES = 45;
export const ACTIVE_STATUSES = ["PENDING", "ASSIGNED", "PICKED_UP", "ON_THE_WAY"];

const KEYS = {
  enabled: "tshastho_delivery_enabled",
  reason: "tshastho_delivery_disabled_reason",
  changedAt: "tshastho_delivery_changed_at",
  riderPayout: "tshastho_delivery_rider_payout",
};

const NEXT: Record<string, string[]> = {
  PENDING: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["PICKED_UP", "PENDING", "FAILED", "CANCELLED"],
  PICKED_UP: ["ON_THE_WAY", "FAILED"],
  ON_THE_WAY: ["DELIVERED", "FAILED"],
};

export async function getDeliverySettings() {
  const rows = await prisma.systemSetting.findMany({ where: { key: { in: Object.values(KEYS) } } });
  const m = new Map<string, string>(rows.map((r) => [r.key, r.value] as [string, string]));
  return {
    enabled: m.get(KEYS.enabled) === "true", // OFF until the super admin turns it on
    reason: m.get(KEYS.reason) || "",
    changedAt: m.get(KEYS.changedAt) || null,
    riderPayout: Number(m.get(KEYS.riderPayout) ?? 40) || 0,
  };
}

async function setSetting(key: string, value: string) {
  await prisma.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export async function saveDeliverySettings(input: { enabled?: boolean; reason?: string; riderPayout?: number }) {
  if (typeof input.enabled === "boolean") {
    await setSetting(KEYS.enabled, String(input.enabled));
    await setSetting(KEYS.reason, input.enabled ? "" : input.reason || "");
    await setSetting(KEYS.changedAt, new Date().toISOString());
  }
  if (typeof input.riderPayout === "number") {
    await setSetting(KEYS.riderPayout, String(Math.max(0, input.riderPayout)));
  }
}

export async function createDeliveryJob(orderId: string, mode: "PHARMACY" | "TSHASTHO", actorId?: string) {
  const existing = await db.deliveryJob.findUnique({ where: { orderId } });
  if (existing) return existing;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, pharmacyId: true, deliveryFee: true, dueAmount: true },
  });
  if (!order) throw new Error("Order not found");

  const settings = await getDeliverySettings();
  if (mode === "TSHASTHO" && !settings.enabled) throw new Error("Tshastho delivery is currently turned off");

  const customerFee = Number(order.deliveryFee || 0);
  const riderPayout = mode === "TSHASTHO" ? settings.riderPayout : 0;
  const platformEarn = mode === "TSHASTHO" ? customerFee - riderPayout : 0;

  return db.deliveryJob.create({
    data: {
      jobNumber: `DLV-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      orderId,
      pharmacyId: order.pharmacyId,
      mode,
      customerFee,
      riderPayout,
      platformEarn,
      codAmount: Number(order.dueAmount || 0),
      events: { create: [{ status: "PENDING", note: `Job created (${mode})`, actorId: actorId || null }] },
    },
  });
}

export async function assignRider(jobId: string, riderId: string, actorId?: string) {
  const [job, rider] = await Promise.all([
    db.deliveryJob.findUnique({ where: { id: jobId } }),
    db.deliveryRider.findUnique({ where: { id: riderId } }),
  ]);
  if (!job) throw new Error("Job not found");
  if (!rider || !rider.isActive) throw new Error("Rider is not available");
  if (!["PENDING", "ASSIGNED"].includes(job.status)) throw new Error("This job can no longer be reassigned");
  if (rider.ownerType !== job.mode) throw new Error("This rider cannot take this job type");
  if (job.mode === "PHARMACY" && rider.pharmacyId !== job.pharmacyId) throw new Error("Rider belongs to another pharmacy");

  return db.deliveryJob.update({
    where: { id: jobId },
    data: {
      riderId,
      status: "ASSIGNED",
      assignedAt: new Date(),
      events: { create: { status: "ASSIGNED", note: `Assigned to ${rider.name}`, actorId: actorId || null } },
    },
  });
}

export async function moveJob(jobId: string, to: string, opts: { actorId?: string; reason?: string } = {}) {
  const result = await prisma.$transaction(
    async (tx: any) => {
      const job = await tx.deliveryJob.findUnique({ where: { id: jobId } });
      if (!job) throw new Error("Job not found");
      if (!(NEXT[job.status] || []).includes(to)) throw new Error(`Cannot move from ${job.status} to ${to}`);
      if (to === "PICKED_UP" && !job.riderId) throw new Error("Assign a rider first");
      if (to === "FAILED" && !opts.reason) throw new Error("A reason is required");

      const data: any = { status: to };
      if (to === "PENDING") { data.riderId = null; data.assignedAt = null; }
      if (to === "PICKED_UP") data.pickedUpAt = new Date();
      if (to === "DELIVERED") { data.deliveredAt = new Date(); data.codCollected = job.codAmount; }
      if (to === "FAILED") data.failureReason = opts.reason;
      if (to === "CANCELLED") data.notes = opts.reason || job.notes;

      const updated = await tx.deliveryJob.update({ where: { id: jobId }, data });
      await tx.deliveryEvent.create({
        data: { jobId, status: to, note: opts.reason || null, actorId: opts.actorId || null },
      });

      const orderStatus = to === "PICKED_UP" || to === "ON_THE_WAY" ? "OUT_FOR_DELIVERY" : to === "DELIVERED" ? "DELIVERED" : null;
      let order: any = null;
      if (orderStatus) {
        order = await tx.order.update({
          where: { id: job.orderId },
          data: { status: orderStatus },
          select: { patientId: true, orderNumber: true },
        });
      }
      return { updated, order };
    },
    { timeout: 20000, maxWait: 10000 }
  );

  const note =
    to === "PICKED_UP"
      ? { title: "Out for Delivery", msg: "Your order is on the way.", type: "out_for_delivery" }
      : to === "DELIVERED"
      ? { title: "Order Delivered", msg: "Your order has been delivered. Thank you!", type: "delivered" }
      : null;
  if (note && result.order?.patientId) {
    try {
      await prisma.notification.create({
        data: {
          userId: result.order.patientId,
          title: note.title,
          message: `${result.order.orderNumber}: ${note.msg}`,
          type: note.type,
          link: "/dashboard/orders",
        },
      });
    } catch (e) {
      console.error("[DELIVERY_NOTIFY]", e);
    }
  }
  return result.updated;
}
