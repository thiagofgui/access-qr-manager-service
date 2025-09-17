import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';

export interface JwtPayload {
  sub: string; // visitId
  name: string; // visitName
  gate: string; // allowed building
  max: number; // max uses
  jti: string; // JWT ID
  nbf: number; // not before
  exp: number; // expires
  iss: string; // issuer
  iat: number; // issued at
}

@Injectable()
export class JwtService {
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly keyId: string;
  private readonly issuer: string;

  constructor() {
    this.privateKey = env.JWT_PRIVATE_KEY_PEM as string;
    this.publicKey = env.JWT_PUBLIC_KEY_PEM as string;
    this.keyId = env.JWT_KEY_ID;
    this.issuer = env.JWT_ISSUER;

    if (!this.privateKey || !this.publicKey || !this.keyId || !this.issuer) {
      throw new Error('JWT configuration is incomplete');
    }
  }

  generateToken(input: {
    visitId: string;
    visitName: string;
    allowedBuilding: string;
    windowStart: string;
    windowEnd: string;
    maxUses?: number;
  }): { token: string; jti: string } {
    const nbf = Math.floor(new Date(input.windowStart).getTime() / 1000);
    const exp = Math.floor(new Date(input.windowEnd).getTime() / 1000);
    const iat = Math.floor(Date.now() / 1000);
    const jti = randomUUID();

    if (!Number.isFinite(nbf) || !Number.isFinite(exp) || exp <= nbf) {
      throw new Error('Invalid time window: windowEnd must be after windowStart');
    }

    const payload: JwtPayload = {
      sub: input.visitId,
      name: input.visitName,
      gate: input.allowedBuilding,
      max: input.maxUses ?? 1,
      jti,
      nbf,
      exp,
      iss: this.issuer,
      iat,
    };

    const token = jwt.sign(
      payload,
      { key: this.privateKey, passphrase: '' },
      { algorithm: 'RS256', keyid: this.keyId },
    );

    return { token, jti };
  }

  verifyToken(token: string): {
    valid: boolean;
    payload?: JwtPayload;
    error?: string;
  } {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.issuer,
      }) as JwtPayload;

      return { valid: true, payload: decoded };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: error.message };
      }
      return { valid: false, error: 'Token verification failed' };
    }
  }
}

// Legacy function for backward compatibility
export function generateQrToken(input: {
  visitId: string;
  visitName: string;
  allowedBuilding: string;
  windowStart: string;
  windowEnd: string;
  maxUses?: number;
}): string {
  const jwtService = new JwtService();
  return jwtService.generateToken(input).token;
}