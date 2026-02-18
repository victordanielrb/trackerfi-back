import jwt from 'jsonwebtoken';
import type { Secret } from 'jsonwebtoken';

// JWT_SECRET is validated on startup via envValidation.ts
const JWT_SECRET: string = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return 'dev-only-insecure-jwt-secret-do-not-use-in-production';
})();

export interface JWTPayload {
  userId: string;
  username: string;
  email?: string;
  twitter_username?: string;
}

export const generateToken = (payload: JWTPayload) => {
  return jwt.sign({
    data: payload
  }, JWT_SECRET as Secret, { expiresIn: "7d", issuer: 'trackerfi-api', audience: 'trackerfi-users' });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'trackerfi-api',
      audience: 'trackerfi-users',
    }) as any;

    return decoded.data as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.decode(token) as any;
    return decoded?.data as JWTPayload;
  } catch (error) {
    console.error('JWT decode failed:', error);
    return null;
  }
};

export const refreshToken = (token: string): string | null => {
  const payload = verifyToken(token);
  if (!payload) return null;

  const { userId, username, email, twitter_username } = payload;
  return generateToken({ userId, username, email, twitter_username });
};
