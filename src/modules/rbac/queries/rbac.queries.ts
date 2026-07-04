import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../../../database/supabase.client';

export interface DbRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
}

export interface DbPermission {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  is_active: boolean;
}

@Injectable()
export class RbacQueries {
  constructor(private readonly supabase: SupabaseClientService) {}

  async findAllRoles(): Promise<DbRole[]> {
    const { data, error } = await this.supabase.client
      .from('roles')
      .select('id, code, name, description, is_system, is_active')
      .eq('is_deleted', false)
      .order('code', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch roles: ${error.message}`);
    }
    return data || [];
  }

  async findRoleById(id: string): Promise<DbRole | null> {
    const { data, error } = await this.supabase.client
      .from('roles')
      .select('id, code, name, description, is_system, is_active')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch role: ${error.message}`);
    }
    return data;
  }

  async findRoleByCode(code: string): Promise<DbRole | null> {
    const { data, error } = await this.supabase.client
      .from('roles')
      .select('id, code, name, description, is_system, is_active')
      .eq('code', code)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch role: ${error.message}`);
    }
    return data;
  }

  async createRole(role: { code: string; name: string; description?: string }): Promise<DbRole> {
    const payload = {
      code: role.code,
      name: role.name,
      description: role.description || null,
    };

    const { data, error } = await this.supabase.client
      .from('roles')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create role: ${error.message}`);
    }
    return data;
  }

  async updateRole(id: string, updates: Partial<Omit<DbRole, 'id' | 'is_system'>>): Promise<DbRole> {
    const { data, error } = await this.supabase.client
      .from('roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update role: ${error.message}`);
    }
    return data;
  }

  async deleteRole(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('roles')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete role: ${error.message}`);
    }
  }

  async findAllPermissions(): Promise<DbPermission[]> {
    const { data, error } = await this.supabase.client
      .from('permissions')
      .select('id, code, name, resource, action, description, is_active')
      .eq('is_deleted', false)
      .order('code', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch permissions: ${error.message}`);
    }
    return data || [];
  }

  async findPermissionsForUser(userId: string): Promise<string[]> {
    // 1. Get roles assigned to user
    const { data: userRoles, error: urError } = await this.supabase.client
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);

    if (urError) {
      throw new Error(`Failed to fetch user roles: ${urError.message}`);
    }

    if (!userRoles || userRoles.length === 0) {
      return [];
    }

    const roleIds = userRoles.map((r) => r.role_id);

    // 2. Get active permissions for those roles
    const { data: rolePerms, error: rpError } = await this.supabase.client
      .from('role_permissions')
      .select('permission_id, permissions!inner(code, is_active, is_deleted)')
      .in('role_id', roleIds)
      .eq('permissions.is_active', true)
      .eq('permissions.is_deleted', false);

    if (rpError) {
      throw new Error(`Failed to fetch role permissions: ${rpError.message}`);
    }

    return Array.from(new Set(rolePerms.map((rp: any) => rp.permissions.code)));
  }

  async findRolesForUser(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase.client
      .from('user_roles')
      .select('roles!inner(code)')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch user roles: ${error.message}`);
    }

    return data.map((ur: any) => ur.roles.code);
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('role_permissions')
      .insert([{ role_id: roleId, permission_id: permissionId }]);

    if (error) {
      throw new Error(`Failed to assign permission: ${error.message}`);
    }
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);

    if (error) {
      throw new Error(`Failed to remove permission: ${error.message}`);
    }
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('user_roles')
      .insert([{ user_id: userId, role_id: roleId }]);

    if (error) {
      throw new Error(`Failed to assign role: ${error.message}`);
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) {
      throw new Error(`Failed to remove role: ${error.message}`);
    }
  }
}
