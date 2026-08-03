import jwt, { JwtPayload } from 'jsonwebtoken';

import { config } from '../../config/env';

type SecretType = 'access' | 'refresh';

function getSecret(type: SecretType): string {
  return type === 'access' ? config.accessSecret : config.refreshSecret;
}

export const signToken = (payload: JwtPayload, type: SecretType): string => {
  const expiresIn = type === 'access' ? '15m' : '7d';
  return jwt.sign(payload, getSecret(type), { expiresIn });
};

export const verifyToken = <T extends JwtPayload = JwtPayload>(
  token: string,
  type: SecretType
): T => {
  return jwt.verify(token, getSecret(type)) as T;
};
