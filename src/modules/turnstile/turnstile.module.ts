import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { TurnstileController } from './turnstile.controller';
import { TurnstileService } from './turnstile.service';
import {
  UsedNonce,
  UsedNonceSchema,
} from '../../common/schemas/used-nonce.schema';
import {
  BufferedEntry,
  BufferedEntrySchema,
} from '../../common/schemas/buffered-entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UsedNonce.name, schema: UsedNonceSchema },
      { name: BufferedEntry.name, schema: BufferedEntrySchema },
    ]),
    HttpModule,
  ],
  controllers: [TurnstileController],
  providers: [TurnstileService],
})
export class TurnstileModule {}
