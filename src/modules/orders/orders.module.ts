import { Module } from '@nestjs/common';
import { OrdersController, AdminOrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersQueries } from './queries/orders.queries';
import { CatalogModule } from '../catalog/catalog.module';
import { LookupsModule } from '../lookups/lookups.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    CatalogModule,
    LookupsModule,
    UsersModule,
    AuthModule, // Imports JwtModule to allow token parsing in controller
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, OrdersQueries],
  exports: [OrdersService, OrdersQueries],
})
export class OrdersModule {}
