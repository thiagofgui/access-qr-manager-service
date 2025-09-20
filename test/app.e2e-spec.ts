import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';

describe('QR Manager API (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let createdJti: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Override environment variables for testing
    process.env.MONGODB_URI = mongoUri;
    process.env.JWT_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAcNVnrNp8iiQX
/6hpl9kCZ/K80yAVAqT6e6J+sInWao6XRpzhIAqt38AAHQcZuYP/njxdA7JQF5tf
dxyUA/FzVicMX/MIhWih+GdAuvvVzgxrS3nQNUJy1SQ7OOBGuDXS/YjdZThB0w6I
HNtXdzHxttVAPR7EZY9SqP0UiDaQPT6P8NMTWRciNua88NnMd3c6KKRNNatEswWX
qZj7gGGSzC6OfxQV0GUpFl9d51tDUvOiukKCRt7ZHK62pgzJc2g7PVRw74jass2/
foB6qmvyXFxTqmpjnYhsDPPXhkjsQ66tk+sL6GUr5Vvrx1W3U4+4anMHFAjkT9PD
6GOxjdEfAgMBAAECggEAQVfOzpY91d3eJZv0pm4eDJgZLw6NLTUpqbfDVDtDgl/K
LQmYCUUk+ycnfaJdn9mDPY+QNZEkwddSNZcvR/8SxDPzrFsEHdeW0LCU9sDG9DEz
vFbzdMQw3OcMl2NXnAu+kvbtuyc8c/VjUMpjnA5oEggf3uEiClPl145z6L3bsRvT
xc63ctjG66czF8BXtaXrV7XEnk5uUeQ9VUulUOPpjyQkMz4qpzAl6QVrN3mvurRF
isZDFLfm+NX7s0AxhBEwEux+MyG9TGA9ld7OUxi5ubRkQRp1LHxD2FPDj1fcXT4t
Jxb7JEh1Ig/xDbTMFNKaHjZjipEE8JREAPWawrpQCQKBgQDmRYXV9ZYG3jsKrKJ1
JMUmv1jLY5k2LJ/kFZTc96JtNwTN/2zEjgXc/exM1JoOZx3g8Wr59WFQlVtR03M1
Y1074WslseAsppnNZWmX3X0AGvl5q3FYX4sQ5zg/MPcv5QcdR0SrKO8GjcYYMxAg
MN5rs0QOHVJ9mJEoUDX3i5FZVQKBgQDV8TuWyug2fRawpd2XK2Y88zlETVnRkk99
ehviB6YzXZyFRoLbLJnGy3hAVdKGx1bD/iXKNoNKoqE/svC1C20tSApssEQ3ZpJB
MvOr0OwRlkWbpfiwv+rAQ4bb48deFgNai5HYDEFbdaZj1VzNEpqQad+ueHsEs/I/
TLPi/jowowKBgDN9DCYBWeCDRHRokZLb+/FkC7i+tn10kPPxF24pOPpuuPZOzMVO
dGUrqfCsAR6DVBz+Hktx4KaiHt83BqXDaA+BofG1ykhxoCZbLLc2YULqxSm9egSm
qHPJH7yReFQPQ/3595LF/lxayxaSJGLuSm2OkgMN72oB+UMoXEjTvlZZAoGBAKcH
ZXx/Afi4hGR5upzxNyrSwZz/vuYNkp3mHarESg/EQBUVTciL86ru4/1mg6zSKH1w
CFTtZmd4vOecbq0KNLyrh+f/XeLa48ifXPqBbCz243V3iMeFrmNY1QsLtHVSPmAM
o1rHhqc/HR7IT2GT6rRg1E/EpFaxnqmo2rCXxxp9AoGARnqzK+t4fPEviAC2mSY9
WU6Q4WLOgjXHOUQ/qg+ITmpQhGDceUQoKsPOpvcmq1bMBpWMEVCvKEfVUqVFSOF5
oiH3akITl63S6NZlF+DYOeTjWwcx5sFHeWiCViQuWjKJJpwOpXscUapPBPWH7zui
tdfyo/HNvA8CSYuLc+Y4piU=
-----END PRIVATE KEY-----`;
    process.env.JWT_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwHDVZ6zafIokF/+oaZfZ
AmfyvNMgFQKk+nuifrCJ1mqOl0ac4SAKrd/AAB0HGbmD/548XQOyUBebX3cclAPx
c1YnDF/zCIVoofhnQLr71c4Ma0t50DVCctUkOzjgRrg10v2I3WU4QdMOiBzbV3cx
8bbVQD0exGWPUqj9FIg2kD0+j/DTE1kXIjbmvPDZzHd3OiikTTWrRLMFl6mY+4Bh
kswujn8UFdBlKRZfXedbQ1LzorpCgkbe2RyutqYMyXNoOz1UcO+I2rLNv36Aeqpr
8lxcU6pqY52IbAzz14ZI7EOurZPrC+hlK+Vb68dVt1OPuGpzBxQI5E/Tw+hjsY3R
HwIDAQAB
-----END PUBLIC KEY-----`;
    process.env.JWT_KEY_ID = 'test-key';
    process.env.JWT_ISSUER = 'test-issuer';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('/qrcodes (POST)', () => {
    it('should create a QR code successfully', async () => {
      const createDto = {
        visitId: 'VIS-123',
        visitName: 'Test Visit',
        turnstileId: 'GATE-A', // Campo correto
        windowStart: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        windowEnd: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
        maxUses: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/qrcodes')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('jti');
      expect(response.body).toHaveProperty('expiresAt');
      
      createdJti = response.body.jti;
    });

    it('should return 400 for invalid windowStart', async () => {
      const invalidDto = {
        visitId: 'VIS-123',
        visitName: 'Test Visit',
        turnstileId: 'GATE-A', // Campo correto
        windowStart: new Date(Date.now() - 4 * 3600000).toISOString(), // 4 hours ago (beyond the 3-hour offset)
        windowEnd: new Date(Date.now() + 3600000).toISOString(),
        maxUses: 1,
      };

      await request(app.getHttpServer())
        .post('/qrcodes')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidDto = {
        visitName: 'Test Visit',
        // Missing visitId, allowedBuilding, etc.
      };

      await request(app.getHttpServer())
        .post('/qrcodes')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/qrcodes/consume (POST)', () => {
    beforeEach(async () => {
      // Create a fresh QR code for each test
      const createDto = {
        visitId: 'VIS-CONSUME',
        visitName: 'Consume Test',
        turnstileId: 'GATE-A', // Campo correto
        windowStart: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        windowEnd: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        maxUses: 2,
      };

      const response = await request(app.getHttpServer())
        .post('/qrcodes')
        .send(createDto);
      
      createdJti = response.body.jti;
    });

    it('should consume QR code successfully', async () => {
      const consumeDto = {
        jti: createdJti,
        gate: 'GATE-A',
        at: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send(consumeDto)
        .expect(200);

      expect(response.body).toEqual({
        ok: true,
        remaining: 1,
      });
    });

    it('should return 404 for non-existent JTI', async () => {
      const consumeDto = {
        jti: '00000000-0000-0000-0000-000000000000',
        gate: 'GATE-A',
        at: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send(consumeDto)
        .expect(404);
    });

    it('should return 400 for wrong gate', async () => {
      const consumeDto = {
        jti: createdJti,
        gate: 'GATE-B', // Wrong gate
        at: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send(consumeDto)
        .expect(400);
    });
  });

  describe('/qrcodes/:jti (DELETE)', () => {
    beforeEach(async () => {
      // Create a fresh QR code for each test
      const createDto = {
        visitId: 'VIS-REVOKE',
        visitName: 'Revoke Test',
        turnstileId: 'GATE-A', // Campo correto
        windowStart: new Date(Date.now() + 1800000).toISOString(),
        windowEnd: new Date(Date.now() + 3600000).toISOString(),
        maxUses: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/qrcodes')
        .send(createDto);
      
      createdJti = response.body.jti;
    });

    it('should revoke QR code successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/qrcodes/${createdJti}`)
        .expect(200);

      expect(response.body).toEqual({ ok: true });
    });

    it('should return 404 for non-existent JTI', async () => {
      await request(app.getHttpServer())
        .delete('/qrcodes/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should return 410 when trying to consume revoked pass', async () => {
      // First revoke the pass
      await request(app.getHttpServer())
        .delete(`/qrcodes/${createdJti}`)
        .expect(200);

      // Then try to consume it
      const consumeDto = {
        jti: createdJti,
        gate: 'GATE-A',
        at: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send(consumeDto)
        .expect(410);
    });
  });
});
