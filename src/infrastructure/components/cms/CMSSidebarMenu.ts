import { Locator, Page } from '@playwright/test';

/**
 * CMS Sidebar Menu Component
 * Xử lý navigation trong sidebar của CMS (Active eCommerce)
 * 
 * Component này được dùng bởi các page objects CMS để điều hướng
 * giữa các trang quản lý (Products, Orders, Customers, ...)
 */
export class CMSSidebarMenu {
  private readonly sidebar: Locator;
  private readonly menuItems: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('.aiz-sidebar');
    this.menuItems = this.sidebar.locator('.aiz-side-nav-item');
  }

  /**
   * Tìm menu item theo text
   * 
   * @param text - Text của menu item cần tìm
   * @returns Locator của menu item
   */
  private getMenuItemByText(text: string): Locator {
    return this.menuItems.filter({ 
      has: this.page.locator('.aiz-side-nav-text', { hasText: text }) 
    });
  }

  /**
   * Click vào menu item trong sidebar
   * 
   * @param menuText - Text của menu item cần click
   */
  async clickMenuItem(menuText: string): Promise<void> {
    console.log(`[CMSSidebarMenu] Click menu item: ${menuText}`);
    const menuItem = this.getMenuItemByText(menuText);
    await menuItem.locator('.aiz-side-nav-link').first().click();
  }

  /**
   * Click vào submenu item (menu con)
   * 
   * @param parentMenuText - Text của menu cha
   * @param subMenuText - Text của submenu cần click
   */
  async clickSubMenuItem(parentMenuText: string, subMenuText: string): Promise<void> {
    console.log(`[CMSSidebarMenu] Click submenu: ${parentMenuText} > ${subMenuText}`);
    
    // Tìm menu cha và expand nếu chưa mở
    const parentMenuItem = this.getMenuItemByText(parentMenuText);
    const parentLink = parentMenuItem.locator('.aiz-side-nav-link').first();
    
    // Kiểm tra xem menu đã mở chưa (có class active hoặc aria-expanded="true")
    const isExpanded = await parentLink.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await parentLink.click();
    }

    // Tìm và click submenu
    const subMenuItems = parentMenuItem.locator('.aiz-side-nav-list.level-2 .aiz-side-nav-item');
    const subMenuItem = subMenuItems.filter({
      has: this.page.locator('.aiz-side-nav-text', { hasText: subMenuText })
    });
    await subMenuItem.locator('.aiz-side-nav-link').first().click();
  }

  /**
   * Verify menu item có visible không
   * 
   * @param menuText - Text của menu item
   * @returns Promise<boolean>
   */
  async isMenuItemVisible(menuText: string): Promise<boolean> {
    const menuItem = this.getMenuItemByText(menuText);
    return await menuItem.isVisible();
  }
}
