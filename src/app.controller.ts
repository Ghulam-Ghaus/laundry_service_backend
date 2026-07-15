import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { CatalogService } from './modules/catalog/catalog.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly catalogService: CatalogService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('service-categories')
  async getServiceCategories() {
    return this.catalogService.getCategories(false);
  }
}
