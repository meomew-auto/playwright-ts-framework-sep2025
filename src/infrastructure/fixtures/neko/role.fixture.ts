/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO ROLE FIXTURE — Multi-role testing cho Neko Coffee project
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Cho phép test sử dụng nhiều roles (admin, staff) trong cùng 1 test case.
 * Mỗi role có browser context riêng (isolated session) + POMs + API Services.
 *
 * 📚 CÁCH DÙNG:
 * ```typescript
 * import { test } from '@fixtures/neko/unified.fixture';
 *
 * test('Admin vs Staff', async ({ ordersPage, asRole }) => {
 *   // Admin — từ fixture mặc định (authedPage)
 *   await ordersPage.goto();
 *
 *   // Staff — isolated context + POMs + Services
 *   const staff = await asRole('staff');
 *   await staff.ordersPage.goto();
 *   const staffOrders = await staff.orderService.getOrders();
 * });
 * ```
 *
 * 📌 ARCHITECTURE:
 * - Dùng neko-context.factory.ts (shared POM/Service factory — DRY)
 * - Mỗi asRole() call tạo isolated browser context + fresh POMs + Services
 * - Tất cả contexts được track và cleanup khi test xong
 *
 * 📌 LAZY LOGIN:
 * - Admin: đã được login bởi neko.setup.ts (global setup)
 * - Roles khác (staff, manager): tự động login khi asRole() được gọi
 *   nếu storageState chưa tồn tại hoặc token hết hạn.
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: neko-context.factory.ts (createNekoPOMs, createNekoServices, extractTokenForRole)
 * - Dùng: NekoAuthProvider (getStorageStatePath)
 * - Merge bởi: unified.fixture.ts
 */

import { test as base, Browser, BrowserContext, APIRequestContext } from '@playwright/test';
import { ViewportType } from '@fixtures/common/ViewportType';
import { Logger } from '@utils/Logger';
import { nekoAuth } from './NekoAuthProvider';
import {
  createNekoPOMs,
  createNekoServices,
  extractTokenForRole,
  type NekoRoleContext,
} from './neko-context.factory';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Neko-specific roles — match env vars NEKO_{ROLE}_USERNAME */
export type NekoRole = 'admin' | 'staff' | 'manager';

/** Signature: asRole('staff') → NekoRoleContext */
export type AsRoleFunction = (role: NekoRole) => Promise<NekoRoleContext>;

/** Export type cho merging vào unified.fixture.ts */
export type RoleFixtures = {
  asRole: AsRoleFunction;
};

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURE DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

export const roleFixtures = {
  /**
   * asRole — tạo isolated context cho 1 role.
   *
   * Flow:
   * 1. Check storageState file → nếu chưa có hoặc expired → LAZY LOGIN
   * 2. Load storageState → tạo isolated browser context
   * 3. Extract token → tạo API Services (via factory)
   * 4. Tạo POMs (via factory)
   * 5. Return NekoRoleContext { page, POMs, Services, token }
   *
   * 📌 LAZY LOGIN:
   * Setup chỉ login admin. Khi test gọi asRole('manager'),
   * fixture tự động login manager nếu chưa có storageState.
   *
   * Cleanup: close tất cả contexts + dispose API contexts khi test xong.
   */
  asRole: async (
    { browser, viewportType, request }: {
      browser: Browser;
      viewportType: ViewportType;
      request: APIRequestContext;
    },
    use: (fn: AsRoleFunction) => Promise<void>
  ) => {
    const contexts: BrowserContext[] = [];
    const apiContexts: APIRequestContext[] = [];

    const createRoleContext: AsRoleFunction = async (role) => {
      // ─── Lazy Login: tự login nếu chưa có storageState ────────────
      if (!nekoAuth.isStorageStateValid(role)) {
        Logger.info(`Storage state invalid for "${role}", logging in...`, { context: 'fixture' });
        await nekoAuth.loginAndSave(request, role);
        Logger.info(`Lazy login complete for "${role}"`, { context: 'fixture' });
      }

      const storagePath = nekoAuth.getStorageStatePath(role);
      Logger.info(`Loading role "${role}" from ${storagePath}`, { context: 'fixture' });

      // 1. Tạo isolated browser context với role's storageState
      const context = await browser.newContext({
        storageState: storagePath,
      });
      contexts.push(context);
      const page = await context.newPage();

      // 2. Tạo POMs (từ shared factory)
      const poms = createNekoPOMs(page, viewportType || 'desktop');

      // 3. Extract token + tạo API Services (từ shared factory)
      const token = extractTokenForRole(role);
      const services = await createNekoServices(token);
      apiContexts.push(services.apiRequest);

      Logger.info(`Role "${role}" ready — POMs + Services created`, { context: 'fixture' });

      return {
        page,
        token,
        ...poms,
        ...services,
      };
    };

    await use(createRoleContext);

    // 🧹 Cleanup
    Logger.info(`Cleaning up ${contexts.length} role contexts`, { context: 'fixture' });
    for (const ctx of contexts) {
      await ctx.close();
    }
    for (const apiCtx of apiContexts) {
      await apiCtx.dispose();
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST EXPORT (for standalone use)
// ═══════════════════════════════════════════════════════════════════════════

export const test = base.extend<RoleFixtures>(roleFixtures as any);
export { expect } from '@playwright/test';
