/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VIEWPORT TYPE - Shared across all projects
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Type dùng chung cho multi-project. Mỗi project tự khai báo
 * viewportType option trong auth.fixture của mình.
 * 
 * 📚 CÁCH SỬ DỤNG:
 * 
 * 1. Import type trong auth.fixture.ts:
 *    import { ViewportType } from '../../common/ViewportType';
 * 
 * 2. Khai báo option trong auth fixture:
 *    viewportType: ['desktop', { option: true }],
 * 
 * 3. Set giá trị trong playwright.config.ts:
 *    projects: [
 *      { name: 'cms-desktop', use: { viewportType: 'desktop' } },
 *      { name: 'cms-mobile',  use: { ...devices['Pixel 5'], viewportType: 'mobile' } },
 *    ]
 * 
 * 4. Dùng trong Page Object:
 *    constructor(page: Page, viewportType: ViewportType = 'desktop')
 */

export type ViewportType = 'desktop' | 'tablet' | 'mobile';
