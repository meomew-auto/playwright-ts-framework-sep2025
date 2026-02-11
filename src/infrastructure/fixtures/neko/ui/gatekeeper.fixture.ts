/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO GATEKEEPER FIXTURE — Entry point cho Neko UI tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Merge auth + app fixtures thành 1 `test` object.
 * Dùng auth.extend() vì app phụ thuộc auth (cần authedPage).
 *
 * 🔗 LIÊN KẾT:
 * - Merge: auth.fixture + app.fixture
 * - Dùng bởi: unified.fixture.ts (merge với API fixtures)
 * 
 * 📚 CÁCH DÙNG:
 * import { test, expect } from '../fixture/gatekeeper.fixture';
 * 
 * test('Product test', async ({ productPage, authedPage }) => {
 *   await productPage.expectMinProducts(5);
 * });
 */

import { auth, AuthFixtures } from './auth.fixture';
import { appFixtures, AppFixtures } from './app.fixture';

// ═══════════════════════════════════════════════════════════════════════════
// COMBINED TYPE
// ═══════════════════════════════════════════════════════════════════════════

export type GatekeeperFixtures = AuthFixtures & AppFixtures;

// ═══════════════════════════════════════════════════════════════════════════
// MERGED TEST
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Test object với tất cả fixtures:
 * - authedPage: Page đã login
 * - productPage: POM cho Products page
 */
export const test = auth.extend<AppFixtures>({
  ...appFixtures,
});

// Re-export expect
export { expect } from '@playwright/test';
