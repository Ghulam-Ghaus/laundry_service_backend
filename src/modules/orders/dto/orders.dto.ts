import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  areaId!: string;

  @IsString()
  @IsOptional()
  addressTypeId?: string;

  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsOptional()
  instructions?: string;
}

export class OrderItemInputDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsString()
  @IsNotEmpty()
  serviceOptionId!: string;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;
}

export class ScheduleDto {
  @IsString()
  @IsNotEmpty()
  pickupDate!: string; // Format 'YYYY-MM-DD'

  @IsString()
  @IsNotEmpty()
  pickupSlotId!: string;

  @IsString()
  @IsNotEmpty()
  deliveryDate!: string; // Format 'YYYY-MM-DD'

  @IsString()
  @IsNotEmpty()
  deliverySlotId!: string;

  @IsString()
  @IsOptional()
  frequencyId?: string;
}

export class ContactDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address!: AddressDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  @IsOptional()
  items?: OrderItemInputDto[];

  @ValidateNested()
  @Type(() => ScheduleDto)
  @IsNotEmpty()
  schedule!: ScheduleDto;

  @ValidateNested()
  @Type(() => ContactDto)
  @IsOptional()
  contact?: ContactDto; // Optional if user is logged in, required if guest

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @IsBoolean()
  @IsNotEmpty()
  isItemSelectionSkipped!: boolean;

  @IsBoolean()
  @IsNotEmpty()
  acceptedTerms!: boolean;
}

export class CreateDraftOrderDto {
  @Transform(({ value, obj }) => obj.customer_name ?? value)
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @Transform(({ value, obj }) => obj.phone ?? value)
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @Transform(({ value, obj }) => obj.order_date ?? value)
  @IsString()
  @IsNotEmpty()
  orderDate!: string;

  @Transform(({ value, obj }) => obj.delivery_date ?? value)
  @IsString()
  @IsNotEmpty()
  deliveryDate!: string;

  @Transform(({ value, obj }) => obj.category_id ?? value)
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  @IsOptional()
  items?: OrderItemInputDto[];

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  grandTotal?: number;
}

export class OrderQuoteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  @IsOptional()
  items?: OrderItemInputDto[];

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsBoolean()
  @IsOptional()
  isItemSelectionSkipped?: boolean;
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  statusCode!: string; // e.g. 'confirmed', 'cleaning', 'completed'

  @IsString()
  @IsOptional()
  note?: string;
}

export class AssignStaffDto {
  @IsString()
  @IsNotEmpty()
  staffUserId!: string;

  @IsString()
  @IsNotEmpty()
  taskTypeCode!: string; // 'pickup', 'delivery', etc.
}
