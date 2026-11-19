import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class PrivateCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { auth?: { userId?: string }; authUserId?: string }>();
    const res = http.getResponse<Response>();

    const url = req.originalUrl || req.url || '';
    const isPrivateEndpoint =
      Boolean(req.headers.authorization) ||
      Boolean(req.auth?.userId) ||
      Boolean(req.authUserId) ||
      url.includes('/conversations') ||
      url.includes('/saved-properties') ||
      url.includes('/properties/mine') ||
      url.includes('/users/me') ||
      url.includes('/admin');

    if (isPrivateEndpoint && res && typeof res.setHeader === 'function') {
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    return next.handle();
  }
}
