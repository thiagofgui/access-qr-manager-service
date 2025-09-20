import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { env } from '../../config/env';

export interface TurnstileInfo {
  id: string;
  name: string;
  tenant: string;
  isActive: boolean;
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  async getTurnstilesByTenant(tenant: string): Promise<TurnstileInfo[]> {
    try {
      const response = await axios.get(`${env.TURNSTILE_SERVICE_URL}/turnstiles`, {
        params: { tenant },
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch turnstiles for tenant ${tenant}:`, error);
      throw new Error('Failed to fetch turnstiles');
    }
  }

  async validateTurnstile(turnstileId: string): Promise<boolean> {
    try {
      const response = await axios.get(`${env.TURNSTILE_SERVICE_URL}/turnstiles/${turnstileId}`, {
        timeout: 5000,
      });
      return response.data?.isActive || false;
    } catch (error) {
      this.logger.warn(`Turnstile ${turnstileId} validation failed:`, error);
      return false;
    }
  }
}