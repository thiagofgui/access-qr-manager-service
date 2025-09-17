export enum PassStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export interface Pass {
  jti: string;
  visitName: string;
  allowedBuildings: string[];
  windowStart: Date;
  windowEnd: Date;
  maxUses: number;
  usedCount: number;
  status: PassStatus;
  createdAt: Date;
  updatedAt: Date;
}
