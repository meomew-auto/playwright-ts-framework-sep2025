/**
 * ============================================================================
 * NEKO API GATEKEEPER — Entry point cho Neko API tests
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * - Giống gatekeeper.fixture.ts của UI
 * - Merge auth + services ở đây
 * - Export test và expect để dùng trong spec files
 *
 * 📚 CÁCH DÙNG TRONG TEST:
 * import { test, expect } from '../fixtures/gatekeeper.api.fixture';
 *
 * test('...', async ({ productService, authToken }) => {
 *   // Có sẵn tất cả fixtures
 * });
 */

import { test as authTest, AuthApiFixtures } from './auth.api.fixture';
import { servicesFixtures, ServicesFixtures } from './services.fixture';
import { expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────
// COMBINED TYPE
// ─────────────────────────────────────────────────────────────────────────

export type GatekeeperApiFixtures = AuthApiFixtures & ServicesFixtures;

// ─────────────────────────────────────────────────────────────────────────
// MERGE AUTH + SERVICES (giống UI)
// ─────────────────────────────────────────────────────────────────────────

export const test = authTest.extend<ServicesFixtures>({
  ...servicesFixtures,
});

export { expect };
