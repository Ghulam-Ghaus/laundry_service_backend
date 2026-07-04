import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateItemDto,
  UpdateItemDto,
  CreateServiceOptionDto,
  UpdateServiceOptionDto,
  CreateItemPriceDto,
} from './dto/catalog.dto';

@ApiTags('Public Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all active service categories' })
  async getCategories() {
    return this.catalogService.getCategories(false);
  }

  @Public()
  @Get('categories/:id/items')
  @ApiOperation({ summary: 'Get active items by category ID' })
  async getCategoryItems(@Param('id') id: string) {
    return this.catalogService.getItemsByCategory(id, false);
  }

  @Public()
  @Get('items/search')
  @ApiOperation({ summary: 'Search active catalog items' })
  async searchItems(@Query('q') q: string) {
    return this.catalogService.searchItems(q);
  }

  @Public()
  @Get('full')
  @ApiOperation({ summary: 'Get full catalog with items and current prices' })
  async getFullCatalog() {
    return this.catalogService.getFullCatalog();
  }
}

@ApiTags('Admin Catalog')
@ApiBearerAuth()
@Controller('admin/catalog')
export class AdminCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // --- Categories ---
  @Get('categories')
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'Get all categories including inactive (Admin)' })
  async getCategories() {
    return this.catalogService.getCategories(true);
  }

  @Post('categories')
  @RequirePermissions('catalog.create')
  @ApiOperation({ summary: 'Create service category (Admin)' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Patch('categories/:id')
  @RequirePermissions('catalog.update')
  @ApiOperation({ summary: 'Update service category (Admin)' })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalogService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @RequirePermissions('catalog.delete')
  @ApiOperation({ summary: 'Soft delete service category (Admin)' })
  async deleteCategory(@Param('id') id: string) {
    await this.catalogService.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }

  // --- Items ---
  @Get('categories/:categoryId/items')
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'Get all items including inactive for category (Admin)' })
  async getCategoryItems(@Param('categoryId') categoryId: string) {
    return this.catalogService.getItemsByCategory(categoryId, true);
  }

  @Post('items')
  @RequirePermissions('catalog.create')
  @ApiOperation({ summary: 'Create catalog item (Admin)' })
  async createItem(@Body() dto: CreateItemDto) {
    return this.catalogService.createItem(dto);
  }

  @Patch('items/:id')
  @RequirePermissions('catalog.update')
  @ApiOperation({ summary: 'Update catalog item (Admin)' })
  async updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.catalogService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @RequirePermissions('catalog.delete')
  @ApiOperation({ summary: 'Soft delete catalog item (Admin)' })
  async deleteItem(@Param('id') id: string) {
    await this.catalogService.deleteItem(id);
    return { message: 'Item deleted successfully' };
  }

  // --- Service Options ---
  @Get('service-options')
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'Get all service options (Admin)' })
  async getServiceOptions() {
    return this.catalogService.getServiceOptions();
  }

  @Post('service-options')
  @RequirePermissions('catalog.create')
  @ApiOperation({ summary: 'Create service option (Admin)' })
  async createServiceOption(@Body() dto: CreateServiceOptionDto) {
    return this.catalogService.createServiceOption(dto);
  }

  @Patch('service-options/:id')
  @RequirePermissions('catalog.update')
  @ApiOperation({ summary: 'Update service option (Admin)' })
  async updateServiceOption(@Param('id') id: string, @Body() dto: UpdateServiceOptionDto) {
    return this.catalogService.updateServiceOption(id, dto);
  }

  @Delete('service-options/:id')
  @RequirePermissions('catalog.delete')
  @ApiOperation({ summary: 'Soft delete service option (Admin)' })
  async deleteServiceOption(@Param('id') id: string) {
    await this.catalogService.deleteServiceOption(id);
    return { message: 'Service option deleted successfully' };
  }

  // --- Prices ---
  @Post('prices')
  @RequirePermissions('catalog.create')
  @ApiOperation({ summary: 'Create or update price for item (Admin)' })
  async createItemPrice(@Body() dto: CreateItemPriceDto) {
    return this.catalogService.createItemPrice(dto);
  }

  @Get('prices/history')
  @RequirePermissions('catalog.read')
  @ApiOperation({ summary: 'Get price history for item + option (Admin)' })
  async getPriceHistory(@Query('itemId') itemId: string, @Query('serviceOptionId') serviceOptionId: string) {
    return this.catalogService.getPriceHistory(itemId, serviceOptionId);
  }

  @Delete('prices/:id')
  @RequirePermissions('catalog.delete')
  @ApiOperation({ summary: 'Archive price record (Admin)' })
  async deletePrice(@Param('id') id: string) {
    await this.catalogService.deletePrice(id);
    return { message: 'Price record archived successfully' };
  }
}
