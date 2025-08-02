import { SignJWT, jwtVerify } from 'jose';
import { createId } from 'uuidv7';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const secret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

export async function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
}

export async function generateRefreshToken(userId: string) {
  const tokenId = createId();
  
  return await new SignJWT({ userId, tokenId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as RefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

export function setAuthCookie(response: Response, accessToken: string, refreshToken?: string) {
  const headers = new Headers(response.headers);
  
  // Set access token cookie
  headers.append('Set-Cookie', `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/`);
  
  if (refreshToken) {
    headers.append('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`);
  }
  
  return new Response(response.body, { ...response, headers });
}

export function clearAuthCookie(response: Response) {
  const headers = new Headers(response.headers);
  
  headers.append('Set-Cookie', 'access_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
  headers.append('Set-Cookie', 'refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
  
  return new Response(response.body, { ...response, headers });
}