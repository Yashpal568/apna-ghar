import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  // Do not advertise the underlying Express runtime and apply baseline browser protections.
  const express = app.getHttpAdapter().getInstance();
  express.disable('x-powered-by');
  app.use((_request: unknown, response: { setHeader: (name: string, value: string) => void }, next: () => void) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (process.env.NODE_ENV === 'production') {
      response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const vercelProductionOrigins = new Set([
    'https://web-dun-two-91.vercel.app',
    'https://web-yashs-projects-cd385495.vercel.app',
    'https://web-git-main-yashs-projects-cd385495.vercel.app',
    'https://apna-ghar-web.yash38688.workers.dev',
  ]);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || vercelProductionOrigins.has(origin)) {
        return callback(null, true);
      }
      try {
        const parsed = new URL(origin);
        if (
          (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
          (parsed.hostname === 'localhost' ||
            parsed.hostname === '127.0.0.1' ||
            /^web-[a-z0-9-]+-yashs-projects-cd385495\.vercel\.app$/.test(parsed.hostname) ||
            /^apna-ghar-web(?:-[a-z0-9-]+)?\.yash38688\.workers\.dev$/.test(parsed.hostname) ||
            parsed.hostname.endsWith('.workers.dev') ||
            parsed.hostname.endsWith('.vercel.app'))
        ) {
          return callback(null, true);
        }
      } catch {
        // Reject below
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`Apna Ghar API listening on port ${port}`);
}
void bootstrap();
