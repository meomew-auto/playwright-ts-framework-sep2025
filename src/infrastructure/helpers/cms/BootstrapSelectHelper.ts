import { Locator, Page, expect } from '@playwright/test';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BOOTSTRAP SELECT HELPER - CMS Project
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Helper cho Bootstrap-Select component trong CMS.
 * CMS sử dụng thư viện bootstrap-select cho dropdown.
 */
export class BootstrapSelectHelper {
  constructor(private page: Page) {}

  /**
   * Chọn option cho bootstrap-select (single select)
   * @param button locator của dropdown button
   * @param optionText text hiển thị của option
   * @param dropdownId id của menu bs-select (vd: bs-select-1), nếu không truyền sẽ tự động lấy từ aria-owns của button
   */
  async selectBootstrapOption(button: Locator, optionText: string, dropdownId?: string): Promise<void> {
    // Đảm bảo button sẵn sàng
    await expect(button).toBeVisible();
    await button.scrollIntoViewIfNeeded();
    
    // Tự động lấy dropdown ID từ aria-owns nếu không được truyền vào
    let actualDropdownId = dropdownId;
    if (!actualDropdownId) {
      const ariaOwns = await button.getAttribute('aria-owns');
      if (ariaOwns) {
        actualDropdownId = ariaOwns;
      }
    }
    
    await button.click();

    // Xác định dropdown menu
    // Với bootstrap-select, cần tìm parent .dropdown-menu.show chứa #bs-select-X
    const dropdownMenu = actualDropdownId
      ? this.page.locator(`.dropdown-menu.show:has(#${actualDropdownId})`).first()
      : button.locator('..').locator('.dropdown-menu.show').first();
    
    // Chờ dropdown menu xuất hiện
    await expect(dropdownMenu).toBeVisible({ timeout: 5000 });

    // Xác định option - tìm trong #bs-select-X hoặc trong dropdown menu
    const optionLocator = actualDropdownId
      ? this.page.locator(`#${actualDropdownId} .dropdown-item, #${actualDropdownId} li a`).filter({ hasText: optionText }).first()
      : dropdownMenu.locator('.dropdown-item, li a').filter({ hasText: optionText }).first();

    await expect(optionLocator).toBeVisible();
    await optionLocator.scrollIntoViewIfNeeded();
    await optionLocator.click();

    // Chờ dropdown đóng lại (ẩn)
    await expect(dropdownMenu).toBeHidden();
  }

  /**
   * Chọn nhiều options cho bootstrap-select (multiple select)
   * @param button locator của dropdown button
   * @param optionTexts mảng text hiển thị của các options cần chọn
   * @param dropdownId id của menu bs-select, nếu không truyền sẽ tự động lấy từ aria-owns của button
   */
  async selectBootstrapOptions(button: Locator, optionTexts: string[], dropdownId?: string): Promise<void> {
    // Đảm bảo button sẵn sàng
    await expect(button).toBeVisible();
    await button.scrollIntoViewIfNeeded();
    
    // Tự động lấy dropdown ID từ aria-owns nếu không được truyền vào
    let actualDropdownId = dropdownId;
    if (!actualDropdownId) {
      const ariaOwns = await button.getAttribute('aria-owns');
      if (ariaOwns) {
        actualDropdownId = ariaOwns;
      }
    }
    
    await button.click();

    // Xác định dropdown menu
    const dropdownMenu = actualDropdownId
      ? this.page.locator(`.dropdown-menu.show:has(#${actualDropdownId})`).first()
      : button.locator('..').locator('.dropdown-menu.show').first();
    
    // Chờ dropdown menu xuất hiện
    await expect(dropdownMenu).toBeVisible({ timeout: 5000 });

    // Chọn từng option
    for (const optionText of optionTexts) {
      const optionLocator = actualDropdownId
        ? this.page.locator(`#${actualDropdownId} .dropdown-item, #${actualDropdownId} li a`)
            .filter({ hasText: new RegExp(optionText, 'i') })
            .first()
        : dropdownMenu.locator('.dropdown-item, li a')
            .filter({ hasText: new RegExp(optionText, 'i') })
            .first();

      await expect(optionLocator).toBeVisible({ timeout: 5000 });
      await optionLocator.scrollIntoViewIfNeeded();
      await optionLocator.click();
    }

    // Đóng dropdown bằng Escape (không tự đóng với multiple select)
    await this.page.keyboard.press('Escape');
    await expect(dropdownMenu).toBeHidden();
  }
}
