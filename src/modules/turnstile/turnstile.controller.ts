import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TurnstileService } from './turnstile.service';
import { ScanQrcodeDto } from '../../common/dto/scan-qrcode.dto';

@Controller('turnstile')
export class TurnstileController {
  constructor(private readonly turnstileService: TurnstileService) {}

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async scanQrcode(@Body() scanQrcodeDto: ScanQrcodeDto) {
    return this.turnstileService.scanQrcode(scanQrcodeDto);
  }

  @Post('flush')
  @HttpCode(HttpStatus.OK)
  async flushBufferedEntries() {
    return this.turnstileService.flushBufferedEntries();
  }
}
