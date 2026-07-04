import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AssignStaffDto } from '../orders/dto/orders.dto';

@ApiTags('Staff Panel')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('tasks')
  @ApiOperation({ summary: 'Get list of tasks assigned to staff rider' })
  async getTasks(@Req() req: any) {
    const staffUserId = req.user.id;
    return this.staffService.getStaffTasks(staffUserId);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get details of specific task' })
  async getTask(@Req() req: any, @Param('id') id: string) {
    const staffUserId = req.user.id;
    return this.staffService.getTaskById(id, staffUserId);
  }

  @Patch('tasks/:id/status')
  @ApiOperation({ summary: 'Update staff task status (e.g. in_progress, completed)' })
  async updateTaskStatus(@Req() req: any, @Param('id') id: string, @Body('statusCode') statusCode: string) {
    const staffUserId = req.user.id;
    return this.staffService.updateTaskStatus(id, statusCode, staffUserId);
  }

  @Post('tasks/:id/notes')
  @ApiOperation({ summary: 'Add execution notes to task' })
  async addNotes(@Req() req: any, @Param('id') id: string, @Body('notes') notes: string) {
    const staffUserId = req.user.id;
    return this.staffService.addTaskNotes(id, notes, staffUserId);
  }
}

@ApiTags('Admin Orders')
@ApiBearerAuth()
@Controller('admin/orders')
export class AdminStaffController {
  constructor(private readonly staffService: StaffService) {}

  @Patch(':id/assign-staff')
  @RequirePermissions('orders.assign_staff')
  @ApiOperation({ summary: 'Assign staff rider to order (Admin)' })
  async assignStaff(@Req() req: any, @Param('id') id: string, @Body() dto: AssignStaffDto) {
    const adminActorUserId = req.user.id;
    return this.staffService.assignStaffToOrder(id, dto, adminActorUserId);
  }
}
