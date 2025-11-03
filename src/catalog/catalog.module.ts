import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Source } from './entities/source.entity';           // ya existía
import { Trailer } from './entities/trailer.entity';         // NUEVO

import { CatalogController } from './catalog.controller';    // tu controller de sources (si existe)
import { CatalogService } from './catalog.service';          // tu service de sources (si existe)

import { TrailersController } from './trailers.controller';  // NUEVO
import { TrailersService } from './trailers.service';        // NUEVO

@Module({
  imports: [TypeOrmModule.forFeature([Source, Trailer])],
  controllers: [
    CatalogController,      // (sources)
    TrailersController,     // (carretas)
  ],
  providers: [
    CatalogService,         // (sources)
    TrailersService,        // (carretas)
  ],
  exports: [TypeOrmModule],
})
export class CatalogModule {}
