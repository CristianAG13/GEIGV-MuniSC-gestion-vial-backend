import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class DateSerializerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.serializeDates(data))
    );
  }

  private serializeDates(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (obj instanceof Date) {
      // Always return dates in ISO UTC format
      return obj.toISOString();
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.serializeDates(item));
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
      const serialized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (value instanceof Date) {
            // Para campos de fecha específicos, agregar información adicional
            serialized[key] = {
              original: value.toISOString(),
              formatted: this.formatDateForDisplay(value),
              utc: value.toISOString(),
              timestamp: value.getTime()
            };
          } else {
            serialized[key] = this.serializeDates(value);
          }
        }
      }
      return serialized;
    }

    return obj;
  }

  private formatDateForDisplay(date: Date): string {
    // Formatear para mostrar en UTC, no en zona local
    const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    return utcDate.toLocaleString('es-CO', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}