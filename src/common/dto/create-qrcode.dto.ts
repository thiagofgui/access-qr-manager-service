import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
  Length,
} from 'class-validator';

export class CreateQrcodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  visitId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  visitName: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  allowedBuilding: string;

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
