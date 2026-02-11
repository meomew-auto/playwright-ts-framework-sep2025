/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CMS AUTH PROVIDER — Cookie-based authentication cho E-commerce CMS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Override BaseAuthProvider cho project CMS với cookie-based auth.
 * CMS dùng session cookie (ecommerce_cms_session) — khác Neko dùng JWT.
 *
 * 📌 COOKIE vs JWT:
 * - CMS:  Server set cookie → browser gửi cookie mỗi request → stateful
 * - Neko: Server trả JWT → client lưu localStorage → stateless
 *
 * 📚 2 CÁCH LOGIN:
 * - loginViaUI() ← ✅ RECOMMENDED: dùng browser, bắt cookie trực tiếp
 * - login()      ← ⚠️ DEPRECATED: gọi API, không bắt được httpOnly cookie
 *
 * 🔗 LIÊN KẾT:
 * - Extends: BaseAuthProvider (Template Method pattern)
 * - Dùng bởi: auth.setup.ts (setup project), auth.fixture.ts (fallback login)
 * - Config: CMS_API_URL, CMS_UI_ORIGIN, CMS_ADMIN_EMAIL, CMS_ADMIN_PASSWORD
 */

import { APIRequestContext } from '@playwright/test';
import { EnvManager } from '../../utils/EnvManager';
import { BaseAuthProvider } from '../common/auth/BaseAuthProvider';
import type { RoleCredentials, LoginResult, StorageState, Cookie } from '../common/auth/auth.types';

export class CMSAuthProvider extends BaseAuthProvider {
  readonly envPrefix = 'CMS';

  /**
   * Get credentials for a role from environment
   * Env keys: CMS_ADMIN_EMAIL, CMS_ADMIN_PASSWORD, etc.
   */
  getCredentials(role: string): RoleCredentials {
    const upperRole = role.toUpperCase();
    return {
      email: EnvManager.get(`${this.envPrefix}_${upperRole}_EMAIL`),
      password: EnvManager.get(`${this.envPrefix}_${upperRole}_PASSWORD`),
    };
  }

  /**
   * Create storage state with cookies
   */
  createStorageState(tokens: LoginResult): StorageState {
    const domain = new URL(this.config.uiOrigin).hostname;

    const cookies: Cookie[] = [
      {
        name: 'auth_token',
        value: tokens.accessToken,
        domain,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    ];

    if (tokens.refreshToken) {
      cookies.push({
        name: 'refresh_token',
        value: tokens.refreshToken,
        domain,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      });
    }

    return {
      cookies,
      origins: [], // CMS uses cookies, not localStorage
    };
  }

  /**
   * Check if storage state is valid by checking session cookie expiry
   * CMS dùng cookie-based session (không phải JWT token)
   */
  isStorageStateValid(role: string): boolean {
    const state = this.loadStorageState(role);
    if (!state || !state.cookies.length) return false;

    // Tìm session cookie của CMS
    const sessionCookie = state.cookies.find(
      (c: { name: string }) => c.name === 'ecommerce_cms_session'
    );
    if (!sessionCookie) return false;

    // Check cookie chưa hết hạn (expires là Unix timestamp tính bằng giây)
    const expiresAt = (sessionCookie as { expires?: number }).expires;
    if (!expiresAt) return false;

    const nowInSeconds = Date.now() / 1000;
    const bufferSeconds = (this.config.bufferMinutes || 5) * 60;
    return expiresAt > nowInSeconds + bufferSeconds;
  }

  /**
   * Login via CMS API
   * 
   * ⚠️ DEPRECATED: CMS dùng cookie-based auth, cần loginViaUI() thay thế
   * Method này chỉ hoạt động nếu CMS API trả về token trong response body
   */
  async login(request: APIRequestContext, role: string): Promise<LoginResult> {
    const creds = this.getCredentials(role);

    const response = await request.post(`${this.config.apiUrl}/login`, {
      data: {
        email: creds.email,
        password: creds.password,
      },
    });

    if (!response.ok()) {
      throw new Error(`[CMS] Login failed for ${role}: ${response.status()}`);
    }

    const data = await response.json();

    return {
      accessToken: data.token || data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : undefined,
    };
  }

  /**
   * Login via UI và save storage state (cookies)
   * 
   * ✅ RECOMMENDED cho CMS cookie-based auth
   * Browser sẽ nhận cookies từ server response headers
   * 
   * @param page - Playwright Page
   * @param role - Role name (e.g., 'admin')
   * @param loginPage - CMSLoginPage instance (hoặc sẽ tạo mới)
   */
  async loginViaUI(
    page: import('@playwright/test').Page,
    role: string,
    loginPage?: { goto: () => Promise<void>; login: (email: string, pw: string) => Promise<void>; expectLoggedIn: () => Promise<void> }
  ): Promise<void> {
    const creds = this.getCredentials(role);
    
    if (!creds.email || !creds.password) {
      throw new Error(`[CMS] Missing credentials for role: ${role}. Set CMS_${role.toUpperCase()}_EMAIL and CMS_${role.toUpperCase()}_PASSWORD`);
    }

    // Login qua UI
    if (loginPage) {
      await loginPage.goto();
      await loginPage.login(creds.email, creds.password);
      await loginPage.expectLoggedIn();
    } else {
      // Fallback: Navigate và login trực tiếp
      await page.goto(`${this.config.uiOrigin}/login`);
      await page.fill('input[name="email"], input[type="email"]', creds.email);
      await page.fill('input[name="password"], input[type="password"]', creds.password);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes('/login'));
    }

    // Đợi cookies được set
    await page.waitForTimeout(1000);

    // Save storage state
    const storagePath = this.getStorageStatePath(role);
    await page.context().storageState({ path: storagePath });
    console.log(`✅ [${this.envPrefix}] Saved storage state: ${storagePath}`);
  }
}

/** Singleton instance */
export const cmsAuth = new CMSAuthProvider();

