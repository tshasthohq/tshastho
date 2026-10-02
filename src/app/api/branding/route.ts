import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const keys = [
      "tshastho_logo",
      "tshastho_tagline",
      "tshastho_banner_home",
      "tshastho_banner_orders",
      "tshastho_support_phone",
      "tshastho_support_email",
    ];

    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: keys } },
    });

    const branding: any = {
      logo: "",
      tagline: "Connected Healthcare. Trusted Care.",
      bannerHome: "",
      bannerOrders: "",
      supportPhone: "01737326555",
      supportEmail: "",
    };

    for (const s of settings) {
      if (s.key === "tshastho_logo") branding.logo = s.value;
      if (s.key === "tshastho_tagline") branding.tagline = s.value;
      if (s.key === "tshastho_banner_home") branding.bannerHome = s.value;
      if (s.key === "tshastho_banner_orders") branding.bannerOrders = s.value;
      if (s.key === "tshastho_support_phone") branding.supportPhone = s.value;
      if (s.key === "tshastho_support_email") branding.supportEmail = s.value;
    }

    return NextResponse.json({ branding }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error", error: String(error) }, { status: 500 });
  }
}
