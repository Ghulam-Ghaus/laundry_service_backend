import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AreasService } from './areas.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateAreaDto, UpdateAreaDto } from './dto/areas.dto';

@ApiTags('Public Areas')
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all active serviceable areas' })
  async getAreas() {
    return this.areasService.getAreas(false);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search serviceable service areas' })
  async searchAreas(@Query('q') q: string) {
    return this.areasService.searchAreas(q);
  }
}

@ApiTags('Admin Areas')
@ApiBearerAuth()
@Controller('admin/areas')
export class AdminAreasController {
  constructor(private readonly areasService: AreasService) {}

  @Get()
  @RequirePermissions('areas.read')
  @ApiOperation({ summary: 'Get all service areas including non-serviceable (Admin)' })
  async getAreas() {
    return this.areasService.getAreas(true);
  }

  @Post()
  @RequirePermissions('areas.create')
  @ApiOperation({ summary: 'Create a service area (Admin)' })
  async createArea(@Body() dto: CreateAreaDto) {
    return this.areasService.createArea(dto);
  }

  @Patch(':id')
  @RequirePermissions('areas.update')
  @ApiOperation({ summary: 'Update a service area (Admin)' })
  async updateArea(@Param('id') id: string, @Body() dto: UpdateAreaDto) {
    return this.areasService.updateArea(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('areas.delete')
  @ApiOperation({ summary: 'Soft delete a service area (Admin)' })
  async deleteArea(@Param('id') id: string) {
    await this.areasService.deleteArea(id);
    return { message: 'Service area deleted successfully' };
  }
}
