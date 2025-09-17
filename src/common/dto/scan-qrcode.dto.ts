import { IsString } from 'class-validator';

export class ScanQrcodeDto {
  @IsString()
  token: string;

  @IsString()
  gateId: string;
}
