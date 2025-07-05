import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { LoggerService } from './shared/logger/logger.service';
import { TransformAPIInterceptor } from './common/interceptors/transform.interceptor';
import { I18nService } from 'nestjs-i18n';
import { ApiExceptionFilter } from './common/filter/api-exception';
import { LanguageMiddleware } from './common/middleware/language.middleware';
import helmet from 'helmet';
import { ThrottlerGuard } from '@nestjs/throttler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  // app.use(
  //   helmet({
  //     contentSecurityPolicy: {
  //       directives: {
  //         defaultSrc: ["'self'"],
  //         scriptSrc: ["'self'", "'unsafe-inline'"],
  //         styleSrc: ["'self'", "'unsafe-inline'"],
  //         fontSrc: ["'self'"],
  //       },
  //     },
  //     referrerPolicy: { policy: 'same-origin' },
  //     xContentTypeOptions: true,
  //     xDnsPrefetchControl: { allow: true },
  //     xDownloadOptions: true,
  //     xFrameOptions: { action: 'sameorigin' },
  //     xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
  //     xXssProtection: true,
  //   }),
  // );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    skipMissingProperties: false, // Ensure this is false
    stopAtFirstError: false, // Important for custom validators
    exceptionFactory: (errors) => {
      const errorMessages = errors.map(error => ({
        field: error.property,
        message: Object.values(error.constraints)[0]
      }));
      return new BadRequestException({
        status: 'failed',
        code: 400,
        data: null,
        message: errorMessages[0]?.message || 'Validation failed'
      });
    }
  })
);

  app.useGlobalInterceptors(new TransformAPIInterceptor(new LoggerService()));

  app.setGlobalPrefix('api');

  app.useGlobalFilters(
    new ApiExceptionFilter(new LoggerService(), app.get(I18nService)),
  );

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.use(new LanguageMiddleware().use);
  const PORT = process.env.PORT || 3000;

  await app.listen(PORT);
}
bootstrap();
