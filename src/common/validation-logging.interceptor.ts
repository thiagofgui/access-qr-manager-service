import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ValidationLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ValidationLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Log da requisição
    if (request.url.includes('/consume')) {
      this.logger.log(`📥 [QR-MANAGER] Recebendo validação de catraca`);
    }

    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof BadRequestException && request.url.includes('/consume')) {
          this.logger.error(`❌ [QR-MANAGER] Validação falhou: ${error.message}`);
        }
        return throwError(() => error);
      }),
    );
  }
}