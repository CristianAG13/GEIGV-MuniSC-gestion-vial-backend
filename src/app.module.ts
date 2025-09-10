// src/app.module.ts
import { Module, ClassSerializerInterceptor } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';            // ✅ IMPORTA ESTO
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Módulos
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { RoleRequestsModule } from './role-requests/role-requests.module';
import { OperatorsModule } from './operators/operators.module';
import { MachineryModule } from './machinery/machinery.module';

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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mariadb',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [User, Role, Permission, RoleRequest, Operator, Report, Machinery, MaterialReport, RentalReport, MachineryRole],
        synchronize: config.get('DB_SYNC') === 'true', // Ahora está configurado a true en .env
        logging: true,
        timezone: 'Z',
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
      }),
    }),

    RolesModule,
    UsersModule,
    AuthModule,
    RoleRequestsModule,
    OperatorsModule,
    MachineryModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,               // ✅ ahora sí existe
      useClass: ClassSerializerInterceptor,   // y se importa de @nestjs/common
    },
  ],
})
export class AppModule {}
