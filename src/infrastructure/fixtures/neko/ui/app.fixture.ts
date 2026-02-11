/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO APP FIXTURE — Page Object Model fixtures cho Neko UI tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Cung cấp POMs dưới dạng fixtures (giống pattern CMS app.fixture).
 * Export dạng object để spread vào gatekeeper.
 *
 * 📚 DEPENDENCY:
 * Mỗi POM nhận `authedPage` + `viewportType` từ auth.fixture.
 *
 * 🔗 LIÊN KẾT:
 * - Phụ thuộc: auth.fixture.ts (authedPage, viewportType)
 * - Dùng bởi: gatekeeper.fixture.ts (spread merge)
 */

import { PlaywrightTestArgs } from '@playwright/test';
import { AuthFixtures } from './auth.fixture';
import { ViewportType } from '../../common/ViewportType';
import { Logger } from '../../../utils/Logger';

// Import POMs
import { ProductsPage } from '../../../pages/neko-coffee/ProductsPage';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export type AppFixtures = {
  productsPage: ProductsPage;
};

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
    use: (r: ProductsPage) => Promise<void>
  ) => {
    const productsPage = new ProductsPage(authedPage, viewportType || 'desktop');
    Logger.info('ProductsPage ready', { context: 'fixture' });
    await use(productsPage);
  },
};
