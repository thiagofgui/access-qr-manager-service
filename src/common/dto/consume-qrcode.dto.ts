import { IsString, IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class ConsumeQrcodeDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  jti: string;

  @IsString()
  @IsNotEmpty()
  gate: string;

  @IsDateString()
  at: string;
}
