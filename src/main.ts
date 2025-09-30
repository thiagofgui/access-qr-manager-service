import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

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

  // Habilitar filtro de exceções global
  app.useGlobalFilters(new HttpExceptionFilter());

  // Habilitar CORS para demonstração
  app.enableCors();

  const port = process.env.PORT ?? 8000;
  await app.listen(port);

  console.log(`🚀 Access QR Manager Service rodando na porta ${port}`);
  console.log(`📱 API Endpoints: http://localhost:${port}/qrcodes`);
}
bootstrap();
