import { sendViaMeta } from './providers/meta';
import { sendViaTwilio } from './providers/twilio';
import { WhatsAppMessage, WhatsAppProvider, WhatsAppResult } from './types';

export * from './types';

/**
 * Sends a WhatsApp message using configured provider.
 * Provider priority: WhatsApp Cloud API → Twilio → Manual (log only)
 */
export async function sendWhatsApp(message: WhatsAppMessage): Promise<WhatsAppResult> {
  // Try Meta Cloud API
  if (process.env.META_WHATSAPP_PHONE_ID && process.env.META_WHATSAPP_TOKEN) {
    return sendViaMeta(
      process.env.META_WHATSAPP_PHONE_ID,
      process.env.META_WHATSAPP_TOKEN,
      message
    );
  }

  // Try Twilio
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  ) {
    return sendViaTwilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
      process.env.TWILIO_WHATSAPP_FROM,
      message
    );
  }

  // Fallback: manual log
  console.log('[WHATSAPP_MOCK]', { to: message.to, body: message.body });
  return { success: true, messageId: 'mock-' + Date.now() };
}

/**
 * WhatsApp template functions (Meta approved templates)
 */
export const whatsappTemplates = {
  orderConfirmed: (orderNumber: string, customerName: string, total: number) => ({
    templateName: 'order_confirmed',
    templateParams: [customerName, orderNumber, total.toFixed(2)],
  }),

  orderReady: (orderNumber: string) => ({
    templateName: 'order_ready',
    templateParams: [orderNumber],
  }),

  orderDelivered: (orderNumber: string) => ({
    templateName: 'order_delivered',
    templateParams: [orderNumber],
  }),

  lowStockAlert: (medicineName: string, stock: number) => ({
    templateName: 'low_stock_alert',
    templateParams: [medicineName, String(stock)],
  }),
};
