// GET /api/pharmacy/vat-invoices/[id]/mushak-6.3
// Streams a Mushak 6.3 VAT Challan PDF — Item 16

import { requireRole } from '@/lib/auth/guards';
import { errorResponse, ErrorCodes } from '@/lib/errors';
import { buildMushakData, renderMushakPDF } from '@/lib/pharmacy/mushak-pdf';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(['PHARMACY_OWNER', 'PHARMACY_STAFF', 'SUPER_ADMIN']);
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    const data = await buildMushakData(id);
    if (!data) {
      return errorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'VAT invoice not found', 404);
    }

    const pdf = await renderMushakPDF(data);
    const safeName = data.invoiceNumber.replace(/[^A-Za-z0-9-]/g, '_');

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Mushak-6.3-${safeName}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[MUSHAK_PDF]', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to generate PDF', 500);
  }
}
