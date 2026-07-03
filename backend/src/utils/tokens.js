import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { redis } from '../config/redis.js';

const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL_SECONDS = parseInt(process.env.JWT_REFRESH_TTL_SECONDS || '2592000', 10); // 30 days

function refreshKey(userId, jti) {
  return `refresh:${userId}:${jti}`;
}

export function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export async function issueRefreshToken(user) {
  const jti = randomUUID();
  const token = jwt.sign({ sub: user._id.toString(), jti }, process.env.JWT_SECRET, {
    expiresIn: REFRESH_TTL_SECONDS,
  });

  await redis.set(refreshKey(user._id.toString(), jti), '1', 'EX', REFRESH_TTL_SECONDS);

  return token;
}

export async function verifyRefreshToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const exists = await redis.get(refreshKey(payload.sub, payload.jti));

  if (!exists) {
    throw new Error('Refresh token has been revoked');
  }

  return payload;
}

export async function revokeRefreshToken(token) {
  try {
    const payload = jwt.decode(token);
    if (payload?.sub && payload?.jti) {
      await redis.del(refreshKey(payload.sub, payload.jti));
    }
  } catch {
    // token already invalid/expired — nothing to revoke
  }
}
