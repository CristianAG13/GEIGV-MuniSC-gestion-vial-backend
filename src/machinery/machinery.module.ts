import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MachineryController } from './machinery.controller';
import { MachineryService } from './machinery.service';
import { Machinery } from './entities/machinery.entity';
import { Report } from './entities/report.entity';
import { RentalReport } from './entities/rental-report.entity';
import { MaterialReport } from './entities/material-report.entity';
import { MachineryRole } from './entities/machinery-role.entity';
import { Operator } from 'src/operators/entities/operator.entity';
import { User } from 'src/users/entities/user.entity'; // ruta real
import { OperatorsModule } from 'src/operators/operators.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Machinery, Report, RentalReport, MaterialReport, MachineryRole, Operator, User]),
    OperatorsModule,
  ],
  controllers: [MachineryController],
  providers: [MachineryService],
})
export class MachineryModule {}
