import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// Mock environment variables
jest.mock('../../config/env', () => ({
  env: {
    JWT_PRIVATE_KEY_PEM: 'mock-private-key',
    JWT_PUBLIC_KEY_PEM: 'mock-public-key',
    JWT_KEY_ID: 'test-key-id',
    JWT_ISSUER: 'test-issuer',
  },
}));

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(() => {
    service = new JwtService();
  });

  describe('generateToken', () => {
    const validInput = {
      visitId: 'VIS-123',
      visitName: 'Test Visit',
      allowedBuilding: 'GATE-A',
      windowStart: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      windowEnd: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
      maxUses: 1,
    };

    beforeEach(() => {
      mockJwt.sign.mockReturnValue('mock-jwt-token');
    });

    it('should generate a valid JWT token', () => {
      const result = service.generateToken(validInput);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('jti');
      expect(typeof result.token).toBe('string');
      expect(typeof result.jti).toBe('string');
      expect(mockJwt.sign).toHaveBeenCalled();
    });

    it('should throw error for invalid time window', () => {
      const invalidInput = {
        ...validInput,
        windowEnd: validInput.windowStart, // Same as start
      };

      expect(() => service.generateToken(invalidInput)).toThrow('Invalid time window');
    });

    it('should use default maxUses when not provided', () => {
      const inputWithoutMaxUses = {
        visitId: 'VIS-123',
        visitName: 'Test Visit',
        allowedBuilding: 'GATE-A',
        windowStart: new Date(Date.now() + 3600000).toISOString(),
        windowEnd: new Date(Date.now() + 7200000).toISOString(),
      };

      const result = service.generateToken(inputWithoutMaxUses);
      expect(result).toHaveProperty('token');
      expect(mockJwt.sign).toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const mockPayload = {
        sub: 'VIS-123',
        name: 'Test Visit',
        gate: 'GATE-A',
        max: 1,
        jti: 'test-jti',
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iss: 'test-issuer',
        iat: Math.floor(Date.now() / 1000),
      };

      mockJwt.verify.mockReturnValue(mockPayload as any);

      const result = service.verifyToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.sub).toBe('VIS-123');
      expect(result.payload?.name).toBe('Test Visit');
      expect(result.payload?.gate).toBe('GATE-A');
    });

    it('should reject invalid token', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      const result = service.verifyToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject token with wrong signature', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid signature');
      });

      const result = service.verifyToken('wrong-signature-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});