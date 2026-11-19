import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

interface RateLimitRecord {
  count: number;
  resetTime: number; // Unix timestamp in ms
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { auth?: { userId?: string }; authUserId?: string }>();
    const res = http.getResponse<Response>();

    // Check handler or class-level metadata
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Default rate limit policy: 120 req / 60 sec if not explicitly annotated
    const limit = options?.limit ?? 120;
    const ttlSeconds = options?.ttlSeconds ?? 60;
    const ttlMs = ttlSeconds * 1000;

    const now = Date.now();
    this.cleanup(now);

    // Determine client identifier: prefer authenticated user ID, otherwise extract safe IP
    const clientKey = this.getClientKey(req);
    const key = `${req.method}:${context.getClass().name}:${context.getHandler().name}:${clientKey}`;

    const record = this.store.get(key);
    if (!record || now >= record.resetTime) {
      const resetTime = now + ttlMs;
      this.store.set(key, { count: 1, resetTime });
      this.setHeaders(res, limit, limit - 1, resetTime);
      return true;
    }

    if (record.count < limit) {
      record.count += 1;
      this.setHeaders(res, limit, limit - record.count, record.resetTime);
      return true;
    }

    // Rate limit exceeded
    const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    this.setHeaders(res, limit, 0, record.resetTime, retryAfter);

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: `Too many requests. Please try again in ${retryAfter} second${retryAfter === 1 ? '' : 's'}.`,
        error: 'Too Many Requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private getClientKey(req: Request & { auth?: { userId?: string }; authUserId?: string }): string {
    const userId = req.auth?.userId || req.authUserId;
    if (userId) {
      return `user:${userId}`;
    }

    // Client IP extraction safe from spoofing when trust proxy is enabled
    const cfIp = req.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp.trim()) {
      return `ip:${cfIp.trim()}`;
    }

    // Use Express req.ip (populated via trust proxy) or remoteAddress
    const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    return `ip:${ip}`;
  }

  private setHeaders(
    res: Response,
    limit: number,
    remaining: number,
    resetTime: number,
    retryAfter?: number,
  ): void {
    if (!res || typeof res.setHeader !== 'function') return;
    try {
      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
      if (retryAfter !== undefined) {
        res.setHeader('Retry-After', String(retryAfter));
      }
    } catch {
      // In case headers are already sent
    }
  }

  private cleanup(now: Date | number): void {
    const current = typeof now === 'number' ? now : now.getTime();
    if (current - this.lastCleanup < 60_000) return;
    this.lastCleanup = current;
    for (const [key, value] of this.store.entries()) {
      if (current >= value.resetTime) {
        this.store.delete(key);
      }
    }
  }

  reset(): void {
    this.store.clear();
  }
}
