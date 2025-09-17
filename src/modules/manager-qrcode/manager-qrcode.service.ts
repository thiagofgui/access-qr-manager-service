import {
  Injectable,
  NotFoundException,
  ConflictException,
  GoneException,
  BadRequestException,
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
  constructor(
    @InjectModel(Pass.name)
    private passModel: Model<PassDocument>,
    private jwtService: JwtService,
  ) {}

  async createQrcode(createQrcodeDto: CreateQrcodeDto) {
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const windowStart = new Date(createQrcodeDto.windowStart);
    const windowEnd = new Date(createQrcodeDto.windowEnd);

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
      allowedBuilding: createQrcodeDto.allowedBuilding,
      windowStart: createQrcodeDto.windowStart,
      windowEnd: createQrcodeDto.windowEnd,
      maxUses: createQrcodeDto.maxUses,
    });

    // Salvar no banco
    const pass = new this.passModel({
      jti,
      visitId: createQrcodeDto.visitId,
      visitName: createQrcodeDto.visitName,
      allowedBuilding: createQrcodeDto.allowedBuilding,
      windowStart,
      windowEnd,
      maxUses: createQrcodeDto.maxUses || 1,
      usedCount: 0,
      status: PassStatus.PENDING,
    });

    await pass.save();

    return {
      token,
      jti,
      expiresAt: windowEnd.toISOString(),
    };
  }

  async consumeQrcode(consumeQrcodeDto: ConsumeQrcodeDto) {
    const pass = await this.passModel.findOne({
      jti: consumeQrcodeDto.jti,
    });

    if (!pass) {
      throw new NotFoundException('Pass not found');
    }

    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const scanTime = new Date(consumeQrcodeDto.at);

    // Verificar se foi revogado
    if (pass.status === PassStatus.REVOKED) {
      throw new GoneException('Pass revoked');
    }

    // Verificar se expirou
    if (now > pass.windowEnd) {
      pass.status = PassStatus.EXPIRED;
      await pass.save();
      throw new BadRequestException('Pass expired');
    }

    // Verificar se já foi usado o máximo de vezes
    if (pass.usedCount >= pass.maxUses) {
      throw new ConflictException('Pass already used maximum times');
    }

    // Verificar se o gate é permitido
    if (pass.allowedBuilding !== consumeQrcodeDto.gate) {
      throw new BadRequestException('Gate not allowed for this pass');
    }

    // Verificar se ainda está na janela de tempo
    if (scanTime < pass.windowStart || scanTime > pass.windowEnd) {
      throw new BadRequestException('Scan time outside allowed window');
    }

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
}
