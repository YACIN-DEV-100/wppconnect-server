import { NextFunction, Request, Response } from 'express';

import { config } from '../config/env';
import { safeCompare } from '../util/security/safe-compare';

export default function verifyInternalKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const internalKey = req.headers['x-internal-key'];

  if (
    typeof internalKey !== 'string' ||
    !safeCompare(internalKey, config.internalKey)
  ) {
    return res.status(401).json({ success: false, message: 'Non autorisé' });
  }

  return next();
}
