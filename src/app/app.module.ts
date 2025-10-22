import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitializationService } from './initialization.service';
import { SystemController } from './system.controller';
import { Role } from '../roles/entities/role.entity';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    RolesModule,
  ],
  providers: [InitializationService],
  controllers: [SystemController],
  exports: [InitializationService],
})
export class SystemModule {}