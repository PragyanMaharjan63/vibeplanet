import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { signAccessToken, issueRefreshToken, verifyRefreshToken, revokeRefreshToken } from '../utils/tokens.js';
import { setAuthCookies, clearAuthCookies, getRefreshCookie } from '../utils/cookies.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const signup = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email: email.toLowerCase(), passwordHash });

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user);
  setAuthCookies(res, { accessToken, refreshToken });

  res.status(201).json({ id: user._id, email: user.email, role: user.role });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user);
  setAuthCookies(res, { accessToken, refreshToken });

  res.json({ id: user._id, email: user.email, role: user.role });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshCookie(req);
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  clearAuthCookies(res);
  res.status(204).end();
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshCookie(req);
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  let payload;
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'User no longer exists' });
  }

  // Rotate: revoke the used refresh token and issue a fresh pair
  await revokeRefreshToken(refreshToken);
  const accessToken = signAccessToken(user);
  const newRefreshToken = await issueRefreshToken(user);
  setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });

  res.json({ id: user._id, email: user.email, role: user.role });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('email role');
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }
  res.json({ id: user._id, email: user.email, role: user.role });
});
