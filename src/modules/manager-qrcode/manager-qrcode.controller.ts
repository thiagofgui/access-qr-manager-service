import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ManagerQrcodeService } from './manager-qrcode.service';
import { CreateQrcodeDto } from '../../common/dto/create-qrcode.dto';
import { ConsumeQrcodeDto } from '../../common/dto/consume-qrcode.dto';

@Controller('qrcodes')
export class ManagerQrcodeController {
  private readonly logger = new Logger(ManagerQrcodeController.name);

  constructor(private readonly managerQrcodeService: ManagerQrcodeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createQrcode(@Body() createQrcodeDto: CreateQrcodeDto) {
    this.logger.log(`🆕 [QR-MANAGER] Criando QR Code para visitante`);
    const result = await this.managerQrcodeService.createQrcode(createQrcodeDto);
    this.logger.log(`✅ [QR-MANAGER] QR Code criado com sucesso`);
    return result;
  }

  @Post('consume')
  @HttpCode(HttpStatus.OK)
  async consumeQrcode(@Body() consumeQrcodeDto: ConsumeQrcodeDto) {
    try {
      const result = await this.managerQrcodeService.consumeQrcode(consumeQrcodeDto);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Delete(':jti')
  @HttpCode(HttpStatus.OK)
  async revokeQrcode(@Param('jti') jti: string) {
    return this.managerQrcodeService.revokeQrcode(jti);
  }

  @Get('resident/:residentId')
  @HttpCode(HttpStatus.OK)
  async getQrcodesByResident(@Param('residentId') residentId: string) {
    return this.managerQrcodeService.getQrcodesByResident(residentId);
  }
}
