import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { LoggerService } from '../../shared/logger/logger.service';
import { ResponseModel } from '../classes/response.model';
import { I18nService } from 'nestjs-i18n';
import { ThrottlerException } from '@nestjs/throttler';
import { ValidationError } from 'class-validator';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(
    private logger: LoggerService,
    private i18n: I18nService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const safeRequest = {
      url: request.url,
      method: request.method,
      params: request.params,
      body: request.body,
      query: request.query,
      headers: request.headers,
    };

    const lang = request.headers['accept-language']?.split(',')[0] || 'ar';
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    response.header('Content-Type', 'application/json; charset=utf-8');

    let message =
      exception['message'] ||
      exception['response']?.['message'] ||
      exception['response']?.['error'] ||
      exception['error'] ||
      'BAD_REQUEST';

    // ✨ خاص بـ Throttling
    if (exception instanceof ThrottlerException) {
      message = await this.i18n.t('TOO_MANY_REQUESTS', { lang });
    }

    // ✅ فحص إذا الخطأ من التحقق Validation
    else if (
      exception instanceof BadRequestException &&
      exception.getResponse()['message'] === 'Validation failed'
    ) {
      const validationResponse = exception.getResponse() as any;
      const validationErrors: ValidationError[] = validationResponse.errors || [];

      const validationMessage =
        this.findFirstConstraintError(validationErrors) || 'فشل التحقق من البيانات';

      message = validationMessage;
    }

    // ✅ ترجمة الرسائل المعروفة
    else if (this.i18n) {
      message = (await this.i18n.t(`${message}`, { lang })) || message;
    }

    // 💥 أخطاء الخادم
    if (status >= 500) {
      this.logger.error(
        `Request: ${JSON.stringify(safeRequest)}\nException: ${JSON.stringify(exception)}\nMessage: ${message}`,
        ApiExceptionFilter.name,
      );
      message = await this.i18n.t('INTERNAL_SERVER_ERROR', { lang });
    }

    // ⚠️ أخطاء المستخدم أو الطلب
    else if (status >= 400) {
      this.logger.warn(
        `Request: ${JSON.stringify(safeRequest)}\nException: ${JSON.stringify(exception)}\nMessage: ${message}`,
      );

      const originalMessage = exception['response']?.['message'];
      if (originalMessage === 'Bad Request') {
        message = await this.i18n.t('BAD_REQUEST', { lang });
      } else if (typeof originalMessage === 'string' && originalMessage.includes('Unauthorized')) {
        message = await this.i18n.t('UNAUTHORIZED', { lang });
      } else if (originalMessage === 'Not Found') {
        message = await this.i18n.t('NOT_FOUND', { lang });
      } else if (originalMessage === 'Forbidden') {
        message = await this.i18n.t('FORBIDDEN', { lang });
      }
    }

    const result = new ResponseModel(status, null, message, 'failed');
    response.status(status).send(result);
  }

  // ✅ دالة Recursive لإيجاد أول خطأ تحقق فعلي
  private findFirstConstraintError(errors: ValidationError[]): string | null {
    for (const error of errors) {
      if (error.constraints) {
        return Object.values(error.constraints)[0];
      }

      if (error.children?.length) {
        const messageInChildren = this.findFirstConstraintError(error.children);
        if (messageInChildren) {
          return messageInChildren;
        }
      }
    }
    return null;
  }
}
