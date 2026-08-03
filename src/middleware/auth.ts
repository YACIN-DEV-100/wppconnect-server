/*
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { NextFunction, Request, Response } from 'express';

import { config as configEnv } from '../config/env';
import { verifyToken } from '../util/auth/jwt-helper';
import { safeCompare } from '../util/security/safe-compare';
import { clientsArray } from '../util/sessionUtil';

export const verifyAccessMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const secretKey = configEnv.secretKey;

    // 1. Backend-à-backend : clé de service partagée.
    const serviceKey = req.headers['x-api-key'];

    if (typeof serviceKey === 'string' && safeCompare(serviceKey, secretKey)) {
      const sessionHeader = req.headers['x-session'];
      let sessionFromHeader: string;

      if (Array.isArray(sessionHeader)) {
        sessionFromHeader = sessionHeader[0];
      } else if (typeof sessionHeader === 'string') {
        sessionFromHeader = sessionHeader;
      } else {
        return res.status(400).json({ message: 'Header x-session manquant' });
      }

      req.session = sessionFromHeader;
      req.token = serviceKey;
      req.client = clientsArray[sessionFromHeader];
      return next();
    }

    // 2. Frontend : JWT (cookie httpOnly ou Authorization: Bearer).
    const token =
      req.cookies?.['w-access-token'] ||
      req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Token manquant',
      });
    }

    const decoded = verifyToken<{ session: string }>(token, 'access');

    req.session = decoded.session;
    req.token = token;
    req.client = clientsArray[req.session];

    return next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expiré',
      });
    }

    return res.status(401).json({
      message: 'Token invalide',
    });
  }
};

export default verifyAccessMiddleware;
