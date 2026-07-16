import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../../../database/supabase.client';

export interface DbServiceCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_key: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DbCatalogItem {
  id: string;
  category_id: string;
  code: string;
  name: string;
  description: string | null;
  icon_key: string | null;
  image_url: string | null;
  unit_label: string;
  min_quantity: number;
  sort_order: number;
  is_active: boolean;
}

export interface DbServiceOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DbItemPrice {
  id: string;
  item_id: string;
  service_option_id: string;
  currency_code: string;
  price: number;
  compare_at_price: number | null;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
}

@Injectable()
export class CatalogQueries {
  constructor(private readonly supabase: SupabaseClientService) {}

  // --- Categories ---
  async findCategories(includeInactive = false): Promise<DbServiceCategory[]> {
    let query = this.supabase.client
      .from('service_categories')
      .select('id, code, name, description, icon_key, image_url, sort_order, is_active')
      .eq('is_deleted', false);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('sort_order', { ascending: true });
    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
    return data || [];
  }

  async findCategoryById(id: string): Promise<DbServiceCategory | null> {
    const { data, error } = await this.supabase.client
      .from('service_categories')
      .select('id, code, name, description, icon_key, image_url, sort_order, is_active')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch category by ID: ${error.message}`);
    }
    return data;
  }

  async findCategoryByCode(code: string): Promise<DbServiceCategory | null> {
    const { data, error } = await this.supabase.client
      .from('service_categories')
      .select('id, code, name, description, icon_key, image_url, sort_order, is_active')
      .eq('code', code)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch category by code: ${error.message}`);
    }
    return data;
  }

  async createCategory(payload: {
    code: string;
    name: string;
    description?: string;
    iconKey?: string;
    imageUrl?: string;
    sortOrder?: number;
  }): Promise<DbServiceCategory> {
    const dataToInsert = {
      code: payload.code,
      name: payload.name,
      description: payload.description || null,
      icon_key: payload.iconKey || null,
      image_url: payload.imageUrl || null,
      sort_order: payload.sortOrder || 0,
    };

    const { data, error } = await this.supabase.client
      .from('service_categories')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }
    return data;
  }

  async updateCategory(id: string, updates: {
    name?: string;
    description?: string;
    iconKey?: string;
    imageUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<DbServiceCategory> {
    const dataToUpdate: any = {};
    if (updates.name !== undefined) dataToUpdate.name = updates.name;
    if (updates.description !== undefined) dataToUpdate.description = updates.description;
    if (updates.iconKey !== undefined) dataToUpdate.icon_key = updates.iconKey;
    if (updates.imageUrl !== undefined) dataToUpdate.image_url = updates.imageUrl;
    if (updates.sortOrder !== undefined) dataToUpdate.sort_order = updates.sortOrder;
    if (updates.isActive !== undefined) dataToUpdate.is_active = updates.isActive;

    const { data, error } = await this.supabase.client
      .from('service_categories')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('service_categories')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  // --- Items ---
  async findItemsByCategoryId(categoryId: string, includeInactive = false): Promise<DbCatalogItem[]> {
    let query = this.supabase.client
      .from('catalog_items')
      .select('id, category_id, code, name, description, icon_key, image_url, unit_label, min_quantity, sort_order, is_active')
      .eq('category_id', categoryId)
      .eq('is_deleted', false);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('sort_order', { ascending: true });
    if (error) {
      throw new Error(`Failed to fetch catalog items: ${error.message}`);
    }
    return data || [];
  }

  async findItemById(id: string): Promise<DbCatalogItem | null> {
    const { data, error } = await this.supabase.client
      .from('catalog_items')
      .select('id, category_id, code, name, description, icon_key, image_url, unit_label, min_quantity, sort_order, is_active')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch catalog item by ID: ${error.message}`);
    }
    return data;
  }

  async findItemByCode(code: string): Promise<DbCatalogItem | null> {
    const { data, error } = await this.supabase.client
      .from('catalog_items')
      .select('id, category_id, code, name, description, icon_key, image_url, unit_label, min_quantity, sort_order, is_active')
      .eq('code', code)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch catalog item by code: ${error.message}`);
    }
    return data;
  }

  async searchItems(searchTerm: string): Promise<DbCatalogItem[]> {
    const { data, error } = await this.supabase.client
      .from('catalog_items')
      .select('id, category_id, code, name, description, icon_key, image_url, unit_label, min_quantity, sort_order, is_active')
      .eq('is_deleted', false)
      .eq('is_active', true)
      .ilike('name', `%${searchTerm}%`)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to search catalog items: ${error.message}`);
    }
    return data || [];
  }

  async createItem(payload: {
    categoryId: string;
    code: string;
    name: string;
    description?: string;
    iconKey?: string;
    imageUrl?: string;
    unitLabel?: string;
    minQuantity?: number;
    sortOrder?: number;
  }): Promise<DbCatalogItem> {
    const dataToInsert = {
      category_id: payload.categoryId,
      code: payload.code,
      name: payload.name,
      description: payload.description || null,
      icon_key: payload.iconKey || null,
      image_url: payload.imageUrl || null,
      unit_label: payload.unitLabel || 'item',
      min_quantity: payload.minQuantity || 1,
      sort_order: payload.sortOrder || 0,
    };

    const { data, error } = await this.supabase.client
      .from('catalog_items')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create item: ${error.message}`);
    }
    return data;
  }

  async updateItem(id: string, updates: {
    categoryId?: string;
    name?: string;
    description?: string;
    iconKey?: string;
    imageUrl?: string;
    unitLabel?: string;
    minQuantity?: number;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<DbCatalogItem> {
    const dataToUpdate: any = {};
    if (updates.categoryId !== undefined) dataToUpdate.category_id = updates.categoryId;
    if (updates.name !== undefined) dataToUpdate.name = updates.name;
    if (updates.description !== undefined) dataToUpdate.description = updates.description;
    if (updates.iconKey !== undefined) dataToUpdate.icon_key = updates.iconKey;
    if (updates.imageUrl !== undefined) dataToUpdate.image_url = updates.imageUrl;
    if (updates.unitLabel !== undefined) dataToUpdate.unit_label = updates.unitLabel;
    if (updates.minQuantity !== undefined) dataToUpdate.min_quantity = updates.minQuantity;
    if (updates.sortOrder !== undefined) dataToUpdate.sort_order = updates.sortOrder;
    if (updates.isActive !== undefined) dataToUpdate.is_active = updates.isActive;

    const { data, error } = await this.supabase.client
      .from('catalog_items')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update item: ${error.message}`);
    }
    return data;
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('catalog_items')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  // --- Service Options ---
  async findServiceOptions(): Promise<DbServiceOption[]> {
    const { data, error } = await this.supabase.client
      .from('service_options')
      .select('id, code, name, description, sort_order, is_active')
      .eq('is_deleted', false)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch service options: ${error.message}`);
    }
    return data || [];
  }

  async findServiceOptionById(id: string): Promise<DbServiceOption | null> {
    const { data, error } = await this.supabase.client
      .from('service_options')
      .select('id, code, name, description, sort_order, is_active')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch service option by ID: ${error.message}`);
    }
    return data;
  }

  async createServiceOption(payload: { code: string; name: string; description?: string; sortOrder?: number }): Promise<DbServiceOption> {
    const dataToInsert = {
      code: payload.code,
      name: payload.name,
      description: payload.description || null,
      sort_order: payload.sortOrder || 0,
    };

    const { data, error } = await this.supabase.client
      .from('service_options')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create service option: ${error.message}`);
    }
    return data;
  }

  async updateServiceOption(id: string, updates: { name?: string; description?: string; sortOrder?: number; isActive?: boolean }): Promise<DbServiceOption> {
    const dataToUpdate: any = {};
    if (updates.name !== undefined) dataToUpdate.name = updates.name;
    if (updates.description !== undefined) dataToUpdate.description = updates.description;
    if (updates.sortOrder !== undefined) dataToUpdate.sort_order = updates.sortOrder;
    if (updates.isActive !== undefined) dataToUpdate.is_active = updates.isActive;

    const { data, error } = await this.supabase.client
      .from('service_options')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update service option: ${error.message}`);
    }
    return data;
  }

  async deleteServiceOption(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('service_options')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete service option: ${error.message}`);
    }
  }

  // --- Pricing ---
  async findPricesForItems(itemIds: string[]): Promise<DbItemPrice[]> {
    if (itemIds.length === 0) return [];
    const nowStr = new Date().toISOString();

    const { data, error } = await this.supabase.client
      .from('item_prices')
      .select('id, item_id, service_option_id, currency_code, price, compare_at_price, effective_from, effective_to, is_active')
      .eq('is_deleted', false)
      .eq('is_active', true)
      .in('item_id', itemIds)
      .lte('effective_from', nowStr)
      .or(`effective_to.is.null,effective_to.gt.${nowStr}`);

    if (error) {
      throw new Error(`Failed to fetch prices: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      item_id: row.item_id,
      service_option_id: row.service_option_id,
      currency_code: row.currency_code,
      price: parseFloat(row.price),
      compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
      effective_from: row.effective_from,
      effective_to: row.effective_to,
      is_active: row.is_active,
    }));
  }

  async findCurrentPrice(itemId: string, serviceOptionId: string): Promise<DbItemPrice | null> {
    const nowStr = new Date().toISOString();

    const { data, error } = await this.supabase.client
      .from('item_prices')
      .select('id, item_id, service_option_id, currency_code, price, compare_at_price, effective_from, effective_to, is_active')
      .eq('item_id', itemId)
      .eq('service_option_id', serviceOptionId)
      .eq('is_deleted', false)
      .eq('is_active', true)
      .lte('effective_from', nowStr)
      .or(`effective_to.is.null,effective_to.gt.${nowStr}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch current price: ${error.message}`);
    }

    if (!data) return null;

    const row = data as any;
    return {
      id: row.id,
      item_id: row.item_id,
      service_option_id: row.service_option_id,
      currency_code: row.currency_code,
      price: parseFloat(row.price),
      compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
      effective_from: row.effective_from,
      effective_to: row.effective_to,
      is_active: row.is_active,
    };
  }

  async closeActivePrice(itemId: string, serviceOptionId: string, closingTime: Date): Promise<void> {
    const closingTimeStr = closingTime.toISOString();
    const activePrice = await this.findCurrentPrice(itemId, serviceOptionId);

    if (activePrice) {
      const { error } = await this.supabase.client
        .from('item_prices')
        .update({ effective_to: closingTimeStr, is_active: false })
        .eq('id', activePrice.id);

      if (error) {
        throw new Error(`Failed to close active price: ${error.message}`);
      }
    }
  }

  async createPrice(payload: {
    itemId: string;
    serviceOptionId: string;
    currencyCode: string;
    price: number;
    compareAtPrice?: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }): Promise<DbItemPrice> {
    const dataToInsert = {
      item_id: payload.itemId,
      service_option_id: payload.serviceOptionId,
      currency_code: payload.currencyCode || 'PKR',
      price: payload.price,
      compare_at_price: payload.compareAtPrice || null,
      effective_from: payload.effectiveFrom ? payload.effectiveFrom.toISOString() : new Date().toISOString(),
      effective_to: payload.effectiveTo ? payload.effectiveTo.toISOString() : null,
    };

    const { data, error } = await this.supabase.client
      .from('item_prices')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create item price: ${error.message}`);
    }

    const row = data as any;
    return {
      id: row.id,
      item_id: row.item_id,
      service_option_id: row.service_option_id,
      currency_code: row.currency_code,
      price: parseFloat(row.price),
      compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
      effective_from: row.effective_from,
      effective_to: row.effective_to,
      is_active: row.is_active,
    };
  }

  async findPriceHistory(itemId: string, serviceOptionId: string): Promise<DbItemPrice[]> {
    const { data, error } = await this.supabase.client
      .from('item_prices')
      .select('id, item_id, service_option_id, currency_code, price, compare_at_price, effective_from, effective_to, is_active')
      .eq('item_id', itemId)
      .eq('service_option_id', serviceOptionId)
      .eq('is_deleted', false)
      .order('effective_from', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch price history: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      item_id: row.item_id,
      service_option_id: row.service_option_id,
      currency_code: row.currency_code,
      price: parseFloat(row.price),
      compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
      effective_from: row.effective_from,
      effective_to: row.effective_to,
      is_active: row.is_active,
    }));
  }

  async deletePrice(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('item_prices')
      .update({ is_deleted: true, is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete price record: ${error.message}`);
    }
  }
}
