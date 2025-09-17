import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ManagerQrcodeService } from './manager-qrcode.service';
import { CreateQrcodeDto } from '../../common/dto/create-qrcode.dto';
import { ConsumeQrcodeDto } from '../../common/dto/consume-qrcode.dto';

@Controller('qrcodes')
export class ManagerQrcodeController {
  constructor(private readonly managerQrcodeService: ManagerQrcodeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createQrcode(@Body() createQrcodeDto: CreateQrcodeDto) {
    return this.managerQrcodeService.createQrcode(createQrcodeDto);
  }

  @Post('consume')
  @HttpCode(HttpStatus.OK)
  async consumeQrcode(@Body() consumeQrcodeDto: ConsumeQrcodeDto) {
    return this.managerQrcodeService.consumeQrcode(consumeQrcodeDto);
  }

  @Delete(':jti')
  @HttpCode(HttpStatus.OK)
  async revokeQrcode(@Param('jti') jti: string) {
    return this.managerQrcodeService.revokeQrcode(jti);
  }

  @Get('keys/public')
  getPublicKey() {
    return this.managerQrcodeService.getPublicKey();
  }
}
