export type WhatsAppProvider = 'META' | 'TWILIO' | 'MANUAL';

export interface WhatsAppMessage {
  to: string;
  body?: string;
  templateName?: string;
  templateParams?: string[];
  mediaUrl?: string;
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  raw?: any;
}

export interface WhatsAppConfig {
  provider: WhatsAppProvider;
  phoneNumberId?: string;
  accessToken?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFrom?: string;
}
