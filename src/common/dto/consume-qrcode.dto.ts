import { IsString, IsDateString } from 'class-validator';

export class ConsumeQrcodeDto {
  @IsString()
  jti: string;

  @IsString()
  gateId: string;

  @IsDateString()
  at: string;
}
