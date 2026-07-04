import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSlotDto {
  @IsString()
  @IsNotEmpty()
  slotTypeId!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsString()
  @IsNotEmpty()
  startTime!: string; // Format 'HH:MM:SS'

  @IsString()
  @IsNotEmpty()
  endTime!: string; // Format 'HH:MM:SS'

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateSlotDto {
  @IsString()
  @IsOptional()
  slotTypeId?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class LinkAreaSlotDto {
  @IsString()
  @IsNotEmpty()
  areaId!: string;

  @IsString()
  @IsNotEmpty()
  slotId!: string;

  @IsNumber()
  @IsNotEmpty()
  dayOfWeek!: number; // 0 to 6

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsNumber()
  @IsOptional()
  capacityOverride?: number;
}
