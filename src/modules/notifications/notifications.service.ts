import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationsQueries, DbNotificationTemplate } from './queries/notifications.queries';
import { LookupsQueries } from '../lookups/queries/lookups.queries';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/notifications.dto';
import { EmailAdapter, SendResult } from './adapters/email.adapter';
import { SmsAdapter } from './adapters/sms.adapter';
import { WhatsappAdapter } from './adapters/whatsapp.adapter';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsQueries: NotificationsQueries,
    private readonly lookupsQueries: LookupsQueries,
    private readonly emailAdapter: EmailAdapter,
    private readonly smsAdapter: SmsAdapter,
    private readonly whatsappAdapter: WhatsappAdapter,
  ) {}

  // --- Templates CRUD ---
  async getTemplates(): Promise<any[]> {
    return this.notificationsQueries.findTemplates();
  }

  async getTemplateById(id: string): Promise<DbNotificationTemplate> {
    const template = await this.notificationsQueries.findTemplateById(id);
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async createTemplate(dto: CreateTemplateDto): Promise<DbNotificationTemplate> {
    const channelVal = await this.lookupsQueries.findValueByCode('notification_channel', dto.channelCode);
    if (!channelVal) {
      throw new BadRequestException(`Notification channel ${dto.channelCode} does not exist`);
    }

    let languageId: string | undefined;
    if (dto.languageCode) {
      const languageVal = await this.lookupsQueries.findValueByCode('language', dto.languageCode);
      if (!languageVal) {
        throw new BadRequestException(`Language code ${dto.languageCode} does not exist`);
      }
      languageId = languageVal.id;
    }

    return this.notificationsQueries.createTemplate({
      code: dto.code,
      channelId: channelVal.id,
      languageId,
      subject: dto.subject,
      body: dto.body,
      variables: dto.variables,
    });
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<DbNotificationTemplate> {
    await this.getTemplateById(id);
    return this.notificationsQueries.updateTemplate(id, dto);
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.getTemplateById(id);
    await this.notificationsQueries.deleteTemplate(id);
  }

  // --- Preview Renderer ---
  async previewTemplate(id: string, variables: Record<string, string>): Promise<{ subject: string | null; body: string }> {
    const template = await this.getTemplateById(id);

    const compiledSubject = template.subject ? this.compile(template.subject, variables) : null;
    const compiledBody = this.compile(template.body, variables);

    return {
      subject: compiledSubject,
      body: compiledBody,
    };
  }

  // --- Notifications Sending Engine ---
  async sendNotification(
    eventCode: string,
    channelCode: string,
    recipient: string,
    variables: Record<string, string>,
    details?: { userId?: string; orderId?: string },
  ): Promise<any> {
    // 1. Resolve channel lookup
    const channelVal = await this.lookupsQueries.findValueByCode('notification_channel', channelCode);
    if (!channelVal) {
      throw new Error(`Notification channel ${channelCode} not configured`);
    }

    // 2. Fetch language lookup (English fallback if not resolved)
    let languageId: string | null = null;
    const defaultLanguage = await this.lookupsQueries.findValueByCode('language', 'en');
    if (defaultLanguage) {
      languageId = defaultLanguage.id;
    }

    // 3. Query active template
    let template = await this.notificationsQueries.findActiveTemplate(eventCode, channelVal.id, languageId);
    if (!template) {
      // Fallback to language-free template
      template = await this.notificationsQueries.findActiveTemplate(eventCode, channelVal.id, null);
    }

    if (!template) {
      throw new BadRequestException(`No active notification template found for event ${eventCode} on channel ${channelCode}`);
    }

    // 4. Compile strings
    const compiledSubject = template.subject ? this.compile(template.subject, variables) : null;
    const compiledBody = this.compile(template.body, variables);

    // 5. Send via adapter
    let sendResult: SendResult;
    try {
      if (channelCode === 'email') {
        sendResult = await this.emailAdapter.send(recipient, compiledSubject || 'Notification', compiledBody);
      } else if (channelCode === 'sms') {
        sendResult = await this.smsAdapter.send(recipient, compiledBody);
      } else if (channelCode === 'whatsapp') {
        sendResult = await this.whatsappAdapter.send(recipient, compiledBody);
      } else {
        // Fallback in-app mock
        sendResult = {
          success: true,
          providerReference: `in-app-${Math.random().toString(36).substring(7)}`,
          providerName: 'MockInAppService',
          errorMessage: null,
          metadata: { mode: 'mock' },
        };
      }
    } catch (e: any) {
      sendResult = {
        success: false,
        providerReference: '',
        providerName: 'AdapterError',
        errorMessage: e.message || 'Transmission failed',
        metadata: { mode: 'mock', failedAt: new Date().toISOString() },
      };
    }

    // 6. Resolve notification log statuses
    const statusStr = sendResult.success ? 'sent' : 'failed';
    const statusVal = await this.lookupsQueries.findValueByCode('notification_status', statusStr);
    const statusId = statusVal ? statusVal.id : channelVal.id; // fallback to channelId if status list lookup config is missing

    // 7. Save log in table
    const log = await this.notificationsQueries.createNotificationLog({
      templateId: template.id,
      userId: details?.userId || null,
      orderId: details?.orderId || null,
      channelId: channelVal.id,
      statusId,
      recipient,
      subject: compiledSubject,
      body: compiledBody,
      provider: sendResult.providerName,
      providerReference: sendResult.providerReference,
      errorMessage: sendResult.errorMessage,
      sentAt: sendResult.success ? new Date().toISOString() : null,
      metadata: sendResult.metadata,
    });

    return log;
  }

  async getLogs(page: number, limit: number) {
    const result = await this.notificationsQueries.findLogs(page, limit);
    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  // Variable compiler tool
  private compile(templateStr: string, variables: Record<string, string>): string {
    let result = templateStr;
    for (const [key, val] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), val);
    }
    return result;
  }
}
