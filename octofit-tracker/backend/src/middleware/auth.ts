import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function getJwtSecret(): string | undefined {
  const secret = process.env.JWT_SECRET;
  return secret && secret.length >= 32 ? secret : undefined;
}

export function issueToken(userId: string, secret: string): string {
  return jwt.sign({}, secret, { subject: userId, expiresIn: '8h' });
}

export const requireAuth: RequestHandler = (request, response, next) => {
  const secret = getJwtSecret();
  if (!secret) {
    response.status(503).json({ error: 'Configure JWT_SECRET with at least 32 characters' });
    return;
  }

  const authorization = request.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  if (!token) {
    response.status(401).json({ error: 'Bearer token required' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      response.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    request.userId = payload.sub;
    next();
  } catch {
    response.status(401).json({ error: 'Invalid or expired token' });
  }
};