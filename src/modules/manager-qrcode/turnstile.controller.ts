import { Controller, Get, Query } from '@nestjs/common';
import { TurnstileService } from '../../common/services/turnstile.service';

@Controller('turnstiles')
export class TurnstileController {
  constructor(private readonly turnstileService: TurnstileService) {}

  @Get()
  async getTurnstilesByTenant(@Query('tenant') tenant: string) {
    return await this.turnstileService.getTurnstilesByTenant(tenant);
  }
}