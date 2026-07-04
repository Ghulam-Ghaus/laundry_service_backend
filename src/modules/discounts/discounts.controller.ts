import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateDiscountDto, UpdateDiscountDto, ValidateCouponDto } from './dto/discounts.dto';

@ApiTags('Public Coupons')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Public()
  @Post('validate')
  @ApiOperation({ summary: 'Validate coupon and get discount amount estimate' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.discountsService.validateCoupon(dto);
  }
}

@ApiTags('Admin Coupons')
@ApiBearerAuth()
@Controller('admin/discounts')
export class AdminDiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  @RequirePermissions('discounts.read')
  @ApiOperation({ summary: 'Get all discount coupons list (Admin)' })
  async getDiscounts() {
    return this.discountsService.getAllDiscounts(true);
  }

  @Post()
  @RequirePermissions('discounts.create')
  @ApiOperation({ summary: 'Create discount coupon (Admin)' })
  async createDiscount(@Body() dto: CreateDiscountDto) {
    return this.discountsService.createDiscount(dto);
  }

  @Patch(':id')
  @RequirePermissions('discounts.update')
  @ApiOperation({ summary: 'Update discount coupon (Admin)' })
  async updateDiscount(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    return this.discountsService.updateDiscount(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('discounts.delete')
  @ApiOperation({ summary: 'Soft delete discount coupon (Admin)' })
  async deleteDiscount(@Param('id') id: string) {
    await this.discountsService.deleteDiscount(id);
    return { message: 'Coupon deleted successfully' };
  }
}
