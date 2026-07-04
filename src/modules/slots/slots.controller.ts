import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateSlotDto, UpdateSlotDto, LinkAreaSlotDto } from './dto/slots.dto';

@ApiTags('Public Slots')
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Public()
  @Get('availability')
  @ApiOperation({ summary: 'Get active available slots for an area, date, and type (pickup or delivery)' })
  async getAvailability(
    @Query('areaId') areaId: string,
    @Query('date') date: string,
    @Query('type') type: string, // 'pickup' or 'delivery'
  ) {
    return this.slotsService.getAvailableSlots(areaId, date, type);
  }
}

@ApiTags('Admin Slots')
@ApiBearerAuth()
@Controller('admin/slots')
export class AdminSlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @RequirePermissions('slots.read')
  @ApiOperation({ summary: 'Get all time slots (Admin)' })
  async getAllSlots() {
    return this.slotsService.getAllSlots();
  }

  @Post()
  @RequirePermissions('slots.create')
  @ApiOperation({ summary: 'Create time slot (Admin)' })
  async createSlot(@Body() dto: CreateSlotDto) {
    return this.slotsService.createSlot(dto);
  }

  @Patch(':id')
  @RequirePermissions('slots.update')
  @ApiOperation({ summary: 'Update time slot (Admin)' })
  async updateSlot(@Param('id') id: string, @Body() dto: UpdateSlotDto) {
    return this.slotsService.updateSlot(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('slots.delete')
  @ApiOperation({ summary: 'Soft delete time slot (Admin)' })
  async deleteSlot(@Param('id') id: string) {
    await this.slotsService.deleteSlot(id);
    return { message: 'Time slot deleted successfully' };
  }

  @Post('link-area')
  @RequirePermissions('slots.update')
  @ApiOperation({ summary: 'Link slot availability to service area and weekday (Admin)' })
  async linkAreaSlot(@Body() dto: LinkAreaSlotDto) {
    return this.slotsService.linkAreaSlot(dto);
  }
}
