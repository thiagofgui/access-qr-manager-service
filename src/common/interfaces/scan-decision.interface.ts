export enum ScanDecision {
  ALLOWED = 'ALLOWED',
  DENIED = 'DENIED',
}

export enum DenialReason {
  EXPIRED = 'EXPIRED',
  GATE_NOT_ALLOWED = 'GATE_NOT_ALLOWED',
  ALREADY_USED = 'ALREADY_USED',
  REVOKED = 'REVOKED',
  MANAGER_UNAVAILABLE = 'MANAGER_UNAVAILABLE',
  INVALID_TOKEN = 'INVALID_TOKEN',
}

export interface ScanResult {
  decision: ScanDecision;
  reason?: DenialReason;
  at: string;
}
