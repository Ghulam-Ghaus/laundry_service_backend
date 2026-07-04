import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CatalogQueries, DbServiceCategory, DbCatalogItem, DbServiceOption, DbItemPrice } from './queries/catalog.queries';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateItemDto,
  UpdateItemDto,
  CreateServiceOptionDto,
  UpdateServiceOptionDto,
  CreateItemPriceDto,
} from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly catalogQueries: CatalogQueries) {}

  // --- Categories ---
  async getCategories(includeInactive = false): Promise<DbServiceCategory[]> {
    return this.catalogQueries.findCategories(includeInactive);
  }

  async getCategoryById(id: string): Promise<DbServiceCategory> {
    const category = await this.catalogQueries.findCategoryById(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async createCategory(dto: CreateCategoryDto): Promise<DbServiceCategory> {
    const existing = await this.catalogQueries.findCategoryByCode(dto.code);
    if (existing) {
      throw new BadRequestException(`Category with code ${dto.code} already exists`);
    }
    return this.catalogQueries.createCategory(dto);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<DbServiceCategory> {
    await this.getCategoryById(id);
    return this.catalogQueries.updateCategory(id, dto);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.getCategoryById(id);

    // Check for child items
    const childItems = await this.catalogQueries.findItemsByCategoryId(id, true);
    if (childItems.length > 0) {
      throw new BadRequestException('Cannot delete category because it contains items');
    }

    await this.catalogQueries.deleteCategory(id);
  }

  // --- Items ---
  async getItemsByCategory(categoryId: string, includeInactive = false): Promise<DbCatalogItem[]> {
    await this.getCategoryById(categoryId);
    return this.catalogQueries.findItemsByCategoryId(categoryId, includeInactive);
  }

  async getItemById(id: string): Promise<DbCatalogItem> {
    const item = await this.catalogQueries.findItemById(id);
    if (!item) throw new NotFoundException('Catalog item not found');
    return item;
  }

  async createItem(dto: CreateItemDto): Promise<DbCatalogItem> {
    await this.getCategoryById(dto.categoryId);

    const existing = await this.catalogQueries.findItemByCode(dto.code);
    if (existing) {
      throw new BadRequestException(`Item with code ${dto.code} already exists`);
    }

    return this.catalogQueries.createItem(dto);
  }

  async updateItem(id: string, dto: UpdateItemDto): Promise<DbCatalogItem> {
    await this.getItemById(id);
    if (dto.categoryId) {
      await this.getCategoryById(dto.categoryId);
    }
    return this.catalogQueries.updateItem(id, dto);
  }

  async deleteItem(id: string): Promise<void> {
    await this.getItemById(id);
    await this.catalogQueries.deleteItem(id);
  }

  async searchItems(q: string): Promise<DbCatalogItem[]> {
    if (!q) return [];
    return this.catalogQueries.searchItems(q);
  }

  // --- Service Options ---
  async getServiceOptions(): Promise<DbServiceOption[]> {
    return this.catalogQueries.findServiceOptions();
  }

  async getServiceOptionById(id: string): Promise<DbServiceOption> {
    const option = await this.catalogQueries.findServiceOptionById(id);
    if (!option) throw new NotFoundException('Service option not found');
    return option;
  }

  async createServiceOption(dto: CreateServiceOptionDto): Promise<DbServiceOption> {
    return this.catalogQueries.createServiceOption(dto);
  }

  async updateServiceOption(id: string, dto: UpdateServiceOptionDto): Promise<DbServiceOption> {
    await this.getServiceOptionById(id);
    return this.catalogQueries.updateServiceOption(id, dto);
  }

  async deleteServiceOption(id: string): Promise<void> {
    await this.getServiceOptionById(id);
    await this.catalogQueries.deleteServiceOption(id);
  }

  // --- Pricing ---
  async getItemPrices(itemIds: string[]): Promise<DbItemPrice[]> {
    return this.catalogQueries.findPricesForItems(itemIds);
  }

  async createItemPrice(dto: CreateItemPriceDto): Promise<DbItemPrice> {
    // 1. Verify item and option exist
    await this.getItemById(dto.itemId);
    await this.getServiceOptionById(dto.serviceOptionId);

    // Parse money values cleanly
    const priceVal = parseFloat(dto.price);
    if (isNaN(priceVal) || priceVal < 0) {
      throw new BadRequestException('Price must be a valid positive decimal value');
    }

    const compareAtVal = dto.compareAtPrice ? parseFloat(dto.compareAtPrice) : undefined;
    if (compareAtVal !== undefined && (isNaN(compareAtVal) || compareAtVal < 0)) {
      throw new BadRequestException('Compare at price must be a valid positive decimal value');
    }

    // 2. Resolve times and close active overlapping prices
    const now = new Date();
    const effectiveFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : now;
    const effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : undefined;

    // Close any currently active price on conflict
    await this.catalogQueries.closeActivePrice(dto.itemId, dto.serviceOptionId, effectiveFrom);

    // 3. Create the new price record
    return this.catalogQueries.createPrice({
      itemId: dto.itemId,
      serviceOptionId: dto.serviceOptionId,
      currencyCode: dto.currencyCode || 'PKR',
      price: priceVal,
      compareAtPrice: compareAtVal,
      effectiveFrom,
      effectiveTo,
    });
  }

  async getPriceHistory(itemId: string, serviceOptionId: string): Promise<DbItemPrice[]> {
    await this.getItemById(itemId);
    await this.getServiceOptionById(serviceOptionId);
    return this.catalogQueries.findPriceHistory(itemId, serviceOptionId);
  }

  async deletePrice(id: string): Promise<void> {
    await this.catalogQueries.deletePrice(id);
  }

  // --- Composite Public Endpoints ---
  async getFullCatalog() {
    const categories = await this.getCategories();
    const result = [];

    for (const cat of categories) {
      const items = await this.getItemsByCategory(cat.id);
      const itemIds = items.map((i) => i.id);
      const prices = await this.getItemPrices(itemIds);

      // Attach prices to items
      const itemsWithPrices = items.map((item) => {
        const itemPrices = prices.filter((p) => p.item_id === item.id);
        return {
          ...item,
          prices: itemPrices,
        };
      });

      result.push({
        ...cat,
        items: itemsWithPrices,
      });
    }

    return result;
  }
}
