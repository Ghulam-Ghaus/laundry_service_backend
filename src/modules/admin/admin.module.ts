import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminQueries } from './queries/admin.queries';
import { LookupsModule } from '../lookups/lookups.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    LookupsModule,
    OrdersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminQueries],
  exports: [AdminService, AdminQueries],
})
export class AdminModule {}
