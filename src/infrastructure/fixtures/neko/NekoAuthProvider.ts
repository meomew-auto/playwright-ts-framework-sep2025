/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO AUTH PROVIDER — localStorage + Zustand auth cho Neko Coffee
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Override BaseAuthProvider cho project Neko với JWT-based auth.
 * Neko dùng localStorage + Zustand persist format — khác CMS dùng cookie.
 *
 * 📌 ZUSTAND PERSIST FORMAT:
 * Neko frontend dùng Zustand (state management library).
 * Khi persist, Zustand lưu vào localStorage key `neko_auth` với format:
 * ```json
 * { "state": { "user": {...}, "access_token": "...", "exp": ... }, "version": 0 }
 * ```
 * → createStorageState() phải tạo đúng format này.
 *
 * 📚 FLOW:
 * 1. login() → gọi API /auth/login → nhận JWT token
 * 2. extractUserFromToken() → decode JWT → lấy user info
 * 3. createStorageState() → tạo Zustand format → lưu vào admin.json
 *
 * 🔗 LIÊN KẾT:
 * - Extends: BaseAuthProvider (Template Method pattern)
 * - Dùng bởi: neko.setup.ts, api/auth.api.fixture.ts (token extraction)
 * - Dùng: jwt.utils.ts (extractUserFromToken, isTokenValid)
 */

import { APIRequestContext } from '@playwright/test';
import { EnvManager } from '../../utils/EnvManager';
import { BaseAuthProvider } from '../common/auth/BaseAuthProvider';
import { extractUserFromToken, isTokenValid } from '../common/auth/jwt.utils';
import { getLocalStorageValue } from '../common/auth/storage-state.utils';
import type { RoleCredentials, LoginResult, StorageState } from '../common/auth/auth.types';

export class NekoAuthProvider extends BaseAuthProvider {
  readonly envPrefix = 'NEKO';

  /**
   * Get credentials for a role from environment
   * Env keys: NEKO_ADMIN_USERNAME, NEKO_ADMIN_PASSWORD, etc.
   */
  getCredentials(role: string): RoleCredentials {
    const upperRole = role.toUpperCase();
    return {
      username: EnvManager.get(`${this.envPrefix}_${upperRole}_USERNAME`),
      password: EnvManager.get(`${this.envPrefix}_${upperRole}_PASSWORD`),
    };
  }

  /**
   * Create storage state with localStorage + Zustand format
   */
  createStorageState(tokens: LoginResult): StorageState {
    const user = extractUserFromToken(tokens.accessToken);

    // Zustand storage format for neko_auth
    const nekoAuthState = JSON.stringify({
      state: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || '',
        expiresAt: tokens.expiresAt,
        isAuthenticated: true,
      },
      version: 0,
    });

    return {
      cookies: [],
      origins: [
        {
          origin: this.config.uiOrigin,
          localStorage: [
            { name: 'access_token', value: tokens.accessToken },
            { name: 'neko_auth', value: nekoAuthState },
            { name: 'refresh_token', value: tokens.refreshToken || '' },
          ],
        },
      ],
    };
  }

  /**
   * Check if storage state is valid by checking expiresAt in neko_auth
   */
  isStorageStateValid(role: string): boolean {
    const state = this.loadStorageState(role);
    if (!state) return false;

    const nekoAuthValue = getLocalStorageValue(state, 'neko_auth');
    if (!nekoAuthValue) return false;

    try {
      const nekoAuth = JSON.parse(nekoAuthValue);
      const expiresAt = nekoAuth.state?.expiresAt;
      if (!expiresAt) return false;

      const bufferMs = this.config.bufferMinutes * 60 * 1000;
      return expiresAt > Date.now() + bufferMs;
    } catch {
      return false;
    }
  }

  /**
   * Login via Neko Coffee API
   */
  async login(request: APIRequestContext, role: string): Promise<LoginResult> {
    const creds = this.getCredentials(role);

    const response = await request.post(`${this.config.apiUrl}/auth/login`, {
      data: {
        username: creds.username,
        password: creds.password,
      },
    });

    if (!response.ok()) {
      throw new Error(`[NEKO] Login failed for ${role}: ${response.status()}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : undefined,
    };
  }
}

/** Singleton instance */
export const nekoAuth = new NekoAuthProvider();
