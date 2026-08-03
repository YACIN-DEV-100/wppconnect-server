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
import { Request, Response } from 'express';

import { config as configEnv } from '../config/env';
import { setCookie } from '../util/auth/cookie/setCookie';
import { signToken, verifyToken } from '../util/auth/jwt-helper';
import { safeCompare } from '../util/security/safe-compare';

export async function generateToken(req: Request, res: Response) {
  /**
   * #swagger.tags = ['Auth']
   * #swagger.parameters['secretkey'] = {
       schema: 'THISISMYSECURETOKEN',
     }
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.autoHeaders = false
   */
  const { session, secretkey } = req.params;
  const { authorization } = req.headers;
  let tokenInput = '';

  if (secretkey) {
    tokenInput = secretkey;
  } else {
    tokenInput = (authorization ?? '').split(' ')[1];
  }

  if (!session) {
    return res.status(400).json({
      message: 'Session requise',
    });
  }

  if (
    typeof tokenInput !== 'string' ||
    !safeCompare(tokenInput, configEnv.secretKey)
  ) {
    return res.status(400).json({
      response: false,
      message: 'The SECRET_KEY is incorrect',
    });
  }
  const payload = { session };

  const token = signToken(payload, 'access');
  const refreshToken = signToken(payload, 'refresh');

  setCookie(res, 'w-access-token', token);
  setCookie(res, 'w-refresh-token', refreshToken);

  return res.status(201).json({
    status: 'success',
    session,
    token,
    full: session + token,
  });
}

export function refreshAccessToken(req: Request, res: Response) {
  const refreshToken =
    req.cookies?.['w-refresh-token'] || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: 'Refresh token required',
    });
  }

  try {
    const decoded = verifyToken<{ session: string }>(refreshToken, 'refresh');

    const newAccessToken = signToken({ session: decoded.session }, 'access');
    const newRefreshToken = signToken({ session: decoded.session }, 'refresh');

    setCookie(res, 'w-access-token', newAccessToken);
    setCookie(res, 'w-refresh-token', newRefreshToken);

    return res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired refresh token',
    });
  }
}
