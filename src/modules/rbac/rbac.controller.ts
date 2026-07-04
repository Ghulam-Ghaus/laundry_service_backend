import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/rbac.dto';

@ApiTags('Admin RBAC')
@Controller('admin')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  async getRoles() {
    return this.rbacService.getRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Update an existing role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  async deleteRole(@Param('id') id: string) {
    await this.rbacService.deleteRole(id);
    return { message: 'Role deleted successfully' };
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all system permissions' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async getPermissions() {
    return this.rbacService.getPermissions();
  }

  @Post('roles/:id/permissions')
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiResponse({ status: 200, description: 'Permission assigned' })
  async assignPermissionToRole(@Param('id') roleId: string, @Body('permissionId') permissionId: string) {
    await this.rbacService.assignPermissionToRole(roleId, permissionId);
    return { message: 'Permission assigned to role successfully' };
  }

  @Delete('roles/:id/permissions/:permissionId')
  @ApiOperation({ summary: 'Remove a permission from a role' })
  @ApiResponse({ status: 200, description: 'Permission removed' })
  async removePermissionFromRole(@Param('id') roleId: string, @Param('permissionId') permissionId: string) {
    await this.rbacService.removePermissionFromRole(roleId, permissionId);
    return { message: 'Permission removed from role successfully' };
  }

  @Post('users/:id/roles')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({ status: 200, description: 'Role assigned' })
  async assignRoleToUser(@Param('id') userId: string, @Body('roleId') roleId: string) {
    await this.rbacService.assignRoleToUser(userId, roleId);
    return { message: 'Role assigned to user successfully' };
  }

  @Delete('users/:id/roles/:roleId')
  @ApiOperation({ summary: 'Remove a role from a user' })
  @ApiResponse({ status: 200, description: 'Role removed' })
  async removeRoleFromUser(@Param('id') userId: string, @Param('roleId') roleId: string) {
    await this.rbacService.removeRoleFromUser(userId, roleId);
    return { message: 'Role removed from user successfully' };
  }
}
