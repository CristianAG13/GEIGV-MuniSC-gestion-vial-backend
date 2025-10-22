import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorHandlerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorHandlerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        
        // Log detallado del error
        this.logger.error(`Error en ${request.method} ${request.url}:`, {
          error: error.message,
          stack: error.stack,
          user: request.user?.email || 'Anonymous',
          timestamp: new Date().toISOString(),
        });

        // Re-lanzar el error para que NestJS lo maneje normalmente
        throw error;
      }),
    );
  }
}