import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { I18nService } from 'nestjs-i18n';
import { ResponseModel } from './common/classes/response.model';

import { AppImports } from './config/app-imports.config';

@Module({
  imports: AppImports,
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: 'FIREBASE_ADMIN_INIT',
    //   useFactory: () => {
    //     firebaseAdminInit();
    //   },
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {
  constructor(private readonly i18n: I18nService) {
    ResponseModel.i18n = this.i18n;
  }
}
