import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    try {
      console.log('🔍 Validando JWT payload:', { sub: payload.sub, email: payload.email });
      
      const user = await this.authService.validateUser(payload.sub);
      if (!user) {
        console.log('❌ Usuario no encontrado para ID:', payload.sub);
        throw new UnauthorizedException('Usuario no válido');
      }
      
      console.log('✅ Usuario validado:', { id: user.id, email: user.email });
      return user;
    } catch (error) {
      console.error('❌ Error en validación JWT:', error);
      throw new UnauthorizedException('Error de validación de token');
    }
  }
}