import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getPlatformFeePercent(): Promise<number> {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: "platform_fee_percent" } });
    return setting ? parseFloat(setting.value) : 5;
  } catch {
    return 5;
  }
}
