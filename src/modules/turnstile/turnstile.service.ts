import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UsedNonce,
  UsedNonceDocument,
} from '../../common/schemas/used-nonce.schema';
import {
  BufferedEntry,
  BufferedEntryDocument,
  ScanDecision,
  DenialReason,
} from '../../common/schemas/buffered-entry.schema';
import { ScanQrcodeDto } from '../../common/dto/scan-qrcode.dto';
import { verifyQrToken, JwtPayload } from '../../common/services/jwt.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly qrManagerUrl =
    process.env.QR_MANAGER_URL || 'http://localhost:3000';

  constructor(
    @InjectModel(UsedNonce.name)
    private usedNonceModel: Model<UsedNonceDocument>,
    @InjectModel(BufferedEntry.name)
    private bufferedEntryModel: Model<BufferedEntryDocument>,
    private httpService: HttpService,
  ) {}

  async scanQrcode(scanQrcodeDto: ScanQrcodeDto) {
    const now = new Date();
    const result: {
      decision: ScanDecision;
      reason?: DenialReason;
      at: string;
    } = {
      decision: ScanDecision.DENIED,
      reason: DenialReason.INVALID_TOKEN,
      at: now.toISOString(),
    };

    try {
      // 1. Verificar JWT localmente
      const jwtResult = verifyQrToken(scanQrcodeDto.token);

      if (!jwtResult.valid || !jwtResult.payload) {
        result.reason = DenialReason.INVALID_TOKEN;
        return result;
      }

      const payload: JwtPayload = jwtResult.payload;

      // 2. Verificar se já foi usado localmente (anti-replay)
      const existingNonce = await this.usedNonceModel.findOne({
        jti: payload.jti,
      });

      if (existingNonce) {
        result.reason = DenialReason.ALREADY_USED;
        return result;
      }

      // 3. Verificar se o gate é permitido
      if (payload.gate !== scanQrcodeDto.gateId) {
        result.reason = DenialReason.GATE_NOT_ALLOWED;
        return result;
      }

      // 4. Verificar janela de tempo
      const nowTimestamp = Math.floor(now.getTime() / 1000);
      if (nowTimestamp < payload.nbf || nowTimestamp > payload.exp) {
        result.reason = DenialReason.EXPIRED;
        return result;
      }

      // 5. Tentar consultar o qr-manager para verificação de estado dinâmico
      try {
        const consumeResponse = await firstValueFrom(
          this.httpService.post(`${this.qrManagerUrl}/qrcodes/consume`, {
            jti: payload.jti,
            gateId: scanQrcodeDto.gateId,
            at: now.toISOString(),
          }),
        );

        if (consumeResponse.data.ok) {
          // Sucesso: registrar localmente e permitir
          await this.usedNonceModel.create({
            jti: payload.jti,
            firstSeenAt: now,
          });

          result.decision = ScanDecision.ALLOWED;
          result.reason = undefined;
          this.logger.log(`Entrada permitida para JTI: ${payload.jti}`);
        } else {
          result.reason = DenialReason.ALREADY_USED;
        }
      } catch (error) {
        // qr-manager indisponível - aplicar política de degradação
        this.logger.warn(
          'qr-manager indisponível, aplicando política de degradação',
        );

        // Política fail-open controlado: permitir se max=1 e não foi visto localmente
        if (payload.max === 1 && !existingNonce) {
          result.decision = ScanDecision.ALLOWED;
          result.reason = undefined;

          // Bufferizar evento para compensação posterior
          await this.bufferedEntryModel.create({
            visitName: payload.name,
            gateId: scanQrcodeDto.gateId,
            at: now,
            decision: ScanDecision.ALLOWED,
            sent: false,
          });

          this.logger.log(
            `Entrada permitida offline para JTI: ${payload.jti} (bufferizado)`,
          );
        } else {
          result.reason = DenialReason.MANAGER_UNAVAILABLE;
        }
      }
    } catch (error) {
      this.logger.error('Erro durante verificação do QR code', error);
      result.reason = DenialReason.INVALID_TOKEN;
    }

    return result;
  }

  async flushBufferedEntries() {
    const unsentEntries = await this.bufferedEntryModel.find({
      sent: false,
    });

    const results: Array<{
      id: string;
      status: string;
      error?: string;
    }> = [];

    for (const entry of unsentEntries) {
      try {
        // Extrair JTI do token (simplificado para demo)
        // Em um cenário real, você armazenaria o JTI junto com o evento
        const response = await firstValueFrom(
          this.httpService.post(`${this.qrManagerUrl}/qrcodes/consume`, {
            jti: `PSS-${entry.visitName}`, // Simplificado para demo
            gateId: entry.gateId,
            at: entry.at.toISOString(),
          }),
        );

        if (response.data.ok) {
          entry.sent = true;
          await entry.save();
          results.push({ id: (entry as any)._id.toString(), status: 'sent' });
        }
      } catch (error) {
        this.logger.warn(
          `Falha ao enviar evento ${(entry as any)._id}`,
          error.message,
        );
        results.push({
          id: (entry as any)._id.toString(),
          status: 'failed',
          error: error.message,
        });
      }
    }

    return {
      processed: results.length,
      results,
    };
  }
}
