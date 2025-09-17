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
import {
  generateQrToken,
  getPublicKey,
} from '../../common/services/jwt.service';

@Injectable()
export class ManagerQrcodeService {
  constructor(
    @InjectModel(Pass.name)
    private passModel: Model<PassDocument>,
  ) {}

  async createQrcode(createQrcodeDto: CreateQrcodeDto) {
    const now = new Date();
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
    const token = generateQrToken({
      visitId: createQrcodeDto.visitId,
      visitName: createQrcodeDto.visitName,
      allowedBuilding: createQrcodeDto.allowedBuilding,
      windowStart: createQrcodeDto.windowStart,
      windowEnd: createQrcodeDto.windowEnd,
      maxUses: createQrcodeDto.maxUses,
    });

    // Decodificar token para obter JTI
    const decoded = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString(),
    );
    const jti = decoded.jti;

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

    const now = new Date();
    const scanTime = new Date(consumeQrcodeDto.at);

    // Verificar se expirou
    if (now > pass.windowEnd) {
      pass.status = PassStatus.EXPIRED;
      await pass.save();
      throw new BadRequestException('Pass expired');
    }

    // Verificar se foi revogado
    if (pass.status === PassStatus.REVOKED) {
      throw new GoneException('Pass revoked');
    }

    // Verificar se já foi usado o máximo de vezes
    if (pass.usedCount >= pass.maxUses) {
      throw new ConflictException('Pass already used maximum times');
    }

    // Verificar se o gate é permitido
    if (pass.allowedBuilding !== consumeQrcodeDto.gateId) {
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

  getPublicKey() {
    return getPublicKey();
  }
}
