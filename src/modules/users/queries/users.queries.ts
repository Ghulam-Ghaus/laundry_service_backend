import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../../../database/supabase.client';

export interface DbUser {
  id: string;
  auth_user_id: string | null;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  preferred_language_id: string | null;
  default_role_id: string | null;
  is_active: boolean;
  last_login_at: string | null;
  password_hash?: string | null;
}

@Injectable()
export class UsersQueries {
  constructor(private readonly supabase: SupabaseClientService) {}

  async findById(id: string): Promise<DbUser | null> {
    const { data, error } = await this.supabase.client
      .from('app_users')
      .select('id, auth_user_id, email, phone, first_name, last_name, display_name, avatar_url, preferred_language_id, default_role_id, is_active, last_login_at, password_hash')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
    return data;
  }

  async findByAuthId(authUserId: string): Promise<DbUser | null> {
    const { data, error } = await this.supabase.client
      .from('app_users')
      .select('id, auth_user_id, email, phone, first_name, last_name, display_name, avatar_url, preferred_language_id, default_role_id, is_active, last_login_at, password_hash')
      .eq('auth_user_id', authUserId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find user by auth ID: ${error.message}`);
    }
    return data;
  }

  async findByEmail(email: string): Promise<DbUser | null> {
    const { data, error } = await this.supabase.client
      .from('app_users')
      .select('id, auth_user_id, email, phone, first_name, last_name, display_name, avatar_url, preferred_language_id, default_role_id, is_active, last_login_at, password_hash')
      .eq('email', email)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
    return data;
  }

  async createUser(user: Omit<DbUser, 'id' | 'is_active' | 'last_login_at' | 'display_name'> & { id?: string }): Promise<DbUser> {
    const payload = {
      ...user,
      display_name: `${user.first_name} ${user.last_name || ''}`.trim(),
    };

    const { data, error } = await this.supabase.client
      .from('app_users')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create app user: ${error.message}`);
    }
    return data;
  }

  async updateUser(id: string, updates: Partial<Omit<DbUser, 'id' | 'email'>>): Promise<DbUser> {
    const payload: any = { ...updates };
    if (updates.first_name || updates.last_name) {
      // Re-calculate display name if name changed
      const current = await this.findById(id);
      if (current) {
        const fn = updates.first_name !== undefined ? updates.first_name : current.first_name;
        const ln = updates.last_name !== undefined ? updates.last_name : current.last_name;
        payload.display_name = `${fn} ${ln || ''}`.trim();
      }
    }

    const { data, error } = await this.supabase.client
      .from('app_users')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update app user: ${error.message}`);
    }
    return data;
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('app_users')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to soft delete user: ${error.message}`);
    }
  }

  async restoreUser(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('app_users')
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to restore user: ${error.message}`);
    }
  }

  async findAllUsers(page: number, limit: number): Promise<{ items: DbUser[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 1. Get total count
    const { count, error: countError } = await this.supabase.client
      .from('app_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    if (countError) {
      throw new Error(`Failed to count users: ${countError.message}`);
    }

    // 2. Get paginated rows
    const { data, error } = await this.supabase.client
      .from('app_users')
      .select('id, auth_user_id, email, phone, first_name, last_name, display_name, avatar_url, preferred_language_id, default_role_id, is_active, last_login_at, password_hash')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated users: ${error.message}`);
    }

    return {
      items: data || [],
      total: count || 0,
    };
  }

  async findByPhone(phone: string): Promise<DbUser | null> {
    const { data, error } = await this.supabase.client
      .from('app_users')
      .select('id, auth_user_id, email, phone, first_name, last_name, display_name, avatar_url, preferred_language_id, default_role_id, is_active, last_login_at, password_hash')
      .eq('phone', phone)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find user by phone: ${error.message}`);
    }
    return data;
  }
}
