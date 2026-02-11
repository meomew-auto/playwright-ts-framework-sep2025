/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CMS UNIFIED FIXTURE — Gộp tất cả fixtures của project CMS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * "Unified" nghĩa là gộp UI + API fixtures của 1 PROJECT.
 * Hiện tại CMS chỉ có UI (chưa có API fixtures), nên file này
 * đơn giản re-export từ gatekeeper.
 *
 * 📌 KHI THÊM CMS API:
 * ```typescript
 * import { test as uiTest } from './ui/gatekeeper.fixture';
 * import { test as apiTest } from './api/gatekeeper.api.fixture';
 * export const test = mergeTests(uiTest, apiTest);
 * export type CMSUnifiedFixtures = GatekeeperFixtures & ApiFixtures;
 * ```
 *
 * 🔗 LIÊN KẾT:
 * - Re-export: ui/gatekeeper.fixture.ts
 * - Dùng bởi: fixtures/unified.fixture.ts (global merge)
 * - Neko tương đương: neko/unified.fixture.ts (đã có UI + API)
 */

// CMS hiện tại chỉ có UI, chưa có API
// → unified = UI gatekeeper
import { test, GatekeeperFixtures } from './ui/gatekeeper.fixture';

export { test as cmsUiTest };
export { expect } from '@playwright/test';

// Type cho global unified merge
export type CMSUnifiedFixtures = GatekeeperFixtures;
