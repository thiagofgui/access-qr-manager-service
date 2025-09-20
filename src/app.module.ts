import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ManagerQrcodeModule } from './modules/manager-qrcode/manager-qrcode.module';
import { ValidationLoggingInterceptor } from './common/validation-logging.interceptor';
import { HealthController } from './health/health.controller';
import { env } from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(env.MONGODB_URI),
    ManagerQrcodeModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ValidationLoggingInterceptor,
    },
  ],
})
export class AppModule {}
