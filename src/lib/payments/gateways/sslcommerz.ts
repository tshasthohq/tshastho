import { PaymentGateway, PaymentInitPayload, PaymentInitResult, PaymentVerifyResult } from '../types';

const SSL_BASE = process.env.SSLCOMMERZ_SANDBOX === 'true'
  ? 'https://sandbox.sslcommerz.com'
  : 'https://securepay.sslcommerz.com';

export const sslcommerzGateway: PaymentGateway = {
  name: 'SSLCOMMERZ',

  async initiate(payload: PaymentInitPayload, paymentId: string): Promise<PaymentInitResult> {
    const storeId = process.env.SSLCOMMERZ_STORE_ID;
    const storePass = process.env.SSLCOMMERZ_STORE_PASS;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!storeId || !storePass) {
      // DEV MOCK: return a fake gateway URL so we can test the flow without live keys
      console.warn('[SSLCOMMERZ] Missing credentials — using mock mode');
      return {
        gatewayTxnId: `MOCK-${paymentId}`,
        redirectUrl: `${appUrl}/api/payments/mock/success?paymentId=${paymentId}`,
        raw: { mock: true },
      };
    }

    const body = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePass,
      total_amount: String(payload.amount),
      currency: payload.currency,
      tran_id: paymentId,
      success_url: `${appUrl}/api/payments/sslcommerz/success`,
      fail_url: `${appUrl}/api/payments/sslcommerz/fail`,
      cancel_url: `${appUrl}/api/payments/sslcommerz/cancel`,
      cus_name: payload.customerName,
      cus_email: payload.customerEmail,
      cus_phone: payload.customerPhone || '01700000000',
      cus_add1: payload.customerAddress || 'N/A',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: payload.productName,
      product_category: payload.productCategory || 'Health',
      product_profile: 'general',
    });

    const res = await fetch(`${SSL_BASE}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();
    if (!data?.GatewayPageURL) {
      throw new Error(data?.failedreason || 'SSLCommerz initiation failed');
    }

    return {
      gatewayTxnId: data.sessionkey || paymentId,
      redirectUrl: data.GatewayPageURL,
      raw: data,
    };
  },

  async verify(gatewayTxnId: string, extra?: any): Promise<PaymentVerifyResult> {
    const valId = extra?.val_id;
    if (!valId) return { success: false, gatewayTxnId, raw: {}, failureReason: 'Missing val_id' };

    const res = await fetch(
      `${SSL_BASE}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${process.env.SSLCOMMERZ_STORE_ID}&store_passwd=${process.env.SSLCOMMERZ_STORE_PASS}&format=json`
    );
    const data = await res.json();

    const success = ['VALID', 'VALIDATED'].includes(data?.status);
    return {
      success,
      gatewayTxnId,
      gatewayRefId: data?.bank_tran_id || data?.tran_id,
      amount: data?.amount ? Number(data.amount) : undefined,
      raw: data,
      failureReason: success ? undefined : data?.status,
    };
  },
};
