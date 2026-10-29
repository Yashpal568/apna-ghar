import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      try {
        const parsed = new URL(origin);
        if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        const isApnaGharWorker = parsed.protocol === 'https:' &&
          (parsed.hostname === 'apna-ghar-web.yash38688.workers.dev' ||
           parsed.hostname.startsWith('apna-ghar-web-') && parsed.hostname.endsWith('.yash38688.workers.dev'));
        if (isApnaGharWorker) return callback(null, true);
      } catch {
        // Reject malformed origins below.
      }
      return callback(new Error('Origin is not allowed by CORS'), false);
    },
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`Apna Ghar API listening on port ${port}`);
}
void bootstrap();
