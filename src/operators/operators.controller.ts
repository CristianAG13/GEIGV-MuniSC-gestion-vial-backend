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
  HttpStatus
} from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('operators')
@UseGuards(JwtAuthGuard)
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createOperatorDto: CreateOperatorDto) {
    return this.operatorsService.create(createOperatorDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'operator')
  findAll() {
    return this.operatorsService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'operator')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.operatorsService.findOne(id);
  }

  @Get(':id/with-user-details')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'operator')
  getOperatorWithUserDetails(@Param('id', ParseIntPipe) id: number) {
    return this.operatorsService.getOperatorWithUserDetails(id);
  }

  @Get('by-identification/:identification')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin', 'operator')
  findByIdentification(@Param('identification') identification: string) {
    return this.operatorsService.findByIdentification(identification);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOperatorDto: UpdateOperatorDto,
  ) {
    return this.operatorsService.update(id, updateOperatorDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.operatorsService.remove(id);
  }

  @Patch(':id/associate-user/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  associateWithUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.operatorsService.associateWithUser(id, userId);
  }

  @Patch(':id/remove-user-association')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  removeUserAssociation(@Param('id', ParseIntPipe) id: number) {
    return this.operatorsService.removeUserAssociation(id);
  }

  @Get(':id/reports')
@UseGuards(RolesGuard)
@Roles('admin', 'superadmin')
getReports(@Param('id', ParseIntPipe) id: number) {
  return this.operatorsService.getReportsByOperator(id);
}

}
