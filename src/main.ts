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
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no permitidas
      transform: true, // Transforma automáticamente los tipos
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configurar CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL ,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Prefijo global para las APIs
  app.setGlobalPrefix('api/v1');

  // Obtener configuración
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');

  await app.listen(port);
  
  console.log(`🚀 Aplicación corriendo en: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ Error al iniciar la aplicación:', error);
  process.exit(1);
});
