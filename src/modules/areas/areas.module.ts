import { Module } from '@nestjs/common';
import { AreasController, AdminAreasController } from './areas.controller';
import { AreasService } from './areas.service';
import { AreasQueries } from './queries/areas.queries';

@Module({
  controllers: [AreasController, AdminAreasController],
  providers: [AreasService, AreasQueries],
  exports: [AreasService, AreasQueries],
})
export class AreasModule {}
