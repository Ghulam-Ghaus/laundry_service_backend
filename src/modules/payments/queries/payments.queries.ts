import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../../../database/supabase.client';

export interface DbPayment {
  id: string;
  order_id: string;
  payment_method_id: string;
  payment_status_id: string;
  amount: number;
  currency_code: string;
  provider: string | null;
  provider_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

@Injectable()
export class PaymentsQueries {
  constructor(private readonly supabase: SupabaseClientService) {}

  async createPayment(payload: {
    orderId: string;
    paymentMethodId: string;
    paymentStatusId: string;
    amount: number;
    currencyCode?: string;
    provider?: string;
    providerReference?: string;
    paidAt?: string;
  }): Promise<DbPayment> {
    const dataToInsert = {
      order_id: payload.orderId,
      payment_method_id: payload.paymentMethodId,
      payment_status_id: payload.paymentStatusId,
      amount: payload.amount,
      currency_code: payload.currencyCode || 'PKR',
      provider: payload.provider || null,
      provider_reference: payload.providerReference || null,
      paid_at: payload.paidAt || null,
    };

    const { data, error } = await this.supabase.client
      .from('payments')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log payment transaction: ${error.message}`);
    }

    const row = data as any;
    return {
      ...row,
      amount: parseFloat(row.amount),
    };
  }

  async findPaymentsByOrder(orderId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('payments')
      .select(`
        id, amount, currency_code, provider, provider_reference, paid_at, created_at,
        method:lookup_values!payment_method_id(code, label),
        status:lookup_values!payment_status_id(code, label)
      `)
      .eq('order_id', orderId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch payments for order: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      ...row,
      amount: parseFloat(row.amount),
    }));
  }

  async findAllPayments(page: number, limit: number): Promise<{ items: any[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { count, error: countError } = await this.supabase.client
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    if (countError) {
      throw new Error(`Failed to count payments: ${countError.message}`);
    }

    const { data, error } = await this.supabase.client
      .from('payments')
      .select(`
        id, amount, currency_code, provider, provider_reference, paid_at, created_at,
        order:orders(id, order_number),
        method:lookup_values!payment_method_id(code, label),
        status:lookup_values!payment_status_id(code, label)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch payments: ${error.message}`);
    }

    const items = (data || []).map((row: any) => ({
      ...row,
      amount: parseFloat(row.amount),
    }));

    return { items, total: count || 0 };
  }
}
