import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';

describe('QR Code Flow Integration (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

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

  describe('Complete QR Code Lifecycle', () => {
    it('should handle complete flow: create -> consume -> revoke', async () => {
      // 1. Create QR Code (usando timezone Brasil)
      const createDto = {
        visitId: 'VIS-FLOW-001',
        visitName: 'Integration Test Visit',
        turnstileId: 'GATE-A', // Campo correto
        windowStart: new Date(Date.now() + 600000).toISOString(), // 10 min from now
        windowEnd: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        maxUses: 2,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/qrcodes')
        .send(createDto)
        .expect(201);

      const { jti, token } = createResponse.body;
      expect(jti).toBeDefined();
      expect(token).toBeDefined();

      // 2. First consumption - should succeed
      const consumeDto1 = {
        jti,
        gate: 'GATE-A',
        at: new Date(Date.now() + 900000).toISOString(), // 15 min from now (dentro da janela)
      };

      const consumeResponse1 = await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send(consumeDto1)
        .expect(200);

      expect(consumeResponse1.body).toEqual({
        ok: true,
        remaining: 1,
      });

      // 3. Second consumption - should succeed
      const consumeDto2 = {
        jti,
        gate: 'GATE-A',
        at: new Date(Date.now() + 1200000).toISOString(), // 20 min from now (dentro da janela)
      };

      const consumeResponse2 = await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send(consumeDto2)
        .expect(200);

      expect(consumeResponse2.body).toEqual({
        ok: true,
        remaining: 0,
      });

      // 4. Third consumption - should fail (max uses exceeded)
      const consumeDto3 = {
        jti,
        gate: 'GATE-A',
        at: new Date(Date.now() + 1500000).toISOString(), // 25 min from now (dentro da janela)
      };

      await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send(consumeDto3)
        .expect(409); // Conflict

      // 5. Revoke the pass
      await request(app.getHttpServer())
        .delete(`/qrcodes/${jti}`)
        .expect(200);

      // 6. Try to consume revoked pass - should fail
      await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send(consumeDto1)
        .expect(410); // Gone
    });

    it('should handle multiple QR codes independently', async () => {
      // Create first QR code
      const createDto1 = {
        visitId: 'VIS-MULTI-001',
        visitName: 'Multi Test 1',
        turnstileId: 'GATE-A', // Campo correto
        windowStart: new Date(Date.now() - 1800000).toISOString(),
        windowEnd: new Date(Date.now() + 3600000).toISOString(),
        maxUses: 1,
      };

      const response1 = await request(app.getHttpServer())
        .post('/qrcodes')
        .send(createDto1)
        .expect(201);

      // Create second QR code
      const createDto2 = {
        visitId: 'VIS-MULTI-002',
        visitName: 'Multi Test 2',
        turnstileId: 'GATE-B', // Campo correto
        windowStart: new Date(Date.now() - 1800000).toISOString(),
        windowEnd: new Date(Date.now() + 3600000).toISOString(),
        maxUses: 1,
      };

      const response2 = await request(app.getHttpServer())
        .post('/qrcodes')
        .send(createDto2)
        .expect(201);

      // Consume first QR code
      await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send({
          jti: response1.body.jti,
          gate: 'GATE-A',
          at: new Date().toISOString(),
        })
        .expect(200);

      // Consume second QR code
      await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send({
          jti: response2.body.jti,
          gate: 'GATE-B',
          at: new Date().toISOString(),
        })
        .expect(200);

      // Try to use first QR code again (should fail - max uses exceeded)
      await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send({
          jti: response1.body.jti,
          gate: 'GATE-A',
          at: new Date().toISOString(),
        })
        .expect(409);
    });

    it('should handle time window validation', async () => {
      // Create QR code with future window
      const futureStart = new Date(Date.now() + 3600000); // 1 hour from now
      const futureEnd = new Date(Date.now() + 7200000); // 2 hours from now

      const createDto = {
        visitId: 'VIS-TIME-001',
        visitName: 'Time Test',
        turnstileId: 'GATE-A', // Campo correto
        windowStart: futureStart.toISOString(),
        windowEnd: futureEnd.toISOString(),
        maxUses: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/qrcodes')
        .send(createDto)
        .expect(201);

      // Try to consume before window starts
      await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send({
          jti: response.body.jti,
          gate: 'GATE-A',
          at: new Date().toISOString(), // Current time (before window)
        })
        .expect(400);

      // Try to consume after window ends
      await request(app.getHttpServer())
        .post('/qrcodes/consume')
        .send({
          jti: response.body.jti,
          gate: 'GATE-A',
          at: new Date(Date.now() + 10800000).toISOString(), // 3 hours from now (after window)
        })
        .expect(400);
    });
  });
});