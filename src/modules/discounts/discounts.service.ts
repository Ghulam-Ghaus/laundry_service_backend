import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DiscountsQueries, DbDiscount } from './queries/discounts.queries';
import { LookupsQueries } from '../lookups/queries/lookups.queries';
import { CreateDiscountDto, UpdateDiscountDto, ValidateCouponDto } from './dto/discounts.dto';

@Injectable()
export class DiscountsService {
  constructor(
    private readonly discountsQueries: DiscountsQueries,
    private readonly lookupsQueries: LookupsQueries,
  ) {}

  async getAllDiscounts(includeInactive = false): Promise<DbDiscount[]> {
    return this.discountsQueries.findDiscounts(includeInactive);
  }

  async getDiscountById(id: string): Promise<DbDiscount> {
    const discount = await this.discountsQueries.findDiscountById(id);
    if (!discount) throw new NotFoundException('Discount coupon not found');
    return discount;
  }

  async createDiscount(dto: CreateDiscountDto): Promise<DbDiscount> {
    const existing = await this.discountsQueries.findDiscountByCode(dto.code);
    if (existing) {
      throw new BadRequestException(`Discount coupon with code ${dto.code} already exists`);
    }

    // Resolve discount type lookup id
    const typeValue = await this.lookupsQueries.findValueByCode('discount_type', dto.discountTypeCode);
    if (!typeValue) {
      throw new BadRequestException(`Discount type ${dto.discountTypeCode} does not exist`);
    }

    return this.discountsQueries.createDiscount({
      code: dto.code,
      name: dto.name,
      discountTypeId: typeValue.id,
      value: dto.value,
      maxDiscountAmount: dto.maxDiscountAmount,
      minOrderAmount: dto.minOrderAmount,
      usageLimit: dto.usageLimit,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
    });
  }

  async updateDiscount(id: string, dto: UpdateDiscountDto): Promise<DbDiscount> {
    await this.getDiscountById(id);
    return this.discountsQueries.updateDiscount(id, dto);
  }

  async deleteDiscount(id: string): Promise<void> {
    await this.getDiscountById(id);
    await this.discountsQueries.deleteDiscount(id);
  }

  async validateCoupon(dto: ValidateCouponDto): Promise<any> {
    const discount = await this.discountsQueries.findDiscountByCode(dto.code);
    if (!discount) {
      throw new BadRequestException('Invalid coupon code');
    }

    if (!discount.is_active) {
      throw new BadRequestException('This coupon code is inactive');
    }

    // Date range check
    const now = new Date();
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      throw new BadRequestException('This coupon is not active yet');
    }
    if (discount.ends_at && new Date(discount.ends_at) < now) {
      throw new BadRequestException('This coupon has expired');
    }

    // Usage limits check
    if (discount.usage_limit !== null && discount.used_count >= discount.usage_limit) {
      throw new BadRequestException('This coupon usage limit has been reached');
    }

    // Min order amount check
    if (discount.min_order_amount !== null && dto.orderAmount < discount.min_order_amount) {
      throw new BadRequestException(`Minimum order value of PKR ${discount.min_order_amount} required to use this coupon`);
    }

    // Resolve discount type
    const typeVal = await this.lookupsQueries.findValueById(discount.discount_type_id);
    const typeCode = typeVal ? typeVal.code : 'fixed';

    let discountAmount = 0;
    if (typeCode === 'percentage') {
      discountAmount = (discount.value / 100) * dto.orderAmount;
      if (discount.max_discount_amount !== null) {
        discountAmount = Math.min(discountAmount, discount.max_discount_amount);
      }
    } else {
      discountAmount = discount.value;
    }

    return {
      couponId: discount.id,
      code: discount.code,
      name: discount.name,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      type: typeCode,
    };
  }

  async incrementCouponUsage(id: string): Promise<void> {
    await this.discountsQueries.incrementUsedCount(id);
  }
}
