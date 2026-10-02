const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📊 Checking Due records...');
  
  const allDues = await prisma.due.findMany();
  console.log('Total Due records in DB:', allDues.length);
  
  const allOrders = await prisma.order.findMany({
    select: { id: true, orderNumber: true, isDue: true, paidAmount: true, dueAmount: true, finalAmount: true, status: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  
  console.log('\n📦 Recent Orders:');
  for (const o of allOrders) {
    console.log(`  ${o.orderNumber} | Status: ${o.status} | isDue: ${o.isDue} | Paid: ৳${o.paidAmount} | Due: ৳${o.dueAmount} | Total: ৳${o.finalAmount}`);
  }
  
  // Create missing Due records
  console.log('\n🔄 Creating missing Due records...');
  let fixed = 0;
  const dueOrders = await prisma.order.findMany({
    where: { isDue: true, dueAmount: { gt: 0 } },
    include: { pharmacy: true, patient: true },
  });
  
  for (const order of dueOrders) {
    const existing = await prisma.due.findFirst({ where: { orderId: order.id } });
    if (!existing) {
      await prisma.due.create({
        data: {
          pharmacyId: order.pharmacyId,
          patientId: order.patientId,
          patientName: order.patient?.name || "Customer",
          patientPhone: order.receiverPhone || order.patient?.phone || "",
          amount: order.finalAmount,
          paidAmount: order.paidAmount,
          orderId: order.id,
          note: `Order ${order.orderNumber}`,
          status: parseFloat(order.paidAmount.toString()) > 0 ? "PARTIAL" : "UNPAID",
        },
      });
      fixed++;
      console.log(`  ✅ Created Due for ${order.orderNumber}`);
    }
  }
  
  console.log(`\n🎉 Fixed ${fixed} missing Due records`);
  
  const finalCount = await prisma.due.count();
  console.log(`📊 Total Due records now: ${finalCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
