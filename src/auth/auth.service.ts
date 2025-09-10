import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private moduleRef: ModuleRef,
    private usersService: UsersService,
  ) {
    // Configurar el transporter de Gmail con opciones adicionales
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false
      },
    } as any);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, name, lastname, password } = registerDto;

    console.log(`📝 Intentando registrar usuario: ${email}`);

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      console.log(`⚠️ Usuario ya existe: ${email}`);
      throw new ConflictException('El usuario ya existe');
    }
    
    console.log(`💾 Creando usuario en base de datos: ${email}`);
    
    // Contar usuarios para mostrar mensajes más descriptivos
    const userCount = await this.userRepository.count();
    const isFirstUser = userCount === 0;
    
    const createUserDto = {
      email,
      password,
      name,
      lastname,
      roleIds: [] // Se asignará automáticamente según la lógica
    };
    
    // Usar el UsersService inyectado en el constructor
    // Esto aplicará la lógica de asignar superadmin al primer usuario o invitado a los demás
    const savedUser = await this.usersService.create(createUserDto);

    console.log(`🎉 Usuario registrado exitosamente: ${email} con ID: ${savedUser.id}`);
    
    if (savedUser.roles && savedUser.roles.length > 0) {
      if (isFirstUser) {
        console.log(`👑 Primer usuario - Rol asignado: ${savedUser.roles.map(r => r.name).join(', ')}`);
      } else {
        console.log(`🔑 Usuario nuevo - Rol asignado: ${savedUser.roles.map(r => r.name).join(', ')}`);
      }
    } else {
      console.warn(`⚠️ Usuario creado sin roles asignados: ${email}`);
    }

    // Generar token
    return this.generateToken(savedUser);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    console.log(`🔍 Buscando usuario: ${email}`);

    // Buscar usuario con roles
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });

    if (!user) {
      console.log(`❌ Usuario no encontrado: ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    console.log(`👤 Usuario encontrado: ${email}`);

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`🔒 Contraseña incorrecta para: ${email}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    console.log(`🎉 Login exitoso para: ${email} con roles:`, user.roles?.map(r => r.name) || ['sin roles']);

    return this.generateToken(user);
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
      
    });
  }

  // private async generateToken(user: User): Promise<AuthResponse> {
  //   const roles = user.roles ? user.roles.map(role => role.name) : [];
    
  //   const payload: JwtPayload = {
  //     sub: user.id,
  //     email: user.email,
  //     roles,
  //   };

  //   const access_token = this.jwtService.sign(payload);

  //   return {
  //     access_token,
  //     user: {
  //       id: user.id,
  //       email: user.email,
  //       name: user.name,
  //       lastname: user.lastname,
  //       roles,
  //     },
  //     expires_in: 3600, // 1 hora
  //   };
  // }

  private async generateToken(user: User): Promise<AuthResponse> {
  const roles = user.roles ? user.roles.map(role => ({ id: role.id, name: role.name })) : [];
  
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    roles,
  };

  const access_token = this.jwtService.sign(payload);

  return {
    access_token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      lastname: user.lastname,
      roles,
    },
    expires_in: 3600, // 1 hora
  };
}

  async refreshToken(userId: number): Promise<{ access_token: string }> {
  const user = await this.userRepository.findOne({
    where: { id: userId },
    relations: ['roles'],
  });

  if (!user) {
    throw new UnauthorizedException('Usuario no encontrado');
  }

  const roles = user.roles ? user.roles.map(role => ({ id: role.id, name: role.name })) : [];

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    roles,
  };

  return {
    access_token: this.jwtService.sign(payload, { expiresIn: '1h' }), // 👈 forzamos exp
  };
}

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    console.log(`🔄 Solicitud de recuperación de contraseña para: ${email}`);

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      console.log(`⚠️ Usuario no encontrado para recuperación: ${email}`);
      // Por seguridad, siempre devolvemos el mismo mensaje
      return {
        message: 'Si el email existe, se enviará un enlace de recuperación',
      };
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hora de expiración

    // Guardar token en la base de datos
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await this.userRepository.save(user);

    console.log(`📧 Token de recuperación generado para: ${email}`);

    // Enviar email con el enlace de recuperación
    try {
      const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"Gestión Vial" <${this.configService.get('EMAIL_USER')}>`,
        to: email,
        subject: 'Recuperación de Contraseña - Gestión Vial',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Recuperación de Contraseña</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p>Hola ${user.name || 'Usuario'},</p>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Gestión Vial</strong>.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Restablecer Contraseña
                </a>
              </div>
              
              <p><strong>O copia y pega este enlace en tu navegador:</strong></p>
              <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">
                ${resetUrl}
              </p>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">
                  <strong>⚠️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por seguridad.
                </p>
              </div>
              
              <p>Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #666; font-size: 12px; text-align: center;">
                Este es un email automático, por favor no respondas a este mensaje.<br>
                <strong>Gestión Vial - Sistema de Administración</strong>
              </p>
            </div>
          </div>
        `,
        text: `
          Recuperación de Contraseña - Gestión Vial
          
          Hola ${user.name || 'Usuario'},
          
          Recibimos una solicitud para restablecer la contraseña de tu cuenta.
          
          Usa este enlace para restablecer tu contraseña:
          ${resetUrl}
          
          Este enlace expirará en 1 hora por seguridad.
          
          Si no solicitaste este cambio, puedes ignorar este email.
          
          Gestión Vial - Sistema de Administración
        `,
      };

      console.log(`📧 Intentando enviar email a: ${email}`);
      
      // Verificar la conexión SMTP primero
      await this.transporter.verify();
      console.log('✅ Conexión SMTP verificada exitosamente');
      
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email de recuperación enviado exitosamente a: ${email}`);
      
    } catch (error) {
      console.error(`❌ Error enviando email a ${email}:`, error);
      
      // Log más específico del error
      if (error.code === 'EDNS' || error.code === 'ENOTFOUND') {
        console.error('🌐 Error de conexión de red o DNS. Verifica tu conexión a internet.');
      } else if (error.code === 'EAUTH') {
        console.error('🔐 Error de autenticación. Verifica tu email y contraseña de aplicación.');
      } else {
        console.error('📧 Error SMTP:', error.message);
      }
      
      // Por ahora, mostrar el token en consola como fallback
      console.log(`🔑 FALLBACK - Token de recuperación: ${resetToken}`);
      console.log(`📱 Enlace de recuperación: ${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`);
    }

    return {
      message: 'Si el email existe, se enviará un enlace de recuperación',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    console.log(`🔐 Intento de reset de contraseña con token: ${token}`);

    const user = await this.userRepository.findOne({
      where: { 
        resetPasswordToken: token,
      },
    });

    if (!user) {
      console.log(`❌ Token de reset inválido: ${token}`);
      throw new BadRequestException('Token de reset inválido o expirado');
    }

    // Verificar si el token ha expirado
    if (user.resetPasswordExpires < new Date()) {
      console.log(`⏰ Token expirado para usuario: ${user.email}`);
      throw new BadRequestException('Token de reset inválido o expirado');
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña y limpiar tokens
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    console.log(`✅ Contraseña actualizada exitosamente para: ${user.email}`);

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }

  async verifyResetToken(verifyResetTokenDto: VerifyResetTokenDto): Promise<{ valid: boolean; message: string; email?: string }> {
    const { token } = verifyResetTokenDto;

    console.log(`🔍 Verificando token de reset: ${token}`);

    const user = await this.userRepository.findOne({
      where: { 
        resetPasswordToken: token,
      },
    });

    if (!user) {
      console.log(`❌ Token no encontrado: ${token}`);
      return {
        valid: false,
        message: 'Token de reset inválido',
      };
    }

    // Verificar si el token ha expirado
    if (user.resetPasswordExpires < new Date()) {
      console.log(`⏰ Token expirado para usuario: ${user.email}`);
      return {
        valid: false,
        message: 'Token de reset expirado',
      };
    }

    console.log(`✅ Token válido para usuario: ${user.email}`);

    return {
      valid: true,
      message: 'Token válido',
      email: user.email,
    };
  }
}