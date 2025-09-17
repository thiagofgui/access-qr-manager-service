import { Test, TestingModule } from '@nestjs/testing';
import { ManagerQrcodeController } from './manager-qrcode.controller';
import { ManagerQrcodeService } from './manager-qrcode.service';

describe('ManagerQrcodeController', () => {
  let controller: ManagerQrcodeController;
  let service: ManagerQrcodeService;

  const mockManagerQrcodeService = {
    createQrcode: jest.fn(),
    consumeQrcode: jest.fn(),
    revokeQrcode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ManagerQrcodeController],
      providers: [
        {
          provide: ManagerQrcodeService,
          useValue: mockManagerQrcodeService,
        },
      ],
    }).compile();

    controller = module.get<ManagerQrcodeController>(ManagerQrcodeController);
    service = module.get<ManagerQrcodeService>(ManagerQrcodeService);
  });

  describe('createQrcode', () => {
    it('should create a QR code', async () => {
      const createDto = {
        visitId: 'VIS-123',
        visitName: 'Test Visit',
        allowedBuilding: 'GATE-A',
        windowStart: '2025-01-01T10:00:00Z',
        windowEnd: '2025-01-01T18:00:00Z',
        maxUses: 1,
      };

      const expectedResult = {
        token: 'mock-token',
        jti: 'mock-jti',
        expiresAt: '2025-01-01T18:00:00Z',
      };

      mockManagerQrcodeService.createQrcode.mockResolvedValue(expectedResult);

      const result = await controller.createQrcode(createDto);

      expect(service.createQrcode).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('consumeQrcode', () => {
    it('should consume a QR code', async () => {
      const consumeDto = {
        jti: 'test-jti',
        gate: 'GATE-A',
        at: '2025-01-01T12:00:00Z',
      };

      const expectedResult = {
        ok: true,
        remaining: 0,
      };

      mockManagerQrcodeService.consumeQrcode.mockResolvedValue(expectedResult);

      const result = await controller.consumeQrcode(consumeDto);

      expect(service.consumeQrcode).toHaveBeenCalledWith(consumeDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('revokeQrcode', () => {
    it('should revoke a QR code', async () => {
      const jti = 'test-jti';
      const expectedResult = { ok: true };

      mockManagerQrcodeService.revokeQrcode.mockResolvedValue(expectedResult);

      const result = await controller.revokeQrcode(jti);

      expect(service.revokeQrcode).toHaveBeenCalledWith(jti);
      expect(result).toEqual(expectedResult);
    });
  });
});