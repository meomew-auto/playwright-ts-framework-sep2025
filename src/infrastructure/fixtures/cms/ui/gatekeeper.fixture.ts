/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CMS GATEKEEPER FIXTURE — Entry point cho tất cả CMS UI tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Merge auth + app fixtures thành 1 `test` object duy nhất.
 * Đây là file mà test specs import trực tiếp.
 *
 * 📌 TẠI SAO DÙNG auth.extend() THAY VÌ mergeTests():
 * - auth.extend(): app fixtures KẾ THỪA auth context (cần authedPage)
 * - mergeTests():  2 test objects ĐỘC LẬP merge lại
 * Ở đây dùng extend() vì app → phụ thuộc → auth.
 * mergeTests() phù hợp hơn ở unified.fixture.ts (merge UI + API).
 *
 * 📚 CÁCH DÙNG:
 * ```typescript
 * import { test, expect } from '@fixtures/cms/ui/gatekeeper.fixture';
 * test('TC_01', async ({ allProductsPage }) => {
 *   await allProductsPage.goto();
 * });
 * ```
 *
 * 🔗 LIÊN KẾT:
 * - Merge: auth.fixture (authedPage, loginPage) + app.fixture (POMs)
 * - Dùng bởi: tất cả CMS UI test specs
 * - Export bởi: cms/index.ts (barrel)
 */

import { auth, AuthFixtures } from './auth.fixture';
import { appFixtures, AppFixtures } from './app.fixture';

// ═══════════════════════════════════════════════════════════════════════════
// COMBINED TYPE — Union tất cả fixtures có sẵn
// ═══════════════════════════════════════════════════════════════════════════

export type GatekeeperFixtures = AuthFixtures & AppFixtures;

// ═══════════════════════════════════════════════════════════════════════════
// MERGED TEST — auth.extend() để kế thừa auth context
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Test object với tất cả CMS UI fixtures:
 * - Auth: loginPage, authedPage, viewportType
 * - App:  dashboardPage, allProductsPage, addNewProductPage
 */
export const test = auth.extend<AppFixtures>({
  ...appFixtures,
});

// Re-export expect để test specs chỉ cần 1 import
export { expect } from '@playwright/test';
