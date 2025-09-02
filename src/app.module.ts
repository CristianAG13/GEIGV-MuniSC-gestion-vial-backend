// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';

// Módulos de la aplicación
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { RoleRequestsModule } from './role-requests/role-requests.module';
import { OperatorsModule } from './operators/operators.module';

// Entidades
import { User } from './users/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import { RoleRequest } from './role-requests/entities/role-request.entity';
import { Operator } from './operators/entities/operator.entity';
import { Machinery } from './machinery/entities/machinery.entity';
import { MaterialReport } from './machinery/entities/material-report.entity';
import { RentalReport } from './machinery/entities/rental-report.entity';
import { Report } from './machinery/entities/report.entity';
import { MachineryModule } from './machinery/machinery.module';
@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Base de datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mariadb',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Role, RoleRequest, Operator, Report, Machinery, MaterialReport, RentalReport],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: false,
        timezone: 'Z',
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
      }),
      inject: [ConfigService],
    }),

    // Módulos de funcionalidad
    RolesModule,
    UsersModule,
    AuthModule,
    RoleRequestsModule,
    OperatorsModule,
    MachineryModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}