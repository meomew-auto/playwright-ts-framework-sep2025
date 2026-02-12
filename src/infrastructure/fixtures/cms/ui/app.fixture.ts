/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CMS APP FIXTURE — Page Object Model fixtures cho CMS UI tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Cung cấp POMs (Page Object Models) dưới dạng fixtures.
 * Test chỉ cần khai báo POM cần dùng → Playwright tự khởi tạo.
 *
 * 📌 TẠI SAO EXPORT OBJECT (không phải test.extend)?
 * ```typescript
 * // Export object fixtures riêng → spread vào gatekeeper
 * export const appFixtures = { allProductsPage: async (...) => ... };
 * // Ở gatekeeper:  auth.extend<AppFixtures>({ ...appFixtures })
 * ```
 * Nếu export test.extend() → phải dùng mergeTests() (phức tạp hơn).
 *
 * 📚 DEPENDENCY INJECTION:
 * Mỗi POM fixture nhận `authedPage` từ auth.fixture.
 * → Playwright tự resolve: auth.fixture trước, rồi mới tạo POMs.
 *
 * 🔗 LIÊN KẾT:
 * - Phụ thuộc: auth.fixture.ts (authedPage, viewportType)
 * - Dùng bởi: gatekeeper.fixture.ts (spread merge)
 * - Import POMs từ: pages/cms/
 */

import { PlaywrightTestArgs } from '@playwright/test';
import { AuthFixtures } from './auth.fixture';
import { ViewportType } from '../../common/ViewportType';
import { Logger } from '../../../utils/Logger';

// Import CMS Page Objects — mỗi POM sẽ thành 1 fixture
import { CMSLoginPage } from '../../../pages/cms/CMSLoginPage';
import { CMSAllProductsPage } from '../../../pages/cms/CMSAllProductsPage';
import { CMSDashboardPage } from '../../../pages/cms/CMSDashboardPage';
import { CMSAddNewProductPage } from '../../../pages/cms/CMSAddNewProductPage';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type AppFixtures = {
  dashboardPage: CMSDashboardPage;
  allProductsPage: CMSAllProductsPage;
  addNewProductPage: CMSAddNewProductPage;
};

/** Dependencies — Playwright inject các fixtures này tự động */
type AppDeps = PlaywrightTestArgs & AuthFixtures & { viewportType?: ViewportType };

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURES OBJECT — Export dạng object để spread vào gatekeeper
// ═══════════════════════════════════════════════════════════════════════════

export const appFixtures = {
  /**
   * Dashboard page — trang chính sau login, navigate tự động.
   */
  dashboardPage: async (
    { authedPage, viewportType }: AppDeps,
    use: (r: CMSDashboardPage) => Promise<void>
  ) => {
    const dashboardPage = new CMSDashboardPage(authedPage, viewportType || 'desktop');
    await dashboardPage.goto();
    Logger.info('DashboardPage ready', { context: 'fixture' });
    await use(dashboardPage);
  },

  /**
   * All Products page — danh sách sản phẩm, navigate + verify tự động.
   */
  allProductsPage: async (
    { authedPage, viewportType }: AppDeps,
    use: (r: CMSAllProductsPage) => Promise<void>
  ) => {
    const allProductsPage = new CMSAllProductsPage(authedPage, viewportType || 'desktop');
    await allProductsPage.goto();
    await allProductsPage.expectOnPage();
    Logger.info('AllProductsPage ready', { context: 'fixture' });
    await use(allProductsPage);
  },

  /**
   * Add New Product page — form tạo sản phẩm mới, navigate + verify tự động.
   */
  addNewProductPage: async (
    { authedPage, viewportType }: AppDeps,
    use: (r: CMSAddNewProductPage) => Promise<void>
  ) => {
    const addNewProductPage = new CMSAddNewProductPage(authedPage, viewportType || 'desktop');
    await addNewProductPage.goto();
    await addNewProductPage.expectOnPage();
    Logger.info('AddNewProductPage ready', { context: 'fixture' });
    await use(addNewProductPage);
  },
};