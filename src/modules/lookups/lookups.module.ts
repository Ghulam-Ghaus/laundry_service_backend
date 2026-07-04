import { Module } from '@nestjs/common';
import { LookupsController } from './lookups.controller';
import { LookupsService } from './lookups.service';
import { LookupsQueries } from './queries/lookups.queries';

@Module({
  controllers: [LookupsController],
  providers: [LookupsService, LookupsQueries],
  exports: [LookupsService, LookupsQueries],
})
export class LookupsModule {}
