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
      // Requests without an Origin header (health checks and server-to-server calls) are allowed.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      try {
        const parsed = new URL(origin);
        // Vercel creates a unique preview hostname per deployment. Only HTTPS Vercel
        // deployments are accepted here; custom production domains stay explicitly configured.
        if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch {
        // Reject malformed origins below.
      }
      return callback(new Error('Origin is not allowed by CORS'), false);
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Render and other managed hosts provide PORT; API_PORT is the local fallback.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`Apna Ghar API listening on port ${port}`);
}
void bootstrap();
