import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
}
