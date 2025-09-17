import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException, ConflictException, GoneException } from '@nestjs/common';
import { ManagerQrcodeService } from './manager-qrcode.service';
import { Pass, PassStatus } from '../../common/schemas/pass.schema';
import { JwtService } from '../../common/services/jwt.service';

describe('ManagerQrcodeService', () => {
  let service: ManagerQrcodeService;
  let mockPassModel: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockPassModel = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      generateToken: jest.fn(),
    };

    const MockPassModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(data),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManagerQrcodeService,
        {
          provide: getModelToken(Pass.name),
          useValue: MockPassModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<ManagerQrcodeService>(ManagerQrcodeService);
    mockPassModel = module.get(getModelToken(Pass.name));
  });

  describe('createQrcode', () => {
    const validDto = {
      visitId: 'VIS-123',
      visitName: 'Test Visit',
      allowedBuilding: 'GATE-A',
      windowStart: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      windowEnd: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
      maxUses: 1,
    };

    it('should create a QR code successfully', async () => {
      mockJwtService.generateToken.mockReturnValue({
        token: 'mock-token',
        jti: 'mock-jti',
      });

      const result = await service.createQrcode(validDto);

      expect(result).toEqual({
        token: 'mock-token',
        jti: 'mock-jti',
        expiresAt: validDto.windowEnd,
      });
    });

    it('should throw BadRequestException if windowStart is in the past', async () => {
      const invalidDto = {
        ...validDto,
        windowStart: new Date(Date.now() - 4 * 3600000).toISOString(), // 4 hours ago (beyond the 3-hour offset)
      };

      // Mock não deve ser chamado pois a validação falha antes
      mockJwtService.generateToken.mockReturnValue({
        token: 'mock-token',
        jti: 'mock-jti',
      });

      await expect(service.createQrcode(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if windowEnd is before windowStart', async () => {
      const invalidDto = {
        ...validDto,
        windowEnd: validDto.windowStart,
      };

      // Mock não deve ser chamado pois a validação falha antes
      mockJwtService.generateToken.mockReturnValue({
        token: 'mock-token',
        jti: 'mock-jti',
      });

      await expect(service.createQrcode(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('consumeQrcode', () => {
    const mockPass = {
      jti: 'test-jti',
      allowedBuilding: 'GATE-A',
      windowStart: new Date(Date.now() - 3600000), // 1 hour ago
      windowEnd: new Date(Date.now() + 3600000), // 1 hour from now
      maxUses: 1,
      usedCount: 0,
      status: PassStatus.PENDING,
      save: jest.fn(),
    };

    const validConsumeDto = {
      jti: 'test-jti',
      gate: 'GATE-A',
      at: new Date().toISOString(),
    };

    beforeEach(() => {
      mockPassModel.findOne = jest.fn().mockResolvedValue(mockPass);
      mockPass.save = jest.fn().mockResolvedValue(mockPass);
    });

    it('should consume QR code successfully', async () => {
      const result = await service.consumeQrcode(validConsumeDto);

      expect(result).toEqual({
        ok: true,
        remaining: 0,
      });
      expect(mockPass.usedCount).toBe(1);
      expect(mockPass.status).toBe(PassStatus.ACTIVE);
    });

    it('should throw NotFoundException if pass not found', async () => {
      mockPassModel.findOne.mockResolvedValue(null);

      await expect(service.consumeQrcode(validConsumeDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if pass expired', async () => {
      const expiredPass = {
        ...mockPass,
        windowEnd: new Date(Date.now() - 3600000), // 1 hour ago
        usedCount: 0, // Reset used count to ensure it's not already used
        save: jest.fn().mockResolvedValue({}),
      };
      mockPassModel.findOne.mockResolvedValue(expiredPass);

      await expect(service.consumeQrcode(validConsumeDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw GoneException if pass revoked', async () => {
      const revokedPass = {
        ...mockPass,
        status: PassStatus.REVOKED,
      };
      mockPassModel.findOne.mockResolvedValue(revokedPass);

      await expect(service.consumeQrcode(validConsumeDto)).rejects.toThrow(GoneException);
    });

    it('should throw ConflictException if pass already used maximum times', async () => {
      const usedPass = {
        ...mockPass,
        usedCount: 1,
      };
      mockPassModel.findOne.mockResolvedValue(usedPass);

      await expect(service.consumeQrcode(validConsumeDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if gate not allowed', async () => {
      const freshMockPass = {
        ...mockPass,
        usedCount: 0, // Reset used count
      };
      mockPassModel.findOne.mockResolvedValue(freshMockPass);
      
      const invalidGateDto = {
        ...validConsumeDto,
        gate: 'GATE-B',
      };

      await expect(service.consumeQrcode(invalidGateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('revokeQrcode', () => {
    it('should revoke QR code successfully', async () => {
      const mockPass = {
        jti: 'test-jti',
        status: PassStatus.PENDING,
        save: jest.fn().mockResolvedValue({}),
      };
      
      mockPassModel.findOne = jest.fn().mockResolvedValue(mockPass);

      const result = await service.revokeQrcode('test-jti');

      expect(result).toEqual({ ok: true });
      expect(mockPass.status).toBe(PassStatus.REVOKED);
      expect(mockPass.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if pass not found', async () => {
      mockPassModel.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.revokeQrcode('non-existent-jti')).rejects.toThrow(NotFoundException);
    });
  });
});