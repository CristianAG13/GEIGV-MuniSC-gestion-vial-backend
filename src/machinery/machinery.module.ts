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

@Module({
  imports: [TypeOrmModule.forFeature([Machinery, Report, RentalReport, MaterialReport, MachineryRole, Operator,])],
  controllers: [MachineryController],
  providers: [MachineryService],
})
export class MachineryModule {}
