import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateTemplateDto, UpdateTemplateDto, PreviewTemplateDto } from './dto/notifications.dto';

@ApiTags('Admin Notifications')
@ApiBearerAuth()
@Controller('admin/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // --- Templates CRUD ---
  @Get('templates')
  @RequirePermissions('notifications.read')
  @ApiOperation({ summary: 'Get all notification templates list (Admin)' })
  async getTemplates() {
    return this.notificationsService.getTemplates();
  }

  @Post('templates')
  @RequirePermissions('notifications.create')
  @ApiOperation({ summary: 'Create a notification template (Admin)' })
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.notificationsService.createTemplate(dto);
  }

  @Patch('templates/:id')
  @RequirePermissions('notifications.update')
  @ApiOperation({ summary: 'Update a notification template (Admin)' })
  async updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.notificationsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @RequirePermissions('notifications.delete')
  @ApiOperation({ summary: 'Soft delete a notification template (Admin)' })
  async deleteTemplate(@Param('id') id: string) {
    await this.notificationsService.deleteTemplate(id);
    return { message: 'Notification template deleted successfully' };
  }

  @Post('templates/:id/preview')
  @RequirePermissions('notifications.read')
  @ApiOperation({ summary: 'Preview a compiled template using variables values (Admin)' })
  async previewTemplate(@Param('id') id: string, @Body() dto: PreviewTemplateDto) {
    return this.notificationsService.previewTemplate(id, dto.variables);
  }

  // --- Send Logs ---
  @Get('logs')
  @RequirePermissions('notifications.read')
  @ApiOperation({ summary: 'Get notification logs history (Admin)' })
  async getLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.notificationsService.getLogs(parseInt(page, 10), parseInt(limit, 10));
  }
}
