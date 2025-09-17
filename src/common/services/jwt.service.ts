import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';

export interface JwtPayload {
  sub: string; // visitId
  name: string; // visitName
  gate: string; // allowed building (single)
  max: number; // max uses
  jti: string; // JWT ID
  nbf: number; // not before
  exp: number; // expires
  iss?: string; // issuer
  iat?: number; // issued at
}

export function generateQrToken(input: {
  visitId: string;
  visitName: string;
  allowedBuilding: string; // Single building only
  windowStart: string; // ISO
  windowEnd: string; // ISO
  maxUses?: number; // default 1
}): string {
  const privateKey = env.JWT_PRIVATE_KEY_PEM as string;
  const kid = env.JWT_KEY_ID;
  const issuer = env.JWT_ISSUER;

  if (!privateKey) {
    throw new Error('JWT_PRIVATE_KEY_PEM não configurada');
  }

  const nbf = Math.floor(new Date(input.windowStart).getTime() / 1000);
  const exp = Math.floor(new Date(input.windowEnd).getTime() / 1000);

  if (!Number.isFinite(nbf) || !Number.isFinite(exp) || exp <= nbf) {
    throw new Error('Janela inválida: windowEnd deve ser > windowStart (ISO).');
  }

  const payload: JwtPayload = {
    sub: input.visitId,
    name: input.visitName,
    gate: input.allowedBuilding,
    max: input.maxUses ?? 1,
    jti: randomUUID(),
    nbf,
    exp,
    iss: issuer,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(
    payload,
    { key: privateKey, passphrase: '' },
    { algorithm: 'RS256', keyid: kid },
  );
}

export function verifyQrToken(token: string): {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
} {
  try {
    const publicKey = env.JWT_PUBLIC_KEY_PEM as string;

    if (!publicKey) {
      return { valid: false, error: 'JWT_PUBLIC_KEY_PEM não configurada' };
    }

    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: env.JWT_ISSUER,
    }) as JwtPayload;

    return { valid: true, payload: decoded };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Token verification failed' };
  }
}

export function getPublicKey(): { kid: string; key: string } {
  return {
    kid: env.JWT_KEY_ID,
    key: env.JWT_PUBLIC_KEY_PEM as string,
  };
}
