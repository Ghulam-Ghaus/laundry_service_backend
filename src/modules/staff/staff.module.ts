import { Module } from '@nestjs/common';
import { StaffController, AdminStaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffQueries } from './queries/staff.queries';
import { OrdersModule } from '../orders/orders.module';
import { LookupsModule } from '../lookups/lookups.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    OrdersModule,
    LookupsModule,
    UsersModule,
  ],
  controllers: [StaffController, AdminStaffController],
  providers: [StaffService, StaffQueries],
  exports: [StaffService, StaffQueries],
})
export class StaffModule {}
