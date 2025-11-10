// src/app.module.ts
import { Module, ClassSerializerInterceptor } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';            // ✅ IMPORTA ESTO
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { URL } from 'url';

// Módulos
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { RoleRequestsModule } from './role-requests/role-requests.module';
import { OperatorsModule } from './operators/operators.module';
import { MachineryModule } from './machinery/machinery.module';
import { AuditModule } from './audit/audit.module';
import { CatalogModule } from './catalog/catalog.module';
import { SystemModule } from './app/app.module';
// Entidades
import { User } from './users/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import { Permission } from './roles/entities/permission.entity';
import { RoleRequest } from './role-requests/entities/role-request.entity';
import { Operator } from './operators/entities/operator.entity';
import { Machinery } from './machinery/entities/machinery.entity';
import { MaterialReport } from './machinery/entities/material-report.entity';
import { RentalReport } from './machinery/entities/rental-report.entity';
import { Report } from './machinery/entities/report.entity';
import { MachineryRole } from './machinery/entities/machinery-role.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { Source } from './catalog/entities/source.entity';
import { Trailer } from './catalog/entities/trailer.entity';

// Helper function para configuración de base de datos
function getDatabaseConfig(config: ConfigService) {
  // Prioridad 1: Si existe MARIADB_PRIVATE_URL (Railway), úsala
  const privateUrl = config.get<string>('MARIADB_PRIVATE_URL');
  if (privateUrl) {
    try {
      const url = new URL(privateUrl);
      return {
        type: 'mariadb' as const,
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        username: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
      };
    } catch (error) {
      console.warn('Error parsing MARIADB_PRIVATE_URL:', error);
      // Fall through to other options
    }
  }

  // Prioridad 2: Variables individuales de Railway (MARIADB_*)
  const mariadbHost = config.get<string>('MARIADB_HOST');
  const mariadbPrivateHost = config.get<string>('MARIADB_PRIVATE_HOST');
  if (mariadbHost || mariadbPrivateHost) {
    return {
      type: 'mariadb' as const,
      host: mariadbPrivateHost || mariadbHost || 'mariadb.railway.internal',
      port: parseInt(config.get<string>('MARIADB_PORT') || '3306'),
      username: config.get<string>('MARIADB_USER') || config.get<string>('MARIADB_USERNAME') || 'railway',
      password: config.get<string>('MARIADB_PASSWORD') || config.get<string>('MARIADB_ROOT_PASSWORD'),
      database: config.get<string>('MARIADB_DATABASE') || 'railway',
    };
  }

  // Prioridad 3: Variables tradicionales (DB_*)
  return {
    type: 'mariadb' as const,
    host: config.get<string>('DB_HOST') || 'localhost',
    port: parseInt(config.get<string>('DB_PORT') || '3306'),
    username: config.get<string>('DB_USERNAME') || 'root',
    password: config.get<string>('DB_PASSWORD') || '',
    database: config.get<string>('DB_DATABASE') || 'test',
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbConfig = getDatabaseConfig(config);
        
        console.log('Database configuration:', {
          ...dbConfig,
          password: dbConfig.password ? '[HIDDEN]' : 'NOT_SET'
        });

        return {
          ...dbConfig,
          entities: [User, Role, Permission, RoleRequest, Operator, Report, Machinery, MaterialReport, RentalReport, MachineryRole, AuditLog, Source, Trailer],
          synchronize: config.get('DB_SYNC') === 'true' || config.get('NODE_ENV') !== 'production',
          dropSchema: false, // Cambiar a true temporalmente para recrear todas las tablas
          logging: config.get('NODE_ENV') !== 'production',

          // ✅ Para evitar desfases de fecha/hora
          timezone: 'Z',          // o '+00:00'
          // Opcional: si quieres que los DATE salgan como string "YYYY-MM-DD"
          // (útil para no convertir a Date en JS)
          dateStrings: true,

          charset: 'utf8mb4',
          collation: 'utf8mb4_unicode_ci',

          // ✅ Solo opciones válidas para mysql2
          extra: {
            connectionLimit: 10,
            connectTimeout: 30000, // en ms
            // (no uses acquireTimeout, timeout ni initSql)
          },
        };
      },
    }),
    CatalogModule,
    RolesModule,
    UsersModule,
    AuthModule,
    RoleRequestsModule,
    OperatorsModule,
    MachineryModule,
    AuditModule,
    SystemModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,               // ✅ ahora sí existe
      useClass: ClassSerializerInterceptor,   // y se importa de @nestjs/common
    },
  ],
})
export class AppModule {}
