import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../../../database/supabase.client';

export interface DbLookupGroup {
  id: string;
  group_key: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface DbLookupValue {
  id: string;
  group_id: string;
  code: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
}

@Injectable()
export class LookupsQueries {
  constructor(private readonly supabase: SupabaseClientService) {}

  async findGroups(): Promise<DbLookupGroup[]> {
    const { data, error } = await this.supabase.client
      .from('lookup_groups')
      .select('id, group_key, name, description, is_active')
      .eq('is_deleted', false)
      .eq('is_active', true)
      .order('group_key', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch lookup groups: ${error.message}`);
    }

    return data || [];
  }

  async findValuesByGroupKey(groupKey: string): Promise<DbLookupValue[]> {
    // Join lookup_values with lookup_groups on groupKey
    const { data, error } = await this.supabase.client
      .from('lookup_values')
      .select(`
        id,
        group_id,
        code,
        label,
        description,
        sort_order,
        is_default,
        is_active,
        lookup_groups!inner(group_key)
      `)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .eq('lookup_groups.group_key', groupKey)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch lookup values for group ${groupKey}: ${error.message}`);
    }

    // Map clean results
    return (data || []).map((row: any) => ({
      id: row.id,
      group_id: row.group_id,
      code: row.code,
      label: row.label,
      description: row.description,
      sort_order: row.sort_order,
      is_default: row.is_default,
      is_active: row.is_active,
    }));
  }

  async findValueByCode(groupKey: string, code: string): Promise<DbLookupValue | null> {
    const { data, error } = await this.supabase.client
      .from('lookup_values')
      .select(`
        id,
        group_id,
        code,
        label,
        description,
        sort_order,
        is_default,
        is_active,
        lookup_groups!inner(group_key)
      `)
      .eq('is_deleted', false)
      .eq('lookup_groups.group_key', groupKey)
      .eq('code', code)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch lookup value for ${groupKey}.${code}: ${error.message}`);
    }

    if (!data) return null;

    const row = data as any;
    return {
      id: row.id,
      group_id: row.group_id,
      code: row.code,
      label: row.label,
      description: row.description,
      sort_order: row.sort_order,
      is_default: row.is_default,
      is_active: row.is_active,
    };
  }

  async findValueById(id: string): Promise<DbLookupValue | null> {
    const { data, error } = await this.supabase.client
      .from('lookup_values')
      .select('id, group_id, code, label, description, sort_order, is_default, is_active')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch lookup value by ID: ${error.message}`);
    }
    return data;
  }
}
