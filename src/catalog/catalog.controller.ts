// src/catalog/catalog.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Query, Param, ParseIntPipe } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';

@Controller('catalog/sources') 
export class CatalogController {
  constructor(private service: CatalogService) {}

  @Get()
  async list(
    @Query('tipo') tipo?: 'rio'|'tajo',
    @Query('q') q?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const [items, total] = await this.service.list({
      tipo,
      q,
      skip: Number(skip ?? 0),
      take: Math.min(Number(take ?? 20), 100),
    });
    return { items, total };
  }

  @Post()
  create(@Body() dto: CreateSourceDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSourceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
