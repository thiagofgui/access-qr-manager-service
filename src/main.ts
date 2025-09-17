import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar validação global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Habilitar CORS para demonstração
  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Serviço rodando na porta ${port}`);
  console.log(`📱 QR Manager: http://localhost:${port}/qrcodes`);
  console.log(`🚪 Turnstile: http://localhost:${port}/turnstile`);
}
bootstrap();
