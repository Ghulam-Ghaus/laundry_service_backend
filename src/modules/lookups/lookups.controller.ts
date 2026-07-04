import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LookupsService } from './lookups.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public Lookups')
@Controller('public/lookups')
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  @Public()
  @Get('groups')
  @ApiOperation({ summary: 'Get all lookup groups' })
  @ApiResponse({ status: 200, description: 'List of lookup groups' })
  async getGroups() {
    return this.lookupsService.getGroups();
  }

  @Public()
  @Get(':groupKey')
  @ApiOperation({ summary: 'Get lookup values by group key' })
  @ApiResponse({ status: 200, description: 'List of lookup values for group' })
  async getValues(@Param('groupKey') groupKey: string) {
    return this.lookupsService.getValuesByGroup(groupKey);
  }
}
