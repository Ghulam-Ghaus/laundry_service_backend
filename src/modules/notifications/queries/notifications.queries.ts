import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../../../database/supabase.client';

export interface DbNotificationTemplate {
  id: string;
  code: string;
  channel_id: string;
  language_id: string | null;
  subject: string | null;
  body: string;
  variables: string[]; // jsonb array
  is_active: boolean;
}

export interface DbNotificationLog {
  id: string;
  template_id: string | null;
  user_id: string | null;
  order_id: string | null;
  channel_id: string;
  status_id: string;
  recipient: string;
  subject: string | null;
  body: string;
  provider: string | null;
  provider_reference: string | null;
  error_message: string | null;
  sent_at: string | null;
  metadata: any;
}

@Injectable()
export class NotificationsQueries {
  constructor(private readonly supabase: SupabaseClientService) {}

  // --- Templates ---
  async findTemplates(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('notification_templates')
      .select(`
        id, code, subject, body, variables, is_active,
        channel:lookup_values!channel_id(code, label),
        language:lookup_values!language_id(code, label)
      `)
      .eq('is_deleted', false)
      .order('code', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch notification templates: ${error.message}`);
    }
    return data || [];
  }

  async findTemplateById(id: string): Promise<DbNotificationTemplate | null> {
    const { data, error } = await this.supabase.client
      .from('notification_templates')
      .select('id, code, channel_id, language_id, subject, body, variables, is_active')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch template by ID: ${error.message}`);
    }
    return data;
  }

  async findActiveTemplate(code: string, channelId: string, languageId: string | null): Promise<DbNotificationTemplate | null> {
    let query = this.supabase.client
      .from('notification_templates')
      .select('id, code, channel_id, language_id, subject, body, variables, is_active')
      .eq('code', code)
      .eq('channel_id', channelId)
      .eq('is_active', true)
      .eq('is_deleted', false);

    if (languageId) {
      query = query.eq('language_id', languageId);
    } else {
      query = query.is('language_id', null);
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
      throw new Error(`Failed to fetch active template: ${error.message}`);
    }
    return data;
  }

  async createTemplate(payload: {
    code: string;
    channelId: string;
    languageId?: string;
    subject?: string;
    body: string;
    variables?: string[];
  }): Promise<DbNotificationTemplate> {
    const dataToInsert = {
      code: payload.code,
      channel_id: payload.channelId,
      language_id: payload.languageId || null,
      subject: payload.subject || null,
      body: payload.body,
      variables: payload.variables || [],
    };

    const { data, error } = await this.supabase.client
      .from('notification_templates')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
    return data;
  }

  async updateTemplate(id: string, updates: {
    subject?: string;
    body?: string;
    variables?: string[];
    isActive?: boolean;
  }): Promise<DbNotificationTemplate> {
    const dataToUpdate: any = {};
    if (updates.subject !== undefined) dataToUpdate.subject = updates.subject;
    if (updates.body !== undefined) dataToUpdate.body = updates.body;
    if (updates.variables !== undefined) dataToUpdate.variables = updates.variables;
    if (updates.isActive !== undefined) dataToUpdate.is_active = updates.isActive;

    const { data, error } = await this.supabase.client
      .from('notification_templates')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`);
    }
    return data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('notification_templates')
      .update({ is_deleted: true, is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  // --- Logs ---
  async createNotificationLog(payload: {
    templateId: string | null;
    userId: string | null;
    orderId: string | null;
    channelId: string;
    statusId: string;
    recipient: string;
    subject: string | null;
    body: string;
    provider: string | null;
    providerReference: string | null;
    errorMessage: string | null;
    sentAt: string | null;
    metadata: any;
  }): Promise<DbNotificationLog> {
    const dataToInsert = {
      template_id: payload.templateId,
      user_id: payload.userId,
      order_id: payload.orderId,
      channel_id: payload.channelId,
      status_id: payload.statusId,
      recipient: payload.recipient,
      subject: payload.subject,
      body: payload.body,
      provider: payload.provider,
      provider_reference: payload.providerReference,
      error_message: payload.errorMessage,
      sent_at: payload.sentAt,
      metadata: payload.metadata || {},
    };

    const { data, error } = await this.supabase.client
      .from('notification_logs')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification log: ${error.message}`);
    }
    return data;
  }

  async findLogs(page: number, limit: number): Promise<{ items: any[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { count, error: countError } = await this.supabase.client
      .from('notification_logs')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to count notification logs: ${countError.message}`);
    }

    const { data, error } = await this.supabase.client
      .from('notification_logs')
      .select(`
        id, recipient, subject, body, provider, provider_reference, error_message, sent_at, created_at, metadata,
        channel:lookup_values!channel_id(code, label),
        status:lookup_values!status_id(code, label),
        user:app_users!user_id(first_name, last_name, email),
        order:orders(order_number)
      `)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch notification logs: ${error.message}`);
    }

    return { items: data || [], total: count || 0 };
  }
}
