import { Module } from '@nestjs/common';
import { SlotsController, AdminSlotsController } from './slots.controller';
import { SlotsService } from './slots.service';
import { SlotsQueries } from './queries/slots.queries';

@Module({
  controllers: [SlotsController, AdminSlotsController],
  providers: [SlotsService, SlotsQueries],
  exports: [SlotsService, SlotsQueries],
})
export class SlotsModule {}
