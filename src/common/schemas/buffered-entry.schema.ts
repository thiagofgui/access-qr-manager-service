import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

@Schema({ timestamps: true })
export class BufferedEntry {
  @Prop({ required: true })
  visitName: string;

  @Prop({ required: true })
  gateId: string;

  @Prop({ required: true })
  at: Date;

  @Prop({
    type: String,
    enum: ScanDecision,
    required: true,
  })
  decision: ScanDecision;

  @Prop({
    type: String,
    enum: DenialReason,
  })
  reason?: DenialReason;

  @Prop({ default: false })
  sent: boolean;
}

export type BufferedEntryDocument = BufferedEntry & Document;
export const BufferedEntrySchema = SchemaFactory.createForClass(BufferedEntry);
