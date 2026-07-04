import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AreasQueries, DbServiceArea } from './queries/areas.queries';
import { CreateAreaDto, UpdateAreaDto } from './dto/areas.dto';

@Injectable()
export class AreasService {
  constructor(private readonly areasQueries: AreasQueries) {}

  async getAreas(includeNonServiceable = false): Promise<DbServiceArea[]> {
    return this.areasQueries.findAreas(includeNonServiceable);
  }

  async getAreaById(id: string): Promise<DbServiceArea> {
    const area = await this.areasQueries.findAreaById(id);
    if (!area) throw new NotFoundException('Service area not found');
    return area;
  }

  async searchAreas(q: string): Promise<DbServiceArea[]> {
    if (!q) return this.getAreas(false);
    return this.areasQueries.searchAreas(q);
  }

  async createArea(dto: CreateAreaDto): Promise<DbServiceArea> {
    const existing = await this.areasQueries.findAreaByCode(dto.code);
    if (existing) {
      throw new BadRequestException(`Service area with code ${dto.code} already exists`);
    }
    return this.areasQueries.createArea(dto);
  }

  async updateArea(id: string, dto: UpdateAreaDto): Promise<DbServiceArea> {
    await this.getAreaById(id);
    if (dto.code) {
      const existing = await this.areasQueries.findAreaByCode(dto.code);
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Service area with code ${dto.code} already exists`);
      }
    }
    return this.areasQueries.updateArea(id, dto);
  }

  async deleteArea(id: string): Promise<void> {
    await this.getAreaById(id);
    await this.areasQueries.deleteArea(id);
  }
}
