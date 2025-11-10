import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { UserNotAuthenticatedError } from '../api/errors';
import { randomBytes } from 'crypto';

export const ACCESS_TOKEN_ISSUER = 'bas-bots-access';
export async function hashPassword(password: string) {
  return await Bun.password.hash(password, {
    algorithm: 'argon2id',
  });
}

export async function checkPasswordHash(password: string, hash: string) {
  if (!password) return false;
  try {
    return await Bun.password.verify(password, hash);
  } catch {
    return false;
  }
}

type Payload = Pick<JwtPayload, 'iss' | 'sub' | 'iat' | 'exp'>;

export function makeJWT(userID: string, secret: string, expiresIn: number) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + expiresIn;
  const payload: Payload = {
    iss: ACCESS_TOKEN_ISSUER,
    sub: userID,
    iat: issuedAt,
    exp: expiresAt,
  };
  const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
  return token;
}

export function validateJWT(tokenString: string, tokenSecretString: string) {
  let decoded: Payload;
  try {
    decoded = jwt.verify(tokenString, tokenSecretString) as JwtPayload;
  } catch (err) {
    throw new UserNotAuthenticatedError('Invalid token.');
  }

  if (decoded.iss !== ACCESS_TOKEN_ISSUER) {
    throw new UserNotAuthenticatedError('Invalid token issuer');
  }

  const userID = decoded.sub;
  if (!decoded.sub) {
    throw new UserNotAuthenticatedError('Missing token subject');
  }
  return userID;
}

export function getBearerToken(headers: Headers) {
  const authHeader = headers.get('Authorization');
  if (!authHeader) {
    throw new UserNotAuthenticatedError('Missing Authorization header');
  }
  const split = authHeader.split(' ');
  if (split.length < 2 || split[0] !== 'Bearer') {
    throw new UserNotAuthenticatedError('Invalid Authorization header');
  }
  return split[1];
}

export function makeRefreshToken() {
  const buf = randomBytes(32);
  return buf.toString('hex');
}
