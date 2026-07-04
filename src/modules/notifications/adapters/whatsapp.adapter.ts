import { Injectable } from '@nestjs/common';
import { SendResult } from './email.adapter';

@Injectable()
export class WhatsappAdapter {
  async send(to: string, body: string): Promise<SendResult> {
    // Mocking WhatsApp dispatch
    console.log(`[MOCK WHATSAPP] Sending to: ${to} | Body: ${body}`);

    return {
      success: true,
      providerReference: `mock-wa-ref-${Math.random().toString(36).substring(7)}`,
      providerName: 'MockWhatsappService',
      errorMessage: null,
      metadata: {
        mode: 'mock',
        dispatchedAt: new Date().toISOString(),
      },
    };
  }
}
