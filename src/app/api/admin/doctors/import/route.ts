import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/guards';

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', inQ = false;
  const t = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQ = false;
      else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

export async function POST(req: Request) {
  const auth = await requireRole(['SUPER_ADMIN']);
  if (auth.error) return auth.error;

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ success: false, message: 'CSV file required' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ success: false, message: 'File too large (max 5MB)' }, { status: 400 });

  const rows = parseCsv(await file.text());
  if (rows.length < 2) return NextResponse.json({ success: false, message: 'CSV is empty' }, { status: 400 });

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (n: string) => header.indexOf(n.toLowerCase());
  const iReg = idx('bmdcRegNo');
  if (iReg < 0) return NextResponse.json({ success: false, message: 'Missing column: bmdcRegNo' }, { status: 400 });
  const iName = idx('fullName'), iDeg = idx('degrees'), iSpec = idx('specialty');
  const iAddr = idx('chamberAddress'), iDist = idx('district'), iPhone = idx('phone');
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] || '').trim() : '');

  let created = 0, updated = 0, skipped = 0;
  const errors: string[] = [];
  const seen = new Set<string>();

  for (let n = 1; n < rows.length; n++) {
    const r = rows[n];
    const reg = get(r, iReg).toUpperCase();
    if (!reg || reg.length < 3) { skipped++; errors.push(`Row ${n + 1}: missing bmdcRegNo`); continue; }
    if (seen.has(reg)) { skipped++; continue; }
    seen.add(reg);

    const info = {
      fullName: get(r, iName) || null,
      degrees: get(r, iDeg) || null,
      district: get(r, iDist) || null,
      chamberAddress: get(r, iAddr) || null,
      bookingPhone: get(r, iPhone) || null,
    };
    const specialty = get(r, iSpec) || 'General';

    try {
      const existing = await prisma.doctor.findUnique({ where: { licenseNumber: reg }, select: { id: true, claimStatus: true } });
      if (!existing) {
        await prisma.doctor.create({
          data: { ...info, licenseNumber: reg, specialty, claimStatus: 'UNCLAIMED', userId: null, experience: 0, consultationFee: 0, source: 'CSV_IMPORT' },
        });
        created++;
      } else if (existing.claimStatus === 'UNCLAIMED') {
        await prisma.doctor.update({ where: { id: existing.id }, data: { ...info, specialty } });
        updated++;
      } else {
        skipped++;
      }
    } catch (e) {
      skipped++;
      errors.push(`Row ${n + 1}: ${e instanceof Error ? e.message.slice(0, 80) : 'error'}`);
    }
  }

  return NextResponse.json({ success: true, total: rows.length - 1, created, updated, skipped, errors: errors.slice(0, 20) });
}
