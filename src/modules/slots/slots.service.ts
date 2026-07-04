import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SlotsQueries, DbTimeSlot, DbAreaSlotAvailability } from './queries/slots.queries';
import { CreateSlotDto, UpdateSlotDto, LinkAreaSlotDto } from './dto/slots.dto';

@Injectable()
export class SlotsService {
  constructor(private readonly slotsQueries: SlotsQueries) {}

  async getAllSlots(): Promise<DbTimeSlot[]> {
    return this.slotsQueries.findAllSlots();
  }

  async getSlotById(id: string): Promise<DbTimeSlot> {
    const slot = await this.slotsQueries.findSlotById(id);
    if (!slot) throw new NotFoundException('Time slot not found');
    return slot;
  }

  async getAvailableSlots(areaId: string, dateStr: string, slotTypeCode: string): Promise<any[]> {
    if (!areaId || !dateStr || !slotTypeCode) {
      throw new BadRequestException('Parameters areaId, date, and type are required');
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    // day of week is 0 (Sunday) to 6 (Saturday)
    const dayOfWeek = date.getDay();

    return this.slotsQueries.getAvailableSlotsByAreaAndDay(areaId, dayOfWeek, slotTypeCode);
  }

  async createSlot(dto: CreateSlotDto): Promise<DbTimeSlot> {
    return this.slotsQueries.createSlot(dto);
  }

  async updateSlot(id: string, dto: UpdateSlotDto): Promise<DbTimeSlot> {
    await this.getSlotById(id);
    return this.slotsQueries.updateSlot(id, dto);
  }

  async deleteSlot(id: string): Promise<void> {
    await this.getSlotById(id);
    await this.slotsQueries.deleteSlot(id);
  }

  async linkAreaSlot(dto: LinkAreaSlotDto): Promise<DbAreaSlotAvailability> {
    if (dto.dayOfWeek < 0 || dto.dayOfWeek > 6) {
      throw new BadRequestException('dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
    }
    await this.getSlotById(dto.slotId);
    return this.slotsQueries.linkAreaSlot(dto);
  }
}
