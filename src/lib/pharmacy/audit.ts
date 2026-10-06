import { prisma } from '@/lib/prisma';

export type AuditAction =
  | 'LOGIN' | 'LOGOUT'
  | 'CREATE_SALE' | 'VOID_SALE'
  | 'CREATE_PURCHASE' | 'RECEIVE_PURCHASE'
  | 'UPDATE_MEDICINE' | 'DELETE_MEDICINE' | 'UPDATE_PRICE'
  | 'STOCK_ADJUSTMENT'
  | 'CREATE_EXPENSE'
  | 'ADD_STAFF' | 'REMOVE_STAFF' | 'UPDATE_PERMISSION'
  | 'SEND_SMS' | 'REFUND' | 'RETURN'
  | 'OTHER';

interface LogParams {
  pharmacyId: string;
  userId?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  details?: any;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  req?: Request;
}

export async function logAudit(params: LogParams) {
  try {
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (params.req) {
      ipAddress = params.req.headers.get('x-forwarded-for') || params.req.headers.get('x-real-ip') || undefined;
      userAgent = params.req.headers.get('user-agent') || undefined;
    }

    return await prisma.pharmacyAuditLog.create({
      data: {
        pharmacyId: params.pharmacyId,
        userId: params.userId || null,
        action: params.action,
        resource: params.resource || null,
        resourceId: params.resourceId || null,
        details: params.details || undefined,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        severity: params.severity || 'INFO',
      },
    });
  } catch (e) {
    console.error('[AUDIT_LOG]', e);
    return null;
  }
}
