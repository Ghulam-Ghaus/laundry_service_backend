import { Module } from '@nestjs/common';
import { CatalogController, AdminCatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogQueries } from './queries/catalog.queries';

@Module({
  controllers: [CatalogController, AdminCatalogController],
  providers: [CatalogService, CatalogQueries],
  exports: [CatalogService, CatalogQueries],
})
export class CatalogModule {}
