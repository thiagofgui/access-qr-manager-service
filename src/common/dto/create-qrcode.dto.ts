import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateQrcodeDto {
  @IsString()
  visitId: string;

  @IsString()
  visitName: string;

  @IsString()
  allowedBuilding: string; // Single building only

  @IsDateString()
  windowStart: string;

  @IsDateString()
  windowEnd: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxUses?: number = 1;
}
