/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GLOBAL UNIFIED FIXTURE — Cross-project fixture (CMS + Neko + ...)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Merge TẤT CẢ project-level unified fixtures vào 1 `test` object.
 * Dùng khi test cần fixtures từ NHIỀU projects cùng lúc.
 *
 * 📌 HIERARCHY:
 *   global unified (file này)
 *     ├── CMS unified  → UI only (chưa có API)
 *     └── Neko unified → UI + API
 *
 * 📚 CÁCH DÙNG:
 * ```typescript
 * import { test, expect } from '@fixtures/unified.fixture';
 * test('Cross-project', async ({ allProductsPage, productsPage }) => {
 *   // allProductsPage = CMS, productsPage = Neko
 * });
 * ```
 *
 * 📌 KHI NÀO DÙNG:
 * - Test CMS only  → import từ '@fixtures/cms'
 * - Test Neko only  → import từ '@fixtures/neko'
 * - Cross-project   → import từ file NÀY
 *
 * 🔗 LIÊN KẾT:
 * - Merge: cms/unified.fixture + neko/unified.fixture
 * - Export bởi: cms/index.ts (re-export)
 */

import { mergeTests, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT PROJECT-LEVEL UNIFIED FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

// Neko Coffee — UI + API fixtures
import { test as nekoTest, NekoUnifiedFixtures } from './neko/unified.fixture';

// CMS eCommerce — UI only (chưa có API)
import { cmsUiTest, CMSUnifiedFixtures } from './cms/unified.fixture';

// Future projects
// import { test as crmTest, CRMUnifiedFixtures } from './crm/unified.fixture';

// ═══════════════════════════════════════════════════════════════════════════
// MERGE ALL PROJECTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Global test object — merge từ tất cả projects.
 * Khi thêm project mới: mergeTests(nekoTest, cmsUiTest, crmTest)
 */
export const test = mergeTests(nekoTest, cmsUiTest);

// Re-export expect
export { expect };

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

/** Union type của tất cả project fixtures */
export type GlobalUnifiedFixtures = NekoUnifiedFixtures & CMSUnifiedFixtures;
