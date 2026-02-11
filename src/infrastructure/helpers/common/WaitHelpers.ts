import { Page, expect } from '@playwright/test';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WAIT HELPERS - Common/Shared
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Generic wait helpers dùng chung cho TẤT CẢ projects.
 */
export class WaitHelpers {
  constructor(private page: Page) {}

  /**
   * Chờ network idle (không còn request nào pending)
   */
  async waitForNetworkIdle(timeout: number = 5000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Chờ page load hoàn tất
   */
  async waitForPageLoad(timeout: number = 10000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout });
  }

  /**
   * Chờ element visible với timeout
   */
  async waitForVisible(selector: string, timeout: number = 5000): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible({ timeout });
  }

  /**
   * Chờ element hidden
   */
  async waitForHidden(selector: string, timeout: number = 5000): Promise<void> {
    await expect(this.page.locator(selector)).toBeHidden({ timeout });
  }

  /**
   * Chờ URL match pattern
   */
  async waitForURL(pattern: string | RegExp, timeout: number = 10000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Delay execution (use sparingly - prefer explicit waits)
   */
  async delay(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
}
