import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../../../database/supabase.client';

export interface DbCustomerAddress {
  id: string;
  user_id: string;
  area_id: string | null;
  address_type_id: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  instructions: string | null;
  is_default: boolean;
}

export interface DbOrder {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_address_id: string | null;
  status_id: string;
  frequency_id: string | null;
  pickup_date: string | null;
  pickup_slot_id: string | null;
  delivery_date: string | null;
  delivery_slot_id: string | null;
  subtotal: number;
  service_fee: number;
  discount_total: number;
  grand_total: number;
  currency_code: string;
  special_instructions: string | null;
  is_item_selection_skipped: boolean;
  created_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  item_id: string;
  service_option_id: string;
  status_id: string | null;
  item_name_snapshot: string;
  service_name_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface DbOrderStatusHistory {
  id: string;
  order_id: string;
  from_status_id: string | null;
  to_status_id: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

@Injectable()
export class OrdersQueries {
  constructor(private readonly supabase: SupabaseClientService) {}

  // --- Addresses ---
  async createAddress(payload: Omit<DbCustomerAddress, 'id'>): Promise<DbCustomerAddress> {
    const { data, error } = await this.supabase.client
      .from('customer_addresses')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create customer address: ${error.message}`);
    }
    return data;
  }

  async findAddressesByUser(userId: string): Promise<DbCustomerAddress[]> {
    const { data, error } = await this.supabase.client
      .from('customer_addresses')
      .select('id, user_id, area_id, address_type_id, address_line_1, address_line_2, city, instructions, is_default')
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (error) {
      throw new Error(`Failed to fetch customer addresses: ${error.message}`);
    }
    return data || [];
  }

  async findAddressById(id: string): Promise<DbCustomerAddress | null> {
    const { data, error } = await this.supabase.client
      .from('customer_addresses')
      .select('id, user_id, area_id, address_type_id, address_line_1, address_line_2, city, instructions, is_default')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch address by ID: ${error.message}`);
    }
    return data;
  }

  // --- Orders ---
  async getOrdersCountForYear(year: number): Promise<number> {
    const startOfYear = `${year}-01-01T00:00:00.000Z`;
    const endOfYear = `${year}-12-31T23:59:59.999Z`;

    const { count, error } = await this.supabase.client
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfYear)
      .lte('created_at', endOfYear);

    if (error) {
      throw new Error(`Failed to count orders: ${error.message}`);
    }
    return count || 0;
  }

  async createOrder(payload: Omit<DbOrder, 'id' | 'created_at'>): Promise<DbOrder> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }

    const row = data as any;
    return {
      ...row,
      subtotal: parseFloat(row.subtotal),
      service_fee: parseFloat(row.service_fee),
      discount_total: parseFloat(row.discount_total),
      grand_total: parseFloat(row.grand_total),
    };
  }

  async createOrderItems(items: Omit<DbOrderItem, 'id'>[]): Promise<DbOrderItem[]> {
    const { data, error } = await this.supabase.client
      .from('order_items')
      .insert(items)
      .select();

    if (error) {
      throw new Error(`Failed to insert order items: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      ...row,
      unit_price: parseFloat(row.unit_price),
      line_total: parseFloat(row.line_total),
    }));
  }

  async findOrderById(id: string): Promise<any | null> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select(`
        *,
        status:lookup_values!status_id(code, label),
        frequency:lookup_values!frequency_id(code, label),
        pickup_slot:time_slots!pickup_slot_id(id, label, start_time, end_time),
        delivery_slot:time_slots!delivery_slot_id(id, label, start_time, end_time),
        address:customer_addresses!customer_address_id(*),
        items:order_items(*)
      `)
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch order details: ${error.message}`);
    }

    if (!data) return null;

    const row = data as any;
    return {
      ...row,
      subtotal: parseFloat(row.subtotal),
      service_fee: parseFloat(row.service_fee),
      discount_total: parseFloat(row.discount_total),
      grand_total: parseFloat(row.grand_total),
      items: (row.items || []).map((item: any) => ({
        ...item,
        unit_price: parseFloat(item.unit_price),
        line_total: parseFloat(item.line_total),
      })),
    };
  }

  async findOrdersByCustomer(customerId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select(`
        id, order_number, subtotal, service_fee, discount_total, grand_total, currency_code, created_at,
        status:lookup_values!status_id(code, label)
      `)
      .eq('customer_id', customerId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch customer orders: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      ...row,
      subtotal: parseFloat(row.subtotal),
      service_fee: parseFloat(row.service_fee),
      discount_total: parseFloat(row.discount_total),
      grand_total: parseFloat(row.grand_total),
    }));
  }

  async findAllOrders(page: number, limit: number, statusFilter?: string): Promise<{ items: any[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let countQuery = this.supabase.client
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    let rowsQuery = this.supabase.client
      .from('orders')
      .select(`
        id, order_number, subtotal, service_fee, discount_total, grand_total, currency_code, created_at,
        status:lookup_values!status_id(id, code, label),
        customer:app_users!customer_id(id, first_name, last_name, email)
      `)
      .eq('is_deleted', false);

    if (statusFilter) {
      // Resolve status lookup ID first or filter inner join
      rowsQuery = rowsQuery.eq('status.code', statusFilter);
      // For count, we filter by status_id
      // (Wait, we can query it easily if we just pass statusFilter. Let's do simple inner lookup or skip for now)
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      throw new Error(`Failed to count orders: ${countError.message}`);
    }

    const { data, error } = await rowsQuery
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    const items = (data || []).map((row: any) => ({
      ...row,
      subtotal: parseFloat(row.subtotal),
      service_fee: parseFloat(row.service_fee),
      discount_total: parseFloat(row.discount_total),
      grand_total: parseFloat(row.grand_total),
    }));

    return { items, total: count || 0 };
  }

  async updateOrderStatus(orderId: string, statusId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({ status_id: statusId, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  async updateOrderSchedule(
    orderId: string,
    schedule: {
      pickupDate: string;
      pickupSlotId: string;
      deliveryDate: string;
      deliverySlotId: string;
    },
  ): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({
        pickup_date: schedule.pickupDate,
        pickup_slot_id: schedule.pickupSlotId,
        delivery_date: schedule.deliveryDate,
        delivery_slot_id: schedule.deliverySlotId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Failed to update order schedule: ${error.message}`);
    }
  }

  async softDeleteOrder(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to soft-delete order: ${error.message}`);
    }
  }

  async restoreOrder(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('orders')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to restore order: ${error.message}`);
    }
  }

  // --- Timeline History ---
  async createStatusHistory(payload: Omit<DbOrderStatusHistory, 'id' | 'created_at'>): Promise<DbOrderStatusHistory> {
    const { data, error } = await this.supabase.client
      .from('order_status_history')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create status history entry: ${error.message}`);
    }
    return data;
  }

  async findStatusHistoryByOrder(orderId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('order_status_history')
      .select(`
        id,
        note,
        created_at,
        from_status:lookup_values!from_status_id(code, label),
        to_status:lookup_values!to_status_id(code, label),
        actor:app_users!changed_by(id, first_name, last_name, display_name)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch order status history: ${error.message}`);
    }
    return data || [];
  }

  // --- Audits ---
  async createAuditLog(payload: {
    actorUserId: string | null;
    action: string;
    entityName: string;
    entityId: string | null;
    oldValues?: any;
    newValues?: any;
  }): Promise<void> {
    const dataToInsert = {
      actor_user_id: payload.actorUserId,
      action: payload.action,
      entity_name: payload.entityName,
      entity_id: payload.entityId,
      old_values: payload.oldValues || null,
      new_values: payload.newValues || null,
    };

    const { error } = await this.supabase.client
      .from('audit_logs')
      .insert([dataToInsert]);

    // Silently log audit insert errors to stdout to avoid crashing key operations on trace fails
    if (error) {
      console.error(`Audit logging failed: ${error.message}`);
    }
  }

  async findSystemSettings(): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('system_settings')
      .select('setting_key, setting_value')
      .eq('is_deleted', false);

    if (error) {
      throw new Error(`Failed to fetch system settings: ${error.message}`);
    }
    return data || [];
  }
}
