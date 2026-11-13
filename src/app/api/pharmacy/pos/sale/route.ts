import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';
import { recordStockMovement } from '@/lib/pharmacy/stock';
import { redeemPoints } from '@/lib/pharmacy/loyalty';
import { createVatInvoice } from '@/lib/tax/vat';
import { logAudit } from '@/lib/pharmacy/audit';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { z } from 'zod';
import { recordPosSale } from '@/lib/pharmacy/ledger';
import { logCashDrawer } from '@/lib/pharmacy/cash-drawer';
import { walletSpend } from '@/lib/wallet';
import { earnPoints } from '@/lib/pharmacy/loyalty';
import { calcStaffCommission } from '@/lib/pharmacy/staff-commission';

function generateSaleNumber(seq: number) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `POS-${y}${m}${day}-${String(seq).padStart(4, '0')}`;
}

const schema = z.object({
  branchId: z.string().optional(), // 🔥 Branch ID added here
  items: z.array(z.object({
    medicineId: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
    unitPrice: z.coerce.number().min(0),
    discount: z.coerce.number().min(0).default(0),
  })).min(1),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  discountAmount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'BKASH', 'NAGAD', 'MIXED', 'DUE', 'WALLET']).default('CASH'),
  splits: z.array(z.object({
    method: z.enum(['CASH', 'BKASH', 'NAGAD', 'CARD', 'CREDIT', 'DUE']),
    amount: z.coerce.number().min(0),
    reference: z.string().optional(),
  })).optional(),
  paidAmount: z.coerce.number().min(0).default(0),
  loyaltyPointsToRedeem: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const user = auth.user!;
  const clientSaleId = req.headers.get('x-client-sale-id') ?? undefined;

  // Item 19: idempotency — return existing sale if already synced
  if (clientSaleId) {
    const existingSale = await prisma.posSale.findUnique({
      where: { clientSaleId },
      select: { id: true, saleNumber: true, totalAmount: true },
    });
    if (existingSale) {
      return NextResponse.json({ success: true, idempotent: true, sale: existingSale });
    }
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    let pharmacyId = user.parentPharmacyId;
    if (user.role === 'PHARMACY_OWNER') {
      const pharmacy = await prisma.pharmacy.findFirst({ where: { userId: user.id } });
      pharmacyId = pharmacy?.id || null;
    }
    if (!pharmacyId) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Pharmacy not found', 404);

    const openShift = await prisma.posShift.findFirst({
      where: { pharmacyId, staffId: user.id, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    const medicineIds = data.items.map(i => i.medicineId);
    const medicines = await prisma.medicine.findMany({
      where: { id: { in: medicineIds }, pharmacyId },
    });

    if (medicines.length !== medicineIds.length) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, 'One or more medicines not found', 400);
    }

    const itemsData = data.items.map(item => {
      const med = medicines.find(m => m.id === item.medicineId)!;
      const actualUnitPrice = Number(med.sellingPrice || 0);
      const subtotal = (actualUnitPrice * item.quantity) - item.discount;
      const purchasePrice = Number(med.purchasePrice || 0);
      const profit = subtotal - (purchasePrice * item.quantity);
      return {
        medicineId: item.medicineId,
        medicineName: med.name,
        quantity: item.quantity,
        unitPrice: actualUnitPrice,
        purchasePrice: med.purchasePrice,
        discount: item.discount,
        subtotal,
        profit,
      };
    });

    const subtotal = itemsData.reduce((s, i) => s + i.subtotal, 0);

    let loyaltyDiscount = 0;
    let linkedUser: any = null;
    if (data.loyaltyPointsToRedeem > 0 && data.customerPhone) {
      linkedUser = await prisma.user.findFirst({
        where: { phone: data.customerPhone, role: 'CUSTOMER' as any },
        select: { id: true },
      });
      if (linkedUser) {
        const acc = await prisma.loyaltyAccount.findUnique({ where: { userId: linkedUser.id } });
        if (acc && acc.points >= data.loyaltyPointsToRedeem) {
          loyaltyDiscount = data.loyaltyPointsToRedeem;
        } else {
          return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Insufficient loyalty points', 400);
        }
      }
    }
    
    const totalAmount = Math.max(0, subtotal - data.discountAmount - loyaltyDiscount);
    const totalProfit = itemsData.reduce((s, i) => s + i.profit, 0) - data.discountAmount;
    const paidAmount = data.paymentMethod === 'DUE' ? 0 : (data.paidAmount || totalAmount);
    const changeAmount = Math.max(0, paidAmount - totalAmount);
    const dueAmount = Math.max(0, totalAmount - paidAmount);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let walletCustomerId: string | null = null;
    if (data.paymentMethod === 'WALLET') {
      if (!data.customerPhone) {
        return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Customer phone required for wallet payment', 400);
      }
      const cust = await prisma.user.findFirst({
        where: { phone: data.customerPhone },
        select: { id: true, walletAccount: { select: { balance: true, isFrozen: true } } },
      });
      if (!cust) return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'No wallet account for this phone', 404);
      if (cust.walletAccount?.isFrozen) return errorResponse(ErrorCodes.VALIDATION_ERROR, 'Wallet frozen', 400);
      const bal = Number(cust.walletAccount?.balance ?? 0);
      if (bal < Number(totalAmount)) {
        return errorResponse(ErrorCodes.VALIDATION_ERROR, `Insufficient wallet balance. Available: ৳${bal.toFixed(2)}, required: ৳${Number(totalAmount).toFixed(2)}`, 400);
      }
      walletCustomerId = cust.id;
    }

    const todayCount = await prisma.posSale.count({
      where: { pharmacyId, createdAt: { gte: todayStart } },
    });
    const saleNumber = generateSaleNumber(todayCount + 1);

    let customerId: string | null = null;
    if (data.customerPhone) {
      const existing = await prisma.posCustomer.findFirst({
        where: { pharmacyId, phone: data.customerPhone },
      });
      if (existing) {
        await prisma.posCustomer.update({
          where: { id: existing.id },
          data: { totalSpent: { increment: totalAmount }, visitCount: { increment: 1 }, name: data.customerName || existing.name },
        });
        customerId = existing.id;
      } else {
        const created = await prisma.posCustomer.create({
          data: { pharmacyId, name: data.customerName || null, phone: data.customerPhone, totalSpent: totalAmount, visitCount: 1 },
        });
        customerId = created.id;
      }
    }

    // Create sale + items + deduct stock atomically
    const sale = await prisma.$transaction(async (tx) => {
      const createdSale = await tx.posSale.create({
        data: {
          saleNumber,
          pharmacyId,
          branchId: data.branchId || null, // 🔥 Save branchId
          customerId,
          customerName: data.customerName || null,
          customerPhone: data.customerPhone || null,
          staffId: user.id,
          clientSaleId: clientSaleId ?? null,
          shiftId: openShift?.id || null,
          subtotal,
          discountAmount: data.discountAmount,
          totalAmount,
          paidAmount,
          changeAmount,
          dueAmount,
          paymentMethod: data.paymentMethod as any,
          notes: data.notes || null,
          profit: totalProfit,
          items: {
            create: itemsData.map(i => ({
              medicineId: i.medicineId,
              medicineName: i.medicineName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              purchasePrice: i.purchasePrice,
              discount: i.discount,
              subtotal: i.subtotal,
            })),
          },
        },
      });

      // FIFO deduct stock
      for (const item of data.items) {
        await recordStockMovement({
          pharmacyId,
          medicineId: item.medicineId,
          type: 'SALE',
          quantity: item.quantity,
          referenceId: createdSale.id,
          reason: `POS Sale ${saleNumber}`,
          userId: user.id,
        });

        // 🔥 Deduct Branch Stock if branchId is provided
        if (data.branchId) {
          await tx.branchStock.updateMany({
            where: { branchId: data.branchId, medicineId: item.medicineId },
            data: { quantity: { decrement: item.quantity } }
          });
        }
      }

      if (openShift) {
        try {
          await tx.posShift.update({
            where: { id: openShift.id },
            data: {
              totalSales: { increment: totalAmount },
              totalCash: data.paymentMethod === 'CASH' ? { increment: totalAmount } : undefined,
              totalCard: data.paymentMethod === 'CARD' ? { increment: totalAmount } : undefined,
              totalDigital: ['BKASH', 'NAGAD'].includes(data.paymentMethod) ? { increment: totalAmount } : undefined,
              totalDue: dueAmount > 0 ? { increment: dueAmount } : undefined,
              saleCount: { increment: 1 },
            },
          });
        } catch (shiftError) {
          console.error("Failed to update shift totals (timeout), but sale succeeded:", shiftError);
        }
      }

      return createdSale;
    }, { timeout: 20000 });

    if (sale.staffId) {
      calcStaffCommission(sale.id).catch((e) => console.error('[AUTO_COMMISSION_TRIGGER]', e));
    }

    if (data.paymentMethod === 'WALLET' && walletCustomerId) {
      const spend = await walletSpend({
        userId: walletCustomerId,
        amount: Number(totalAmount),
        ctx: {
          vertical: 'PHARMACY',
          contextId: pharmacyId,
          referenceType: 'POS_SALE',
          referenceId: sale.id,
          referenceNumber: saleNumber,
          description: 'POS sale ' + saleNumber,
          idempotencyKey: 'pos-' + sale.id,
          createdBy: user.id,
          createdByRole: user.role,
        },
      });
      if (!spend.ok) {
        console.error('[POS_WALLET_SPEND_FAILED]', sale.id, spend.error);
        return NextResponse.json({
          success: false,
          error: 'Sale created but wallet debit failed: ' + spend.error,
          saleId: sale.id,
        }, { status: 500 });
      }
    }

    if (data.paymentMethod === 'CASH') {
      logCashDrawer({
        pharmacyId,
        userId: user.id,
        reason: 'SALE',
        amount: totalAmount,
        posSaleId: sale.id,
        shiftId: openShift?.id ?? undefined,
      }).catch(e => console.error('[DRAWER_LOG]', e));
    }

    return NextResponse.json({
      success: true,
      sale: {
        id: sale.id,
        saleNumber: sale.saleNumber,
        totalAmount: sale.totalAmount,
        changeAmount: sale.changeAmount,
        dueAmount: sale.dueAmount,
        paymentMethod: sale.paymentMethod,
        createdAt: sale.createdAt,
      },
      receipt: {
        saleNumber,
        items: itemsData.map(i => ({
          name: i.medicineName,
          qty: i.quantity,
          price: i.unitPrice,
          subtotal: i.subtotal,
        })),
        subtotal,
        discount: data.discountAmount,
        total: totalAmount,
        paid: paidAmount,
        change: changeAmount,
        due: dueAmount,
      },
    }, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return errorResponse(ErrorCodes.VALIDATION_ERROR, error.issues[0].message, 400);
    }
    console.error('[POS_SALE]', error instanceof Error ? error.message : error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, error instanceof Error ? error.message : 'Sale failed', 500);
  }
}
