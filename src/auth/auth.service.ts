import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, name, lastname } = registerDto;

    console.log(`📝 Intentando registrar usuario: ${email}`);

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      console.log(`⚠️ Usuario ya existe: ${email}`);
      throw new ConflictException('El usuario ya existe');
    }

    console.log(`🔐 Hasheando contraseña para: ${email}`);

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      lastname,
    });

    console.log(`💾 Guardando usuario en base de datos: ${email}`);

    const savedUser = await this.userRepository.save(user);

    console.log(`🎉 Usuario registrado exitosamente: ${email} con ID: ${savedUser.id}`);

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

  private async generateToken(user: User): Promise<AuthResponse> {
    const roles = user.roles ? user.roles.map(role => role.name) : [];
    
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

    const roles = user.roles ? user.roles.map(role => role.name) : [];
    
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
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
    console.log(`🔑 Token: ${resetToken}`);
    console.log(`⏰ Expira: ${resetTokenExpires}`);

    // En un entorno real, aquí enviarías un email
    // Por ahora, solo mostramos el token en consola para desarrollo
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
}