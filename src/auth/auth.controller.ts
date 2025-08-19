import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthResponse } from './interfaces/auth-response.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('connection')
  checkConnection() {
    console.log('🔗 Frontend se ha conectado al backend exitosamente!');
    return {
      message: 'Conexión exitosa con el backend',
      status: 'connected',
      timestamp: new Date().toISOString(),
      server: 'gestion-vial-backend'
    };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    console.log(`📝 Nuevo registro para: ${registerDto.email}`);
    const result = await this.authService.register(registerDto);
    console.log(`✅ Usuario registrado exitosamente: ${registerDto.email}`);
    return result;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    console.log(`🔐 Intento de login para: ${loginDto.email}`);
    const result = await this.authService.login(loginDto);
    console.log(`✅ Login exitoso para: ${loginDto.email}`);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user.id);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    console.log(`🔄 Solicitud de recuperación para: ${forgotPasswordDto.email}`);
    const result = await this.authService.forgotPassword(forgotPasswordDto);
    console.log(`📧 Respuesta de recuperación enviada`);
    return result;
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    console.log(`🔐 Solicitud de reset de contraseña`);
    const result = await this.authService.resetPassword(resetPasswordDto);
    console.log(`✅ Contraseña reseteada exitosamente`);
    return result;
  }

  @Post('verify-reset-token')
  async verifyResetToken(@Body() verifyResetTokenDto: VerifyResetTokenDto) {
    console.log(`🔍 Verificando token de reset`);
    const result = await this.authService.verifyResetToken(verifyResetTokenDto);
    console.log(`📋 Resultado de verificación: ${result.valid ? 'válido' : 'inválido'}`);
    return result;
  }
}
