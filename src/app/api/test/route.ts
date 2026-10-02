import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
      const userCount = await prisma.user.count();
          return NextResponse.json(
                {
                        message: "Database connected successfully! 🚀",
                                totalUsers: userCount,
                                      },
                                            { status: 200 }
                                                );
                                                  } catch (error) {
                                                      console.error("Database connection error:", error);
                                                          return NextResponse.json(
                                                                {
                                                                        message: "Database connection failed",
                                                                                error: String(error),
                                                                                      },
                                                                                            { status: 500 }
                                                                                                );
                                                                                                  }
                                                                                                  }