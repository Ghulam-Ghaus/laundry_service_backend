import { Module } from '@nestjs/common';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';
import { RbacQueries } from './queries/rbac.queries';

@Module({
  controllers: [RbacController],
  providers: [RbacService, RbacQueries],
  exports: [RbacService, RbacQueries],
})
export class RbacModule {}
