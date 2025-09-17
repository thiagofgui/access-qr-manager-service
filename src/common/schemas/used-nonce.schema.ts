import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UsedNonce {
  @Prop({ required: true, unique: true })
  jti: string;

  @Prop({ default: Date.now })
  firstSeenAt: Date;
}

export type UsedNonceDocument = UsedNonce & Document;
export const UsedNonceSchema = SchemaFactory.createForClass(UsedNonce);
