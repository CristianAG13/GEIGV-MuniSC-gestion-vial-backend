import { Controller, Post, Body, UseGuards, Get, Request, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthResponse } from './interfaces/auth-response.interface';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
  private readonly usersService: UsersService,  
  ) {}

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

  // @UseGuards(JwtAuthGuard)
  // @Get('profile')
  // async getProfile(@Request() req) {
  //   return req.user;
  // }
 
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@Request() req) {
  try {
    // Validar que req.user existe
    if (!req.user || !req.user.id) {
      console.error('❌ Usuario no encontrado en request:', req.user);
      throw new BadRequestException('Usuario no autenticado');
    }

    const userId = req.user.id;
    console.log(`👤 Obteniendo perfil para usuario ID: ${userId}`);
    
    // Usar el método existente que ya carga roles
    const user = await this.usersService.findOne(userId);
    
    if (!user) {
      console.error(`❌ Usuario con ID ${userId} no encontrado en base de datos`);
      throw new BadRequestException('Usuario no encontrado');
    }
    
    const profileData = {
      id: user.id,
      email: user.email,
      name: user.name,
      lastname: user.lastname,
      roles: user.roles ? user.roles.map(role => role.name) : [], // Array de nombres de roles
      rol: user.roles && user.roles.length > 0 ? user.roles[0].name : null // Primer rol como principal
    };

    console.log(`✅ Perfil obtenido exitosamente para: ${user.email}`);
    return profileData;
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    throw new BadRequestException('Error obteniendo perfil');
  }
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
