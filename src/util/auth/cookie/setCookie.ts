import { Response } from 'express';

import { config } from '../../../config/env';

export const setCookie = (res: Response, name: string, value: string) => {
  const isProd = config.nodeEnv === 'production';
  res.cookie(name, value, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge:
      name === 'w-access-token' ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
    domain: isProd ? config.cookieDomain : undefined,
    path: '/',
  });
};

export const clearAuthCookies = (res: Response) => {
  const isProd = config.nodeEnv === 'production';

  res.clearCookie('w-access-token', {
    path: '/',
    domain: isProd ? config.cookieDomain : undefined,
  });

  res.clearCookie('w-refresh-token', {
    path: '/',
    domain: isProd ? config.cookieDomain : undefined,
  });
};
