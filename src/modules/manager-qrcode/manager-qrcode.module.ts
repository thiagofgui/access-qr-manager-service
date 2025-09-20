import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ManagerQrcodeController } from './manager-qrcode.controller';
import { ManagerQrcodeService } from './manager-qrcode.service';
import { TurnstileController } from './turnstile.controller';
import { Pass, PassSchema } from '../../common/schemas/pass.schema';
import { JwtService } from '../../common/services/jwt.service';
import { TurnstileService } from '../../common/services/turnstile.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pass.name, schema: PassSchema }]),
  ],
  controllers: [ManagerQrcodeController, TurnstileController],
  providers: [ManagerQrcodeService, JwtService, TurnstileService],
  exports: [ManagerQrcodeService],
})
export class ManagerQrcodeModule {}
