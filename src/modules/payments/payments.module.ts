import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsQueries } from './queries/payments.queries';
import { OrdersModule } from '../orders/orders.module';
import { LookupsModule } from '../lookups/lookups.module';

@Module({
  imports: [
    OrdersModule,
    LookupsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsQueries],
  exports: [PaymentsService, PaymentsQueries],
})
export class PaymentsModule {}
