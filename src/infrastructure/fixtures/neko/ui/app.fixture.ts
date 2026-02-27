/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO APP FIXTURE — Page Object Model fixtures cho Neko UI tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Cung cấp POMs dưới dạng fixtures (giống pattern CMS app.fixture).
 * Export dạng object để spread vào gatekeeper.
 *
 * 📌 DRY PATTERN:
 * Dùng createNekoPOMs() từ neko-context.factory.ts (shared factory).
 * Thêm POM mới → chỉ cần sửa factory, không cần sửa file này.
 *
 * 📚 DEPENDENCY:
 * Mỗi POM nhận `authedPage` + `viewportType` từ auth.fixture.
 *
 * 🔗 LIÊN KẾT:
 * - Phụ thuộc: auth.fixture.ts (authedPage, viewportType)
 * - Dùng: neko-context.factory.ts (createNekoPOMs)
 * - Dùng bởi: gatekeeper.fixture.ts (spread merge)
 */

import { PlaywrightTestArgs } from '@playwright/test';
import { AuthFixtures } from './auth.fixture';
import { ViewportType } from '../../common/ViewportType';
import { Logger } from '../../../utils/Logger';
import { createNekoPOMs, type NekoPOMs } from '../neko-context.factory';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type AppFixtures = NekoPOMs;

// Helper type - Dependencies cần có
type AppDeps = PlaywrightTestArgs & AuthFixtures & { viewportType?: ViewportType };

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURES OBJECT (để spread vào gatekeeper)
// ═══════════════════════════════════════════════════════════════════════════

export const appFixtures = {
  /**
   * productsPage: POM cho trang Products List
   *
   * Không tự động navigate - test sẽ gọi goto()
   */
  productsPage: async (
    { authedPage, viewportType }: AppDeps,
    use: (r: NekoPOMs['productsPage']) => Promise<void>
  ) => {
    const poms = createNekoPOMs(authedPage, viewportType || 'desktop');
    Logger.info('ProductsPage ready', { context: 'fixture' });
    await use(poms.productsPage);
  },

  /**
   * ordersPage: POM cho trang Orders List (/admin/orders)
   *
   * Không tự động navigate - test sẽ gọi goto()
   */
  ordersPage: async (
    { authedPage, viewportType }: AppDeps,
    use: (r: NekoPOMs['ordersPage']) => Promise<void>
  ) => {
    const poms = createNekoPOMs(authedPage, viewportType || 'desktop');
    Logger.info('OrdersPage ready', { context: 'fixture' });
    await use(poms.ordersPage);
  },

  /**
   * chatPage: POM cho trang Chat (/chat)
   *
   * Không tự động navigate - test sẽ gọi goto()
   */
  chatPage: async (
    { authedPage, viewportType }: AppDeps,
    use: (r: NekoPOMs['chatPage']) => Promise<void>
  ) => {
    const poms = createNekoPOMs(authedPage, viewportType || 'desktop');
    Logger.info('ChatPage ready', { context: 'fixture' });
    await use(poms.chatPage);
  },
};

