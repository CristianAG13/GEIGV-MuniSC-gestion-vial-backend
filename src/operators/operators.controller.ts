import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditInterceptor, Audit } from '../audit/interceptors/audit.interceptor';
import { AuditAction, AuditEntity } from '../audit/entities/audit-log.entity';

@Controller('operators')
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuditInterceptor)
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @HttpCode(HttpStatus.CREATED)
  @Audit(AuditEntity.OPERADORES, AuditAction.CREATE) // Sin descripción estática para usar la generada automáticamente
  create(@Body() createOperatorDto: CreateOperatorDto) {
    return this.operatorsService.create(createOperatorDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'ingeniero', 'inspector', 'operario')
  findAll() {
    return this.operatorsService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'ingeniero', 'inspector', 'operario')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.operatorsService.findOne(id);
  }

  @Get(':id/with-user-details')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'ingeniero', 'inspector', 'operario')
  getOperatorWithUserDetails(@Param('id', ParseIntPipe) id: number) {
    return this.operatorsService.getOperatorWithUserDetails(id);
  }

  @Get('by-identification/:identification')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'ingeniero', 'inspector', 'operario')
  findByIdentification(@Param('identification') identification: string) {
    return this.operatorsService.findByIdentification(identification);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'ingeniero')
  @Audit(AuditEntity.OPERADORES, AuditAction.UPDATE) // Sin descripción estática para usar la generada automáticamente
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOperatorDto: UpdateOperatorDto,
  ) {
    return this.operatorsService.update(id, updateOperatorDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('superadmin', 'ingeniero')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit(AuditEntity.OPERADORES, AuditAction.DELETE) // Sin descripción estática para usar la generada automáticamente
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.operatorsService.remove(id);
  }

  @Patch(':id/associate-user/:userId')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @Audit(AuditEntity.OPERADORES, AuditAction.UPDATE) // Sin descripción estática para usar la generada automáticamente
  associateWithUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.operatorsService.associateWithUser(id, userId);
  }

  @Patch(':id/remove-user-association')
  @UseGuards(RolesGuard)
  @Roles('superadmin')
  @Audit(AuditEntity.OPERADORES, AuditAction.UPDATE) // Sin descripción estática para usar la generada automáticamente
  removeUserAssociation(@Param('id', ParseIntPipe) id: number) {
    return this.operatorsService.removeUserAssociation(id);
  }

  @Get(':id/reports')
@UseGuards(RolesGuard)
@Roles('superadmin')
getReports(@Param('id', ParseIntPipe) id: number) {
  return this.operatorsService.getReportsByOperator(id);
}

}
