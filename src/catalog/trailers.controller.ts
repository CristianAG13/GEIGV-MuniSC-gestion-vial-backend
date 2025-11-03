import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { TrailersService } from './trailers.service';
import { CreateTrailerDto } from './dto/create-trailer.dto';
import { UpdateTrailerDto } from './dto/update-trailer.dto';

@Controller('catalog/carretas')
export class TrailersController {
  constructor(private readonly service: TrailersService) {}

  @Get()
  list(
    @Query('tipoMaquinaria') tipoMaquinaria?: 'vagoneta'|'cabezal',
    @Query('categoria') categoria?: 'carreta'|'material',
    @Query('materialTipo') materialTipo?: 'desecho'|'plataforma',
    @Query('q') q?: string,
    @Query('skip') skip = '0',
    @Query('take') take = '50',
  ) {
    return this.service.list({
      tipoMaquinaria, categoria, materialTipo, q,
      skip: Number(skip) || 0, take: Number(take) || 50
    });
  }

  @Post()
  create(@Body() dto: CreateTrailerDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTrailerDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
