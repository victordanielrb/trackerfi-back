import jwt from 'jsonwebtoken';
import { UserType } from '../../interfaces/user';

import type { Secret } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h'; // fallback to '1h' if not set

export interface JWTPayload {
  userId: string;
  userType: UserType;
  username: string;
  email?: string; // For host users
  twitter_username?: string; // For creator users
}

const secret = process.env.JWT_SECRET as Secret;
export const generateToken = (payload: JWTPayload) => {

  return jwt.sign({
    data: payload
  }, secret, { expiresIn: "7d", issuer: 'bounties-api', audience: 'bounties-users' });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'bounties-api',
      audience: 'bounties-users',
    }) as any;
    
    // Extract the data property from the JWT payload
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
  
  // Remove exp, iat, iss, aud from payload before regenerating
  const { userId, userType, username, email, twitter_username } = payload;
  return generateToken({ userId, userType, username, email, twitter_username });
};