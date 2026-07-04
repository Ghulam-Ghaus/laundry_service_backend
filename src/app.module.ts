import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import appConfig from './config/app.config';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { LookupsModule } from './modules/lookups/lookups.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { AreasModule } from './modules/areas/areas.module';
import { SlotsModule } from './modules/slots/slots.module';
import { OrdersModule } from './modules/orders/orders.module';
import { StaffModule } from './modules/staff/staff.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { LanguageMiddleware } from './common/middleware/language.middleware';
import { GlobalResponseInterceptor } from './common/interceptors/global-response.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AuthGuard } from './common/guards/auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate,
    }),
    DatabaseModule,
    LookupsModule,
    RbacModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    AreasModule,
    SlotsModule,
    OrdersModule,
    StaffModule,
    DiscountsModule,
    PaymentsModule,
    NotificationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Register global response interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalResponseInterceptor,
    },
    // Register global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Register global Auth Guard (fail-secure, use @Public() to bypass)
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // Register global Permission Guard
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware, LanguageMiddleware)
      .forRoutes('*');
  }
}
