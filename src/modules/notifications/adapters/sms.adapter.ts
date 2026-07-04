import { Injectable } from '@nestjs/common';
import { SendResult } from './email.adapter';

@Injectable()
export class SmsAdapter {
  async send(to: string, body: string): Promise<SendResult> {
    // Mocking SMS dispatch
    console.log(`[MOCK SMS] Sending to: ${to} | Body: ${body}`);

    return {
      success: true,
      providerReference: `mock-sms-ref-${Math.random().toString(36).substring(7)}`,
      providerName: 'MockSmsService',
      errorMessage: null,
      metadata: {
        mode: 'mock',
        dispatchedAt: new Date().toISOString(),
      },
    };
  }
}
