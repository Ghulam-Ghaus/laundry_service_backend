import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../../../database/supabase.client';

export interface DbServiceArea {
  id: string;
  code: string;
  name: string;
  city: string;
  province: string | null;
  country: string;
  is_serviceable: boolean;
  sort_order: number;
}

@Injectable()
export class AreasQueries {
  constructor(private readonly supabase: SupabaseClientService) {}

  async findAreas(includeNonServiceable = false): Promise<DbServiceArea[]> {
    let query = this.supabase.client
      .from('service_areas')
      .select('id, code, name, city, province, country, is_serviceable, sort_order')
      .eq('is_deleted', false);

    if (!includeNonServiceable) {
      query = query.eq('is_serviceable', true);
    }

    const { data, error } = await query.order('sort_order', { ascending: true });
    if (error) {
      throw new Error(`Failed to fetch service areas: ${error.message}`);
    }
    return data || [];
  }

  async findAreaById(id: string): Promise<DbServiceArea | null> {
    const { data, error } = await this.supabase.client
      .from('service_areas')
      .select('id, code, name, city, province, country, is_serviceable, sort_order')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch area by ID: ${error.message}`);
    }
    return data;
  }

  async findAreaByCode(code: string): Promise<DbServiceArea | null> {
    const { data, error } = await this.supabase.client
      .from('service_areas')
      .select('id, code, name, city, province, country, is_serviceable, sort_order')
      .eq('code', code)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch area by code: ${error.message}`);
    }
    return data;
  }

  async searchAreas(q: string): Promise<DbServiceArea[]> {
    const { data, error } = await this.supabase.client
      .from('service_areas')
      .select('id, code, name, city, province, country, is_serviceable, sort_order')
      .eq('is_deleted', false)
      .eq('is_serviceable', true)
      .ilike('name', `%${q}%`)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to search service areas: ${error.message}`);
    }
    return data || [];
  }

  async createArea(payload: {
    code: string;
    name: string;
    city: string;
    province?: string;
    country?: string;
    isServiceable?: boolean;
    sortOrder?: number;
  }): Promise<DbServiceArea> {
    const dataToInsert = {
      code: payload.code,
      name: payload.name,
      city: payload.city,
      province: payload.province || null,
      country: payload.country || 'Pakistan',
      is_serviceable: payload.isServiceable !== undefined ? payload.isServiceable : true,
      sort_order: payload.sortOrder || 0,
    };

    const { data, error } = await this.supabase.client
      .from('service_areas')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create service area: ${error.message}`);
    }
    return data;
  }

  async updateArea(id: string, updates: {
    code?: string;
    name?: string;
    city?: string;
    province?: string;
    country?: string;
    isServiceable?: boolean;
    sortOrder?: number;
  }): Promise<DbServiceArea> {
    const dataToUpdate: any = {};
    if (updates.code !== undefined) dataToUpdate.code = updates.code;
    if (updates.name !== undefined) dataToUpdate.name = updates.name;
    if (updates.city !== undefined) dataToUpdate.city = updates.city;
    if (updates.province !== undefined) dataToUpdate.province = updates.province;
    if (updates.country !== undefined) dataToUpdate.country = updates.country;
    if (updates.isServiceable !== undefined) dataToUpdate.is_serviceable = updates.isServiceable;
    if (updates.sortOrder !== undefined) dataToUpdate.sort_order = updates.sortOrder;

    const { data, error } = await this.supabase.client
      .from('service_areas')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update service area: ${error.message}`);
    }
    return data;
  }

  async deleteArea(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('service_areas')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete service area: ${error.message}`);
    }
  }
}
