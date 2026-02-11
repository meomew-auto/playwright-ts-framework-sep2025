/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO COFFEE - UNIFIED FIXTURE (PROJECT-LEVEL)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Kết hợp tất cả fixtures của project Neko Coffee:
 * - UI: productPage, authedPage
 * - API: productService, categoryService, authToken
 * - Role: asRole() cho multi-user testing
 *
 * 📚 CÁCH DÙNG:
 * ```typescript
 * import { test, expect } from '@fixtures/neko/unified.fixture';
 *
 * test('Full test', async ({ productPage, productService, asRole }) => {
 *   // UI
 *   await productPage.expectMinProducts(5);
 *   
 *   // API
 *   const products = await productService.getProducts();
 *   
 *   // Multi-role
 *   const staffPage = await asRole('staff');
 * });
 * ```
 */

import { mergeTests, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT PROJECT FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

// Neko UI Test
import { test as nekoUiTest, GatekeeperFixtures } from './ui/gatekeeper.fixture';

// Neko API Test
import { test as nekoApiTest, GatekeeperApiFixtures } from './api/gatekeeper.api.fixture';

// Common Role Test (shared across projects)
// TODO: Uncomment when role fixture is implemented
// import { test as roleTest, RoleFixtures } from '../common/role.fixture';

// ═══════════════════════════════════════════════════════════════════════════
// MERGED FIXTURE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Neko Coffee Unified Test
 * 
 * Includes:
 * - UI: authedPage, productPage
 * - API: authToken, apiRequest, productService, categoryService
 */
export const test = mergeTests(nekoUiTest, nekoApiTest);

// Khi thêm role fixture:
// export const test = mergeTests(nekoUiTest, nekoApiTest, roleTest);

// Re-export expect
export { expect };

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type NekoUnifiedFixtures = GatekeeperFixtures & GatekeeperApiFixtures;
// Khi thêm role: export type NekoUnifiedFixtures = GatekeeperFixtures & GatekeeperApiFixtures & RoleFixtures;
