import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextMiddleware } from './request-context.middleware';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const defaultLang = this.configService.get<string>('app.defaultLanguage') || 'en';
    const langHeader = req.headers['x-language'] as string;
    const resolvedLang = langHeader === 'ur' || langHeader === 'en' ? langHeader : defaultLang;

    RequestContextMiddleware.setLanguage(resolvedLang);
    next();
  }
}
