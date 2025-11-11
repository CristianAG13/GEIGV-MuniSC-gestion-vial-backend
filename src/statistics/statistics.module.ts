import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

// Entidades
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Operator } from '../operators/entities/operator.entity';
import { Machinery } from '../machinery/entities/machinery.entity';
import { Report } from '../machinery/entities/report.entity';
import { RentalReport } from '../machinery/entities/rental-report.entity';
import { MaterialReport } from '../machinery/entities/material-report.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

// Módulos de servicios existentes
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { OperatorsModule } from '../operators/operators.module';
import { MachineryModule } from '../machinery/machinery.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Operator,
      Machinery,
      Report,
      RentalReport,
      MaterialReport,
      AuditLog,
    ]),
    UsersModule,
    RolesModule,
    OperatorsModule,
    MachineryModule,
    AuditModule,
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}