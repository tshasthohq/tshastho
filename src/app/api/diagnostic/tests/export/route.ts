import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { diagCtx } from "@/lib/diagnostic/api";

export async function GET(req: Request) {
  const format = new URL(req.url).searchParams.get("format");
  const c = await diagCtx(true);
  if (c.error) return c.error;

  const tests = await prisma.diagnosticTest.findMany({
    where: { diagnosticId: c.diagnostic.id },
    include: { department: { select: { name: true } } },
    orderBy: [{ department: { sortOrder: "asc" } }, { name: "asc" }],
  });

  const rows = tests.map((t) => ({
    Code: t.code,
    Name: t.name,
    Department: t.department?.name ?? "",
    Sample: t.sampleType ?? "",
    Price: Number(t.price),
    Cost: Number(t.costPrice),
    CommissionType: t.commissionType,
    CommissionValue: Number(t.commissionValue),
    ReportingHours: t.reportingHours,
    Active: t.isActive ? "YES" : "NO",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  if (format === "csv") {
    // BOM dile Excel e Bangla/UTF-8 thik khule
    const csv = "\uFEFF" + XLSX.utils.sheet_to_csv(ws);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="test-catalog.csv"',
      },
    });
  }
  ws["!cols"] = [{ wch: 10 }, { wch: 42 }, { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 8 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tests");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="test-catalog.xlsx"',
    },
  });
}
