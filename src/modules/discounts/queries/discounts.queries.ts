import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../../../database/supabase.client';

export interface DbDiscount {
  id: string;
  code: string;
  name: string;
  discount_type_id: string;
  value: number;
  max_discount_amount: number | null;
  min_order_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

@Injectable()
export class DiscountsQueries {
  constructor(private readonly supabase: SupabaseClientService) {}

  async findDiscounts(includeInactive = false): Promise<DbDiscount[]> {
    let query = this.supabase.client
      .from('discounts')
      .select('id, code, name, discount_type_id, value, max_discount_amount, min_order_amount, usage_limit, used_count, starts_at, ends_at, is_active')
      .eq('is_deleted', false);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      throw new Error(`Failed to fetch discounts: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      ...row,
      value: parseFloat(row.value),
      max_discount_amount: row.max_discount_amount ? parseFloat(row.max_discount_amount) : null,
      min_order_amount: row.min_order_amount ? parseFloat(row.min_order_amount) : null,
    }));
  }

  async findDiscountById(id: string): Promise<DbDiscount | null> {
    const { data, error } = await this.supabase.client
      .from('discounts')
      .select('id, code, name, discount_type_id, value, max_discount_amount, min_order_amount, usage_limit, used_count, starts_at, ends_at, is_active')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch discount by ID: ${error.message}`);
    }

    if (!data) return null;

    const row = data as any;
    return {
      ...row,
      value: parseFloat(row.value),
      max_discount_amount: row.max_discount_amount ? parseFloat(row.max_discount_amount) : null,
      min_order_amount: row.min_order_amount ? parseFloat(row.min_order_amount) : null,
    };
  }

  async findDiscountByCode(code: string): Promise<DbDiscount | null> {
    const { data, error } = await this.supabase.client
      .from('discounts')
      .select(`
        id, code, name, discount_type_id, value, max_discount_amount, min_order_amount, usage_limit, used_count, starts_at, ends_at, is_active,
        discount_type:lookup_values!discount_type_id(code, label)
      `)
      .eq('code', code.toUpperCase())
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch discount by code: ${error.message}`);
    }

    if (!data) return null;

    const row = data as any;
    return {
      ...row,
      value: parseFloat(row.value),
      max_discount_amount: row.max_discount_amount ? parseFloat(row.max_discount_amount) : null,
      min_order_amount: row.min_order_amount ? parseFloat(row.min_order_amount) : null,
    };
  }

  async createDiscount(payload: {
    code: string;
    name: string;
    discountTypeId: string;
    value: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    usageLimit?: number;
    startsAt?: string;
    endsAt?: string;
  }): Promise<DbDiscount> {
    const dataToInsert = {
      code: payload.code.toUpperCase(),
      name: payload.name,
      discount_type_id: payload.discountTypeId,
      value: payload.value,
      max_discount_amount: payload.maxDiscountAmount || null,
      min_order_amount: payload.minOrderAmount || null,
      usage_limit: payload.usageLimit || null,
      starts_at: payload.startsAt || null,
      ends_at: payload.endsAt || null,
    };

    const { data, error } = await this.supabase.client
      .from('discounts')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create discount: ${error.message}`);
    }

    const row = data as any;
    return {
      ...row,
      value: parseFloat(row.value),
      max_discount_amount: row.max_discount_amount ? parseFloat(row.max_discount_amount) : null,
      min_order_amount: row.min_order_amount ? parseFloat(row.min_order_amount) : null,
    };
  }

  async updateDiscount(id: string, updates: {
    name?: string;
    value?: number;
    maxDiscountAmount?: number;
    minOrderAmount?: number;
    usageLimit?: number;
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
  }): Promise<DbDiscount> {
    const dataToUpdate: any = {};
    if (updates.name !== undefined) dataToUpdate.name = updates.name;
    if (updates.value !== undefined) dataToUpdate.value = updates.value;
    if (updates.maxDiscountAmount !== undefined) dataToUpdate.max_discount_amount = updates.maxDiscountAmount;
    if (updates.minOrderAmount !== undefined) dataToUpdate.min_order_amount = updates.minOrderAmount;
    if (updates.usageLimit !== undefined) dataToUpdate.usage_limit = updates.usageLimit;
    if (updates.startsAt !== undefined) dataToUpdate.starts_at = updates.startsAt;
    if (updates.endsAt !== undefined) dataToUpdate.ends_at = updates.endsAt;
    if (updates.isActive !== undefined) dataToUpdate.is_active = updates.isActive;

    const { data, error } = await this.supabase.client
      .from('discounts')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update discount: ${error.message}`);
    }

    const row = data as any;
    return {
      ...row,
      value: parseFloat(row.value),
      max_discount_amount: row.max_discount_amount ? parseFloat(row.max_discount_amount) : null,
      min_order_amount: row.min_order_amount ? parseFloat(row.min_order_amount) : null,
    };
  }

  async incrementUsedCount(id: string): Promise<void> {
    // In supabase we can call rpc or read and update. Let's read then update.
    const discount = await this.findDiscountById(id);
    if (discount) {
      const { error } = await this.supabase.client
        .from('discounts')
        .update({ used_count: discount.used_count + 1 })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to increment coupon utilization: ${error.message}`);
      }
    }
  }

  async deleteDiscount(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('discounts')
      .update({ is_deleted: true, is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete discount: ${error.message}`);
    }
  }
}
