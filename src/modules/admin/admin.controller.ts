import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Admin Panel')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @RequirePermissions('orders.read')
  @ApiOperation({ summary: 'Get aggregated today and status-based order KPI metrics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // --- Settings ---
  @Get('settings')
  @RequirePermissions('settings.update')
  @ApiOperation({ summary: 'Get all system settings key-value lists' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Post('settings')
  @RequirePermissions('settings.update')
  @ApiOperation({ summary: 'Update system settings keys' })
  async updateSettings(@Req() req: any, @Body() settingsPayload: Record<string, any>) {
    const actorUserId = req.user.id;
    return this.adminService.updateSettings(settingsPayload, actorUserId);
  }

  // --- Audit Logs ---
  @Get('audit-logs')
  @RequirePermissions('rbac.manage')
  @ApiOperation({ summary: 'Get action history traces list (Super Admin)' })
  async getAuditLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs(parseInt(page, 10), parseInt(limit, 10), action);
  }

  // --- Trash bin ---
  @Get('trash/:entityName')
  @RequirePermissions('catalog.delete')
  @ApiOperation({ summary: 'Get list of soft-deleted records for a table (e.g. orders, catalog_items)' })
  async getTrash(@Param('entityName') entityName: string) {
    return this.adminService.getTrashRecords(entityName);
  }

  @Post('trash/:entityName/:id/restore')
  @RequirePermissions('catalog.update')
  @ApiOperation({ summary: 'Restore a soft-deleted record' })
  async restoreRecord(@Req() req: any, @Param('entityName') entityName: string, @Param('id') id: string) {
    const actorUserId = req.user.id;
    return this.adminService.restoreRecord(entityName, id, actorUserId);
  }
}
