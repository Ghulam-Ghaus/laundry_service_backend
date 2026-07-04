import { Injectable } from '@nestjs/common';

export interface SendResult {
  success: boolean;
  providerReference: string;
  providerName: string;
  errorMessage: string | null;
  metadata: any;
}

@Injectable()
export class EmailAdapter {
  async send(to: string, subject: string, body: string): Promise<SendResult> {
    // Mocking email dispatch
    console.log(`[MOCK EMAIL] Sending to: ${to} | Subject: ${subject}`);
    console.log(`[MOCK EMAIL] Body:\n${body}`);

    return {
      success: true,
      providerReference: `mock-email-ref-${Math.random().toString(36).substring(7)}`,
      providerName: 'MockEmailService',
      errorMessage: null,
      metadata: {
        mode: 'mock',
        dispatchedAt: new Date().toISOString(),
      },
    };
  }
}
