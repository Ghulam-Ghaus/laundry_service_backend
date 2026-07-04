import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  requestId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  language: string;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  static readonly storage = new AsyncLocalStorage<RequestContextStore>();

  static getStore(): RequestContextStore | undefined {
    return this.storage.getStore();
  }

  static getRequestId(): string {
    return this.getStore()?.requestId || '';
  }

  static getUserId(): string | undefined {
    return this.getStore()?.userId;
  }

  static setUserId(userId: string): void {
    const store = this.getStore();
    if (store) {
      store.userId = userId;
    }
  }

  static getLanguage(): string {
    return this.getStore()?.language || 'en';
  }

  static setLanguage(lang: string): void {
    const store = this.getStore();
    if (store) {
      store.language = lang;
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || `req_${Math.random().toString(36).substring(2, 11)}`;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const language = (req.headers['x-language'] as string) || 'en';

    // Attach request ID to response headers for tracking
    res.setHeader('x-request-id', requestId);

    const store: RequestContextStore = {
      requestId,
      ipAddress,
      userAgent,
      language,
    };

    RequestContextMiddleware.storage.run(store, () => {
      next();
    });
  }
}
