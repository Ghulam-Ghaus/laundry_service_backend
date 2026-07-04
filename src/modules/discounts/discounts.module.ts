import { Module } from '@nestjs/common';
import { DiscountsController, AdminDiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { DiscountsQueries } from './queries/discounts.queries';
import { LookupsModule } from '../lookups/lookups.module';

@Module({
  imports: [LookupsModule],
  controllers: [DiscountsController, AdminDiscountsController],
  providers: [DiscountsService, DiscountsQueries],
  exports: [DiscountsService, DiscountsQueries],
})
export class DiscountsModule {}
