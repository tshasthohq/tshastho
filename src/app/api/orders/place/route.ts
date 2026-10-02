import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/guards';
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { email, deliveryAddress, deliveryPhone, receiverPhone, paymentMethod, notes, deliveryCharge, paidAmount: paidInput, prescriptionUrl } = await req.json();

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

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
      const deliveryFee = parseFloat(deliveryCharge) || 0;
      const discountAmount = 0;
      const finalAmount = totalAmount + deliveryFee - discountAmount;
      const netProfit = totalAmount - totalCost - platformFee;

      // Paid amount handling
      const paidAmount = Math.min(Math.max(parseFloat(paidInput) || 0, 0), finalAmount);
      const dueAmount = Math.max(0, finalAmount - paidAmount);
      const isDue = dueAmount > 0;

      const orderNumber = `TSH-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const order = await prisma.order.create({
        data: {
          orderNumber,
          patientId: user.id,
          pharmacyId,
          totalAmount,
          platformFee,
          deliveryFee,
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
            note: `Order ${orderNumber}${paidAmount > 0 ? ` (Paid: ৳${paidAmount.toFixed(2)})` : ""}`,
            status: paidAmount > 0 ? "PARTIAL" : "UNPAID",
          },
        });
      }

      const pharmacy = await prisma.pharmacy.findFirst({ where: { id: pharmacyId } });
      if (pharmacy) {
        await prisma.notification.create({
          data: {
            userId: pharmacy.userId,
            title: isDue ? "🛒 New Order (Partial/Due)" : "🛒 New Order Received!",
            message: `Order ${orderNumber} - ৳${finalAmount.toFixed(2)} from ${user.name}${paidAmount > 0 ? ` (Paid: ৳${paidAmount.toFixed(2)})` : ""}`,
            type: "new",
            link: "/pharmacy/orders",
          },
        });

        // Notify all staff with view_orders permission
        const allStaff = await prisma.user.findMany({
          where: {
            parentPharmacyId: pharmacy.id,
            role: "PHARMACY_STAFF",
            isActive: true,
          },
        });

        for (const st of allStaff) {
          const stPerms = (st.permissions as string[]) || [];
          if (stPerms.includes("view_orders")) {
            await prisma.notification.create({
              data: {
                userId: st.id,
                title: isDue ? "🛒 New Order (Due)" : "🛒 New Order Received!",
                message: `Order ${orderNumber} - ৳${finalAmount.toFixed(2)}`,
                type: "new",
                link: "/pharmacy/orders",
              },
            });
          }
        }
      }

      orders.push(order);
    }

    await prisma.cartItem.deleteMany({ where: { userId: user.id } });

    return NextResponse.json({ message: "Order placed! ✅", orders }, { status: 201 });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
