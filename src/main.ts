import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades que no están en el DTO
      forbidNonWhitelisted: false, // Cambiar a false para ser más permisivo con query params
      transform: true, // Transforma automáticamente los tipos
      transformOptions: {
        enableImplicitConversion: true,
      },
      skipMissingProperties: true, // Omitir propiedades faltantes
      skipNullProperties: true, // Omitir propiedades null
      skipUndefinedProperties: true, // Omitir propiedades undefined
    }),
  );

  // Configurar CORS - Temporalmente permisivo
  app.enableCors({
    origin: true, // Permite todos los orígenes temporalmente
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Prefijo global para las APIs
  app.setGlobalPrefix('api/v1');

  // Obtener configuración
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Aplicación corriendo en: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ Error al iniciar la aplicación:', error);
  process.exit(1);
});
