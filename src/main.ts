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

  // Configurar CORS
  const corsOptions = {
    origin: function (origin, callback) {
      // Permitir requests sin origin (como Postman)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://geigv-munisc-frontend.vercel.app',
        'https://geigv-muni-sc-frontend.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173'
      ].filter(Boolean);

      // Permitir cualquier subdominio de vercel.app
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // Permitir cualquier subdominio de railway.app o up.railway.app
      if (origin.endsWith('.railway.app') || origin.endsWith('.up.railway.app')) {
        return callback(null, true);
      }

      // Verificar si el origin está en la lista permitida
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(`❌ CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'x-audit-source'],
    optionsSuccessStatus: 200,
  };

  app.enableCors(corsOptions);

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
