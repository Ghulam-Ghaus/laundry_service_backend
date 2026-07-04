import { Injectable, BadRequestException } from '@nestjs/common';
import { RbacQueries, DbRole, DbPermission } from './queries/rbac.queries';
import { CreateRoleDto, UpdateRoleDto } from './dto/rbac.dto';

@Injectable()
export class RbacService {
  constructor(private readonly rbacQueries: RbacQueries) {}

  async getRoles(): Promise<DbRole[]> {
    return this.rbacQueries.findAllRoles();
  }

  async getPermissions(): Promise<DbPermission[]> {
    return this.rbacQueries.findAllPermissions();
  }

  async getPermissionsForUser(userId: string): Promise<string[]> {
    return this.rbacQueries.findPermissionsForUser(userId);
  }

  async getRolesForUser(userId: string): Promise<string[]> {
    return this.rbacQueries.findRolesForUser(userId);
  }

  async createRole(dto: CreateRoleDto): Promise<DbRole> {
    const existing = await this.rbacQueries.findRoleByCode(dto.code);
    if (existing) {
      throw new BadRequestException(`Role with code ${dto.code} already exists`);
    }
    return this.rbacQueries.createRole(dto);
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<DbRole> {
    const existing = await this.rbacQueries.findRoleById(id);
    if (!existing) {
      throw new BadRequestException('Role not found');
    }
    if (existing.is_system) {
      throw new BadRequestException('System roles cannot be modified');
    }
    return this.rbacQueries.updateRole(id, dto);
  }

  async deleteRole(id: string): Promise<void> {
    const existing = await this.rbacQueries.findRoleById(id);
    if (!existing) {
      throw new BadRequestException('Role not found');
    }
    if (existing.is_system) {
      throw new BadRequestException('System roles cannot be deleted');
    }
    await this.rbacQueries.deleteRole(id);
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await this.rbacQueries.assignPermissionToRole(roleId, permissionId);
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.rbacQueries.removePermissionFromRole(roleId, permissionId);
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.rbacQueries.assignRoleToUser(userId, roleId);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.rbacQueries.removeRoleFromUser(userId, roleId);
  }
}
