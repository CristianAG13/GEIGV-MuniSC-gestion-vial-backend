import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog } from './entities/audit-log.entity';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { CleanQueryParamsInterceptor } from './interceptors/clean-query-params.interceptor';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService, SuperAdminGuard, CleanQueryParamsInterceptor],
  exports: [AuditService],
})
export class AuditModule {}