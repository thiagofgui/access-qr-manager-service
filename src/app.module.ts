import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ManagerQrcodeModule } from './modules/manager-qrcode/manager-qrcode.module';
import { env } from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(env.MONGODB_URI),
    ManagerQrcodeModule,
  ],
})
export class AppModule {}
