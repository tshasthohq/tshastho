import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';
import { recordStockMovement } from "@/lib/pharmacy/stock";
import { recordOrderSale } from '@/lib/pharmacy/ledger';
import { sendEmail, emailTemplates } from '@/lib/email';
import { sendWhatsApp } from "@/lib/whatsapp";
import { earnPoints } from "@/lib/pharmacy/loyalty";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    // 🔥 branchId রিসিভ করা হচ্ছে
    const { deliveryAddress, deliveryPhone, receiverPhone, paymentMethod, notes, deliveryCharge, paidInput, prescriptionUrl, branchId } = await req.json();

    const user = auth.user!;

    if (!branchId) {
      return NextResponse.json({ message: "Please select a delivery branch" }, { status: 400 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { medicine: { include: { pharmacy: true } } },
    });

    if (cartItems.length === 0) return NextResponse.json({ message: "Cart is empty" }, { status: 400 });

    const byPharmacy: any = {};
    for (const item of cartItems) {
      const pid = item.medicine.pharmacyId;
      if (!byPharmacy[pid]) byPharmacy[pid] = [];
      byPharmacy[pid].push(item);
    }

    const orders = [];
    let remainingPaid = Math.max(parseFloat(paidInput) || 0, 0);

    const deliveryFeePerPharmacy = Number(deliveryCharge) / Object.keys(byPharmacy).length;

    for (const pharmacyId of Object.keys(byPharmacy)) {
      const items = byPharmacy[pharmacyId];

      let totalAmount = 0;
      let totalCost = 0;

      const orderItems = items.map((item: any) => {
        const selling = parseFloat(item.medicine.sellingPrice);
        const purchase = parseFloat(item.medicine.purchasePrice);
        const discount = parseFloat(item.medicine.discountPercent) || 0;
        const discountedPiecePrice = selling - (selling * discount) / 100;

        const unitType = item.unitType || "piece";
        let multiplier = 1;
        if (unitType === "strip") multiplier = item.medicine.stripSize || 10;
        if (unitType === "box") multiplier = item.medicine.boxSize || 100;

        const unitPrice = discountedPiecePrice * multiplier;
        const subtotal = unitPrice * item.quantity;
        const costPrice = purchase * multiplier * item.quantity;

        totalAmount += subtotal;
        totalCost += costPrice;

        return {
          medicineId: item.medicine.id,
          medicineName: item.medicine.name,
          quantity: item.quantity,
          unitType,
          unitPrice,
          purchasePrice: purchase,
          costPrice,
          subtotal,
        };
      });

      const setting = await prisma.systemSetting.findUnique({ where: { key: "platform_fee_percent" } });
      const feePercent = setting ? parseFloat(setting.value) : 5;
      const platformFee = (totalAmount * feePercent) / 100;
      const deliveryFee = deliveryFeePerPharmacy || 0;
      const discountAmount = 0;
      const orderVatPercent = Number(items[0]?.medicine?.pharmacy?.vatPercent) || 0;
      const vatAmount = (totalAmount * orderVatPercent) / 100;
      const finalAmount = totalAmount + vatAmount + deliveryFee - discountAmount;
      const netProfit = totalAmount - totalCost - platformFee;

      const paidAmount = Math.min(remainingPaid, finalAmount);
      remainingPaid = Math.max(0, remainingPaid - paidAmount);
      const dueAmount = Math.max(0, finalAmount - paidAmount);
      const isDue = dueAmount > 0;

      const orderNumber = `TSH-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const order = await prisma.order.create({
        data: {
          orderNumber,
          patientId: user.id,
          pharmacyId,
          branchId: branchId, // 🔥 Branch ID সেভ করা হচ্ছে
          totalAmount,
          vatPercent: orderVatPercent,
          platformFee,
          deliveryFee: deliveryFeePerPharmacy,
          discountAmount,
          finalAmount,
          totalCost,
          netProfit,
          status: "PENDING",
          deliveryAddress,
          deliveryPhone,
          receiverPhone: receiverPhone || null,
          paymentMethod: paymentMethod || "COD",
          isDue,
          paidAmount,
          dueAmount,
          notes: notes || null,
          prescriptionUrl: prescriptionUrl || null,
          prescriptionStatus: prescriptionUrl ? "PENDING" : "NONE",
          items: { create: orderItems },
        },
      });

      if (isDue) {
        await prisma.due.create({
          data: {
            pharmacyId,
            patientId: user.id,
            patientName: user.name || "Customer",
            patientPhone: receiverPhone || user.phone || "",
            amount: finalAmount,
            paidAmount: paidAmount,
            orderId: order.id,
            note: `Order ${orderNumber}${paidAmount > 0 ? ` (Paid: ৳${paidAmount.toFixed(2)})` : ''}`,
            status: paidAmount > 0 ? "PARTIAL" : "UNPAID",
          },
        });
      }

      const pharmacy = await prisma.pharmacy.findFirst({ where: { id: pharmacyId } });
      if (pharmacy) {
        await prisma.notification.create({
          data: {
            userId: pharmacy.userId,
            title: isDue ? "⚠️ New Order (Partial/Due)" : "🛍️ New Order Received!",
            message: `Order ${orderNumber} - ৳${finalAmount.toFixed(2)} from ${user.name}${paidAmount > 0 ? ` (Paid: ৳${paidAmount.toFixed(2)})` : ''}`,
            type: "new",
            link: "/pharmacy/orders",
          },
        });
      }

      const allStaff = await prisma.user.findMany({
        where: { parentPharmacyId: pharmacyId, role: "PHARMACY_STAFF", isActive: true },
      });

      for (const st of allStaff) {
        const stPerms = (st.permissions as string[]) || [];
        if (stPerms.includes("view_orders")) {
          await prisma.notification.create({
            data: {
              userId: st.id,
              title: isDue ? "⚠️ New Order (Due)" : "🛍️ New Order Received!",
              message: `Order ${orderNumber} - ৳${finalAmount.toFixed(2)}`,
              type: "new",
              link: "/pharmacy/orders",
            },
          });
        }
      }

      try {
        await prisma.notification.create({ data: {
          userId: user.id,
          title: 'Order Placed',
          message: `Order ${orderNumber} placed successfully. Total ৳${finalAmount.toFixed(2)}`,
          type: 'new',
          link: '/dashboard/orders',
        } });
      } catch (e) { console.error('[ORDER_PATIENT_NOTIFY]', e); }

      orders.push(order);

      // 🔥 Deduct stock from specific branch (SUPER FAST PARALLEL LOGIC)
      await Promise.all(items.map(async (item: any) => {
        try {
          // ১. BranchStock চেক এবং আপডেট
          const branchStock = await prisma.branchStock.findFirst({
            where: { branchId: branchId, medicineId: item.medicine.id }
          });

          if (branchStock && branchStock.quantity >= item.quantity) {
            await prisma.branchStock.update({
              where: { id: branchStock.id },
              data: { quantity: { decrement: item.quantity } }
            });

            // ২. Medicine.stock (Global Cache) আপডেট
            await prisma.medicine.update({
              where: { id: item.medicine.id },
              data: { stock: { decrement: item.quantity } }
            });

            // ৩. StockMovement রেকর্ড
            await recordStockMovement({
              pharmacyId,
              medicineId: item.medicine.id,
              type: 'SALE',
              quantity: item.quantity,
              referenceId: order.id,
              reason: `Order ${orderNumber}`,
              userId: user.id,
            });
          } else {
             console.log(`[STOCK_WARN] Not enough stock for ${item.medicine.name}`);
          }
        } catch (stockErr) {
          console.error('[ORDER_STOCK_DEDUCT_ERROR]', stockErr);
        }
      }));

      await prisma.cartItem.deleteMany({ where: { userId: user.id } });

      // Send emails and WhatsApp (keeping your existing logic)
      try {
        if (orders && orders.length > 0) {
          const firstOrder = orders[0];
          const patient = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true, name: true } });
          if (patient?.email && firstOrder) {
            const tpl = emailTemplates.orderConfirmed({
              orderNumber: firstOrder.orderNumber,
              customerName: patient.name || "Customer",
              total: Number(firstOrder.finalAmount),
              pharmacyName: "Tshastho Pharmacy",
            });
            await sendEmail({ to: patient.email, subject: tpl.subject, html: tpl.html });
          }
        }
      } catch (emailErr) {
        console.error('[ORDER_EMAIL]', emailErr);
      }

      try {
        const userPhone = user.phone || (await prisma.user.findUnique({ where: { id: user.id }, select: { phone: true } }))?.phone;
        if (userPhone && orders && orders.length > 0) {
          const firstOrder = orders[0];
          await sendWhatsApp({
            to: userPhone,
            body: `Tshastho: Order ${firstOrder.orderNumber} confirmed. Total: BDT ${Number(firstOrder.finalAmount).toFixed(2)}. We will notify when ready.`,
          });
        }
      } catch (waErr) {
        console.error('[ORDER_WHATSAPP]', waErr);
      }
    }

    return NextResponse.json({ message: "Order placed! ✅", orders }, { status: 201 });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
