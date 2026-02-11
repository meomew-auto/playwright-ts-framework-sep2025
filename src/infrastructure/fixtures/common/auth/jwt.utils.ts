/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JWT UTILITIES — Decode, validate, và extract thông tin từ JWT tokens
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Làm việc với JWT mà KHÔNG cần thư viện ngoài (jsonwebtoken, jose).
 * Chỉ decode payload (base64) — KHÔNG verify signature (đủ cho testing).
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: NekoAuthProvider.createStorageState() → extractUserFromToken()
 * - CMS không dùng vì auth bằng session cookie, không có JWT
 */

import type { UserInfo } from './auth.types';

/**
 * Decode JWT payload without verification
 * @param token JWT token string
 * @returns Decoded payload object or null if invalid
 */
export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * Get token expiry timestamp in milliseconds
 * @param token JWT token string
 * @returns Expiry timestamp in ms, or null if not found
 */
export function getTokenExpiry(token: string): number | null {
  const payload = decodeJWT(token);
  if (!payload?.exp) return null;
  return (payload.exp as number) * 1000;
}

/**
 * Check if token is expired (with optional buffer)
 * @param token JWT token string
 * @param bufferMinutes Minutes before actual expiry to consider expired
 * @returns true if expired or will expire within buffer
 */
export function isTokenExpired(token: string, bufferMinutes: number = 5): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  const bufferMs = bufferMinutes * 60 * 1000;
  return expiry < Date.now() + bufferMs;
}

/**
 * Check if token is valid (not expired)
 * @param token JWT token string
 * @param bufferMinutes Buffer minutes before expiry
 * @returns true if token is still valid
 */
export function isTokenValid(token: string, bufferMinutes: number = 5): boolean {
  return !isTokenExpired(token, bufferMinutes);
}

/**
 * Extract user info from JWT payload
 * @param token JWT token string
 * @returns UserInfo object or null
 */
export function extractUserFromToken(token: string): UserInfo | null {
  const payload = decodeJWT(token);
  if (!payload) return null;

  return {
    id: (payload.sub as number) || 0,
    username: (payload.username as string) || '',
    email: (payload.email as string) || '',
    role: (payload.role as string) || '',
  };
}
