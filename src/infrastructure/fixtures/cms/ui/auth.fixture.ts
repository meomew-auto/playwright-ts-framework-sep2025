/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CMS AUTH FIXTURE — Cung cấp authenticated pages cho UI tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Fixture layer đầu tiên trong pipeline: cung cấp `authedPage` —
 * một Page object đã có session cookie từ storageState.
 *
 * 📌 FIXTURE CHAINING PATTERN:
 * ```
 * auth.fixture → app.fixture → gatekeeper → test
 *   (page)        (POMs)       (merge)     (sử dụng)
 * ```
 *
 * 📚 VIEWPORTTYPE OPTION:
 * `viewportType: ['desktop', { option: true }]`
 * - { option: true } = giá trị này được SET TỪ project config
 * - Playwright inject giá trị khi test chạy
 *
 * 🔗 LIÊN KẾT:
 * - Phụ thuộc: storageState (từ setup project), CMSLoginPage (fallback)
 * - Dùng bởi: ui/app.fixture.ts (lấy authedPage)
 */

import { test as base, Page } from '@playwright/test';
import { ViewportType } from '../../common/ViewportType';
import { Logger } from '../../../utils/Logger';

// Import CMS Login Page — dùng khi fallback login
import { CMSLoginPage } from '../../../pages/cms/CMSLoginPage';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type AuthFixtures = {
  /** POM cho trang login — dùng khi cần re-login */
  loginPage: CMSLoginPage;
  /** Page đã login — có sẵn session cookie từ storageState */
  authedPage: Page;
  /** Viewport hiện tại — inject từ project config */
  viewportType: ViewportType;
};

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURE DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

export const auth = base.extend<AuthFixtures>({
  /**
   * viewportType — giá trị từ project config.
   * Default 'desktop' nếu project config không set.
   */
  viewportType: ['desktop', { option: true }],

  /**
   * loginPage — POM cho trang Login.
   * Navigate trước để sẵn sàng khi test gọi login().
   */
  loginPage: async ({ page, viewportType }, use) => {
    const loginPage = new CMSLoginPage(page, viewportType);
    await loginPage.goto();
    Logger.info('LoginPage ready', { context: 'fixture' });
    await use(loginPage);
  },

  /**
   * authedPage — Page đã có session từ storageState.
   *
   * 📌 FALLBACK MECHANISM:
   * - storageState được load tự động bởi Playwright (từ project config)
   * - Nếu storageState rỗng (cookies.length === 0) → re-login qua UI
   * - Điều này xảy ra khi session hết hạn giữa lúc setup và test chạy
   */
  authedPage: async ({ loginPage, page, storageState }, use) => {
    // Check: storageState rỗng = guest mode = cần login lại
    const isGuestMode = typeof storageState === 'object' && storageState.cookies?.length === 0;

    if (isGuestMode) {
      Logger.warn('Token expired, re-logging in...', { context: 'fixture' });
      await loginPage.goto();
      await loginPage.login('admin@example.com', '123456');
      await loginPage.expectLoggedIn();
    } else {
      Logger.info('Using authedPage with storageState', { context: 'fixture' });
    }

    await use(page);
  },
});

