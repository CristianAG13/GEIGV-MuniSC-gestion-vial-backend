import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class UTCDateInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.ensureUTCDates(data))
    );
  }

  private ensureUTCDates(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (obj instanceof Date) {
      // Asegurar que la fecha se serialice en UTC
      return obj.toISOString();
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.ensureUTCDates(item));
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
      const result: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (value instanceof Date) {
            // Mantener la fecha original pero agregar versión UTC explícita
            result[key] = value.toISOString();
          } else {
            result[key] = this.ensureUTCDates(value);
          }
        }
      }
      return result;
    }

    return obj;
  }
}