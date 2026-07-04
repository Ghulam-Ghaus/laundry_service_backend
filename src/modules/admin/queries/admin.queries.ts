import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../../../database/supabase.client';

@Injectable()
export class AdminQueries {
  constructor(private readonly supabase: SupabaseClientService) {}

  // --- Dashboard KPI aggregates ---
  async getOrdersCountByStatus(): Promise<{ status_id: string; count: number }[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('status_id')
      .eq('is_deleted', false);

    if (error) {
      throw new Error(`Failed to fetch orders for status count: ${error.message}`);
    }

    const countsMap: Record<string, number> = {};
    for (const row of data || []) {
      countsMap[row.status_id] = (countsMap[row.status_id] || 0) + 1;
    }

    return Object.entries(countsMap).map(([status_id, count]) => ({
      status_id,
      count,
    }));
  }

  async getTodayOrdersCount(): Promise<number> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartStr = todayStart.toISOString();

    const { count, error } = await this.supabase.client
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .gte('created_at', todayStartStr);

    if (error) {
      throw new Error(`Failed to fetch today's orders count: ${error.message}`);
    }
    return count || 0;
  }

  async getRevenueSum(): Promise<number> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('grand_total')
      .eq('is_deleted', false);

    if (error) {
      throw new Error(`Failed to calculate total revenue: ${error.message}`);
    }

    return (data || []).reduce((acc: number, row: any) => acc + parseFloat(row.grand_total), 0);
  }

  // --- Settings ---
  async findAllSettings(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('system_settings')
      .select('id, setting_key, setting_value, description, is_public')
      .eq('is_deleted', false);

    if (error) {
      throw new Error(`Failed to fetch settings: ${error.message}`);
    }
    return data || [];
  }

  async updateSetting(key: string, value: any): Promise<void> {
    const { error } = await this.supabase.client
      .from('system_settings')
      .update({ setting_value: value, updated_at: new Date().toISOString() })
      .eq('setting_key', key);

    if (error) {
      throw new Error(`Failed to update setting ${key}: ${error.message}`);
    }
  }

  // --- Audit Logs ---
  async findAuditLogs(page: number, limit: number, actionFilter?: string): Promise<{ items: any[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let countQuery = this.supabase.client
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    let rowsQuery = this.supabase.client
      .from('audit_logs')
      .select(`
        id, action, entity_name, entity_id, old_values, new_values, created_at,
        actor:app_users!actor_user_id(first_name, last_name, email)
      `);

    if (actionFilter) {
      countQuery = countQuery.eq('action', actionFilter);
      rowsQuery = rowsQuery.eq('action', actionFilter);
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      throw new Error(`Failed to count audit logs: ${countError.message}`);
    }

    const { data, error } = await rowsQuery
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return { items: data || [], total: count || 0 };
  }

  // --- Trash / Soft Deleted ---
  async findSoftDeletedRecords(entityName: string): Promise<any[]> {
    const validTables = ['service_categories', 'catalog_items', 'service_areas', 'time_slots', 'discounts', 'orders'];
    if (!validTables.includes(entityName)) {
      throw new Error(`Invalid entity name: ${entityName}`);
    }

    const { data, error } = await this.supabase.client
      .from(entityName)
      .select('*')
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch soft-deleted records for ${entityName}: ${error.message}`);
    }
    return data || [];
  }

  async restoreRecord(entityName: string, id: string): Promise<void> {
    const validTables = ['service_categories', 'catalog_items', 'service_areas', 'time_slots', 'discounts', 'orders'];
    if (!validTables.includes(entityName)) {
      throw new Error(`Invalid entity name: ${entityName}`);
    }

    const { error } = await this.supabase.client
      .from(entityName)
      .update({ is_deleted: false, deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to restore record in ${entityName}: ${error.message}`);
    }
  }
}
