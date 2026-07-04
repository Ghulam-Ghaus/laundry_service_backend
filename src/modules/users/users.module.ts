import { Module } from '@nestjs/common';
import { UsersController, AdminUsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersQueries } from './queries/users.queries';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [RbacModule],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, UsersQueries],
  exports: [UsersService, UsersQueries],
})
export class UsersModule {}
