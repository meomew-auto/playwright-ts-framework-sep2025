/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO AUTH FIXTURE — Cung cấp authenticated pages cho Neko UI tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Fixture layer đầu tiên: cung cấp `authedPage` với localStorage data.
 * Pattern giống CMS auth.fixture, nhưng storageState chứa localStorage
 * thay vì cookies.
 *
 * 📌 FIXTURE CHAINING:
 * auth.fixture → app.fixture → gatekeeper → test
 *
 * 🔗 LIÊN KẾT:
 * - Phụ thuộc: storageState (từ neko.setup.ts)
 * - Dùng bởi: ui/app.fixture.ts
 */

import { test as base, Page } from '@playwright/test';
import { ViewportType } from '../../common/ViewportType';
import { Logger } from '../../../utils/Logger';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type AuthFixtures = {
  /**
   * Page đã login (dùng storageState từ setup project)
   * - Nếu chạy với project có storageState → đã login sẵn
   * - Nếu chạy không có storageState → page thường
   */
  authedPage: Page;
  viewportType: ViewportType;
};

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

export const auth = base.extend<AuthFixtures>({
  // viewportType option - từ project config
  viewportType: ['desktop', { option: true }],

  /**
   * authedPage: Page đã có session từ storageState
   * 
   * Lưu ý: storageState được config trong playwright.config.ts
   * hoặc trong project settings
   */
  authedPage: async ({ page }, use) => {
    // Page tự động có cookies/localStorage từ storageState
    // Không cần login lại
    Logger.info('Using authedPage with storageState', { context: 'fixture' });
    await use(page);
  },
});

