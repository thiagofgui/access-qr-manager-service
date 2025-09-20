import {
  Injectable,
  NotFoundException,
  ConflictException,
  GoneException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Pass,
  PassDocument,
  PassStatus,
} from '../../common/schemas/pass.schema';
import { CreateQrcodeDto } from '../../common/dto/create-qrcode.dto';
import { ConsumeQrcodeDto } from '../../common/dto/consume-qrcode.dto';
import { JwtService } from '../../common/services/jwt.service';
import { env } from '../../config/env';

@Injectable()
export class ManagerQrcodeService {
  private readonly logger = new Logger(ManagerQrcodeService.name);

  constructor(
    @InjectModel(Pass.name)
    private passModel: Model<PassDocument>,
    private jwtService: JwtService,
  ) { }

  async createQrcode(createQrcodeDto: CreateQrcodeDto) {
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const windowStart = new Date(createQrcodeDto.windowStart);
    const windowEnd = new Date(createQrcodeDto.windowEnd);
    
    const windowStartBR = new Date(windowStart.getTime() - 3 * 60 * 60 * 1000);
    const windowEndBR = new Date(windowEnd.getTime() - 3 * 60 * 60 * 1000);
    this.logger.log(`⏰ [QR-MANAGER] Janela: ${windowStartBR.toLocaleString('pt-BR')} até ${windowEndBR.toLocaleString('pt-BR')}`);

    // Validações
    if (windowStart <= now) {
      throw new BadRequestException('windowStart must be in the future');
    }
    if (windowEnd <= windowStart) {
      throw new BadRequestException('windowEnd must be after windowStart');
    }

    // Gerar token JWT
    const { token, jti } = this.jwtService.generateToken({
      visitId: createQrcodeDto.visitId,
      visitName: createQrcodeDto.visitName,
      allowedBuilding: createQrcodeDto.turnstileId,
      windowStart: createQrcodeDto.windowStart,
      windowEnd: createQrcodeDto.windowEnd,
      maxUses: createQrcodeDto.maxUses,
    });

    // Salvar no banco
    const pass = new this.passModel({
      jti,
      visitId: createQrcodeDto.visitId,
      visitName: createQrcodeDto.visitName,
      allowedBuilding: createQrcodeDto.turnstileId,
      windowStart,
      windowEnd,
      maxUses: createQrcodeDto.maxUses || 1,
      usedCount: 0,
      status: PassStatus.PENDING,
    });

    await pass.save();
    this.logger.log(`💾 [QR-MANAGER] QR Code salvo no banco - Máx usos: ${pass.maxUses}`);

    return {
      token,
      jti,
      expiresAt: windowEnd.toISOString(),
    };
  }

  async consumeQrcode(consumeQrcodeDto: ConsumeQrcodeDto) {
    this.logger.log(`🔍 [QR-MANAGER] Validando QR Code: ${consumeQrcodeDto.jti.substring(0, 8)}...`);

    const pass = await this.passModel.findOne({
      jti: consumeQrcodeDto.jti,
    });

    if (!pass) {
      this.logger.error(`❌ [QR-MANAGER] QR Code não encontrado: ${consumeQrcodeDto.jti.substring(0, 8)}...`);
    } else {
      this.logger.log(`✅ [QR-MANAGER] QR Code encontrado - Status: ${pass.status} | Usos: ${pass.usedCount}/${pass.maxUses}`);
    }

    if (!pass) {
      throw new NotFoundException('Pass not found');
    }

    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const scanTime = new Date(consumeQrcodeDto.at);

    // Verificar se foi revogado
    if (pass.status === PassStatus.REVOKED) {
      this.logger.error(`❌ [QR-MANAGER] QR Code foi revogado`);
      throw new GoneException('QR Code foi revogado pelo administrador');
    }

    // Verificar se expirou
    if (now > pass.windowEnd) {
      pass.status = PassStatus.EXPIRED;
      await pass.save();
      this.logger.error(`❌ [QR-MANAGER] QR Code expirado`);
      throw new BadRequestException('QR Code expirado');
    }

    // Verificar se já foi usado o máximo de vezes
    if (pass.usedCount >= pass.maxUses) {
      this.logger.error(`❌ [QR-MANAGER] QR Code esgotou usos: ${pass.usedCount}/${pass.maxUses}`);
      throw new ConflictException('QR Code já foi usado o máximo de vezes permitidas');
    }

    // Verificar se o gate é permitido
    if (pass.allowedBuilding !== consumeQrcodeDto.gate) {
      this.logger.error(`❌ [QR-MANAGER] Catraca não autorizada: ${consumeQrcodeDto.gate} != ${pass.allowedBuilding}`);
      throw new BadRequestException('QR Code não autorizado para esta catraca');
    }

    // Verificar se ainda está na janela de tempo
    const windowStartBR = new Date(pass.windowStart.getTime() - 3 * 60 * 60 * 1000);
    const windowEndBR = new Date(pass.windowEnd.getTime() - 3 * 60 * 60 * 1000);
    const scanTimeBR = new Date(scanTime.getTime() - 3 * 60 * 60 * 1000);
    
    this.logger.log(`⏰ [QR-MANAGER] Janela: ${windowStartBR.toLocaleString('pt-BR')} até ${windowEndBR.toLocaleString('pt-BR')}`);
    this.logger.log(`🕐 [QR-MANAGER] Scan em: ${scanTimeBR.toLocaleString('pt-BR')}`);

    if (scanTime < pass.windowStart || scanTime > pass.windowEnd) {
      this.logger.error(`❌ [QR-MANAGER] Fora da janela de tempo!`);
      throw new BadRequestException('Scan time outside allowed window');
    }

    this.logger.log(`✅ [QR-MANAGER] Dentro da janela de tempo - ACESSO LIBERADO!`);

    // Incrementar contador de uso
    pass.usedCount += 1;
    pass.status = PassStatus.ACTIVE;
    await pass.save();

    return {
      ok: true,
      remaining: pass.maxUses - pass.usedCount,
    };
  }

  async revokeQrcode(jti: string) {
  const pass = await this.passModel.findOne({
    jti,
  });

  if (!pass) {
    throw new NotFoundException('Pass not found');
  }

  pass.status = PassStatus.REVOKED;
  await pass.save();

  return { ok: true };
}

  async getQrcodesByResident(residentId: string) {
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
    
    const passes = await this.passModel.find({
      visitId: { $regex: `^${residentId}-` },
      status: { $in: [PassStatus.PENDING, PassStatus.ACTIVE] },
      windowEnd: { $gt: now }
    }).sort({ windowEnd: -1 });

    return passes.map(pass => ({
      jti: pass.jti,
      visitName: pass.visitName,
      windowStart: pass.windowStart,
      windowEnd: pass.windowEnd,
      usedCount: pass.usedCount,
      maxUses: pass.maxUses,
      status: pass.status,
      allowedBuilding: pass.allowedBuilding
    }));
  }
}