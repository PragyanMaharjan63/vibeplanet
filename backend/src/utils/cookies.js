const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

const REFRESH_TTL_SECONDS = parseInt(process.env.JWT_REFRESH_TTL_SECONDS || '2592000', 10);

function baseOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
  };
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseOptions(),
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseOptions(),
    maxAge: REFRESH_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, baseOptions());
  res.clearCookie(REFRESH_COOKIE, baseOptions());
}

export function getAccessCookie(req) {
  return req.cookies?.[ACCESS_COOKIE];
}

export function getRefreshCookie(req) {
  return req.cookies?.[REFRESH_COOKIE];
}
