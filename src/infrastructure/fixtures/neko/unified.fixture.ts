/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO COFFEE - UNIFIED FIXTURE (PROJECT-LEVEL)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Kết hợp tất cả fixtures của project Neko Coffee:
 * - UI: productsPage, ordersPage, authedPage
 * - API: productService, orderService, authToken
 * - Role: asRole() cho multi-user testing
 *
 * 📚 CÁCH DÙNG:
 * ```typescript
 * import { test, expect } from '@fixtures/neko/unified.fixture';
 *
 * // UI + API (default admin role)
 * test('Admin test', async ({ ordersPage, orderService }) => {
 *   await ordersPage.goto();
 *   const orders = await orderService.getOrders();
 * });
 *
 * // Multi-role
 * test('Admin vs Staff', async ({ ordersPage, asRole }) => {
 *   await ordersPage.goto();                        // admin
 *   const staff = await asRole('staff');
 *   await staff.ordersPage.goto();                  // staff UI
 *   const staffOrders = await staff.orderService.getOrders(); // staff API
 * });
 * ```
 */

import { mergeTests, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT PROJECT FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

// Neko UI Test (auth + POMs)
import { test as nekoUiTest, GatekeeperFixtures } from './ui/gatekeeper.fixture';

// Neko API Test (authToken + services)
import { test as nekoApiTest, GatekeeperApiFixtures } from './api/gatekeeper.api.fixture';

// Neko Role Test (asRole for multi-user)
import { test as roleTest, RoleFixtures } from './role.fixture';

// ═══════════════════════════════════════════════════════════════════════════
// MERGED FIXTURE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Neko Coffee Unified Test
 *
 * Includes:
 * - UI: authedPage, productsPage, ordersPage
 * - API: authToken, apiRequest, productService, orderService
 * - Role: asRole('admin' | 'staff') → NekoRoleContext
 */
export const test = mergeTests(nekoUiTest, nekoApiTest, roleTest);

// Re-export expect
export { expect };

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type NekoUnifiedFixtures = GatekeeperFixtures & GatekeeperApiFixtures & RoleFixtures;

