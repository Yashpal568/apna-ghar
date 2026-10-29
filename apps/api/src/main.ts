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
  const vercelProductionOrigins = new Set([
    'https://web-dun-two-91.vercel.app',
    'https://web-yashs-projects-cd385495.vercel.app',
    'https://web-git-main-yashs-projects-cd385495.vercel.app',
  ]);
  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser/server-to-server calls and explicitly configured origins.
      if (!origin || allowedOrigins.includes(origin) || vercelProductionOrigins.has(origin)) {
        return callback(null, true);
      }
      try {
        const parsed = new URL(origin);
        // Permit this project's Vercel preview deployments without opening CORS to every Vercel app.
        if (
          parsed.protocol === 'https:' &&
          /^web-[a-z0-9-]+-yashs-projects-cd385495\\.vercel\\.app$/.test(parsed.hostname)
        ) {
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
