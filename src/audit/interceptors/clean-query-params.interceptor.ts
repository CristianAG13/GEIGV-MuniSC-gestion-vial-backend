import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class CleanQueryParamsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Limpiar query parameters vacíos
    if (request.query) {
      Object.keys(request.query).forEach(key => {
        const value = request.query[key];
        
        // Convertir strings vacías a undefined
        if (value === '' || value === null || value === 'undefined' || value === 'null') {
          delete request.query[key];
        }
        
        // Convertir 'true'/'false' strings a boolean para algunos campos
        if (value === 'true') {
          request.query[key] = true;
        } else if (value === 'false') {
          request.query[key] = false;
        }
      });
    }

    return next.handle();
  }
}