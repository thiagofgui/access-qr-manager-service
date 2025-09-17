import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum PassStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true })
export class Pass {
  @Prop({ required: true, unique: true })
  jti: string;

  @Prop({ required: true })
  visitId: string;

  @Prop({ required: true })
  visitName: string;

  @Prop({ required: true })
  allowedBuilding: string;

  @Prop({ required: true })
  windowStart: Date;

  @Prop({ required: true })
  windowEnd: Date;

  @Prop({ required: true, default: 1 })
  maxUses: number;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({
    type: String,
    enum: PassStatus,
    default: PassStatus.PENDING,
  })
  status: PassStatus;
}

export type PassDocument = Pass & Document;
export const PassSchema = SchemaFactory.createForClass(Pass);
