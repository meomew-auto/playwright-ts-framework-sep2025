/**
 * ============================================================================
 * NEKO PRODUCTS PAGE — POM cho trang danh sách sản phẩm (public storefront)
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Automate trang hiển thị sản phẩm cho khách hàng của Neko Coffee.
 * URL: https://coffee.autoneko.com/products
 *
 * 📌 KEY PATTERNS:
 * - GridResolver + CollectionHelper: đọc product cards (grid, không phải table)
 * - PRODUCT_FIELD_MAP: map field names → CSS selectors trong mỗi card
 * - Navigation bar: Home, Shop, About, Order Tracking, Register, Login
 * - Pagination: button-based with chevron icons
 *
 * 📌 GRID vs TABLE:
 * - CMS dùng TableResolver (có <th> headers → tự detect columns)
 * - Neko dùng GridResolver (cards layout → cần FIELD_MAP thủ công)
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: GridResolver, CollectionHelper (@collection/)
 * - Fixture: neko/ui/app.fixture.ts (productsPage)
 * - Extends: BasePage
 */
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { ViewportType } from '../../fixtures/common/ViewportType';
import { GridResolver } from '@collection/GridResolver';
import { CollectionHelper } from '@collection/CollectionHelper';
import { TextMatcher } from '@collection/FieldResolver';

// ============================================================
// 📌 FIELD MAP — CSS selectors cho từng field trong product card
// ============================================================

// Field selectors for product cards (matching actual DOM)
const PRODUCT_FIELD_MAP = {
  name: 'h3',                                    // Product title in h3
  price: 'p.text-primary.text-xl',               // Price with specific classes
  image: 'img',                                   // Product image
  category: 'p.text-\\[\\#c9ac92\\]',           // Category badge (uppercase)
} as const;

export class ProductsPage extends BasePage {
  // Collection helper for product cards
  private readonly gridResolver = new GridResolver(PRODUCT_FIELD_MAP);
  private readonly collectionHelper = new CollectionHelper(this.gridResolver);

  // ──────────────────────────────────────────────────────────
  // 🔹 PAGE LOCATORS: Định nghĩa tất cả selectors cho page
  // ──────────────────────────────────────────────────────────
  private readonly pageLocators = {
    // Header / Navigation
    logo: (page: Page) => page.getByRole('link', { name: /Neko Coffee/i }),
    navHome: (page: Page) => page.getByRole('link', { name: 'Trang chủ' }),
    navShop: (page: Page) => page.getByRole('link', { name: 'Cửa hàng' }),
    navAbout: (page: Page) => page.getByRole('link', { name: 'Về chúng tôi' }),
    navOrderTracking: (page: Page) => page.getByRole('link', { name: 'Tra cứu đơn' }),
    navRegister: (page: Page) => page.getByRole('link', { name: 'Đăng ký' }),
    navLogin: (page: Page) => page.getByRole('link', { name: 'Đăng nhập' }),

    // Page Title / Heading
    pageTitle: (page: Page) => page.getByRole('heading', { name: 'Cửa hàng', level: 1 }),

    // Breadcrumb
    breadcrumbHome: (page: Page) => page.locator('a[href="/"]').filter({ hasText: 'Trang chủ' }),

    // Products Grid / List - Use prefix selector for product cards
    productsList: (page: Page) => page.locator('[data-testid="products-list"]'),
    productCards: (page: Page) => page.locator('[data-testid^="product-card-"]'),
    productCount: (page: Page) => page.getByText(/Hiển thị \d+ sản phẩm/),

    // Product Card - dynamic locators
    productCardByName: (page: Page, name: string) =>
      page.locator('[data-testid^="product-card-"]').filter({ hasText: name }),
    productCardByIndex: (page: Page, index: number) =>
      page.locator('[data-testid^="product-card-"]').nth(index),


    // Filters (if any)
    categoryFilter: (page: Page) => page.locator('[data-testid="category-filter"]'),
    priceFilter: (page: Page) => page.locator('[data-testid="price-filter"]'),
    sortDropdown: (page: Page) => page.locator('[data-testid="sort-dropdown"]'),

    // Pagination - uses button elements with chevron icons
    pagination: (page: Page) => page.locator('main').locator('button').filter({ hasText: /^\d+$|chevron/ }).locator('..'),
    paginationNext: (page: Page) => page.getByRole('button', { name: 'chevron_right' }),
    paginationPrev: (page: Page) => page.getByRole('button', { name: 'chevron_left' }),
    paginationButtons: (page: Page) => page.locator('main').locator('button').filter({ hasText: /^\d+$/ }),

    // Footer
    footer: (page: Page) => page.locator('footer'),
    footerCopyright: (page: Page) => page.getByText(/© \d{4} Neko Coffee/),
  } as const;

  // ──────────────────────────────────────────────────────────
  // 🔹 ELEMENT GETTER
  // ──────────────────────────────────────────────────────────
  public element = this.createLocatorGetter(this.pageLocators);

  constructor(page: Page, viewportType: ViewportType = 'desktop') {
    super(page, viewportType);
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 NAVIGATION & PAGE VERIFICATION
  // ═══════════════════════════════════════════════════════════

  async goto() {
    await this.navigateTo('/products');
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/products/);
    await expect(this.element('pageTitle')).toBeVisible();
    // Wait for at least one product card to be visible (web-first assertion)
    await expect(this.element('productCards').first()).toBeVisible();
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 PRODUCT LIST METHODS
  // ═══════════════════════════════════════════════════════════

  /**
   * Lấy số lượng sản phẩm hiển thị trên trang
   */
  async getProductCount(): Promise<number> {
    const cards = this.element('productCards');
    return cards.count();
  }

  /**
   * Lấy text hiển thị số lượng sản phẩm (e.g., "Hiển thị 6 sản phẩm")
   */
  async getProductCountText(): Promise<string> {
    const countElement = this.element('productCount');
    return (await countElement.textContent()) || '';
  }

  /**
   * Lấy danh sách tên tất cả sản phẩm hiện tại (using CollectionHelper)
   */
  async getProductNames(): Promise<string[]> {
    return this.collectionHelper.getFieldValues(this.element('productCards'), 'name');
  }

  /**
   * Lấy danh sách giá tất cả sản phẩm
   */
  async getProductPrices(): Promise<string[]> {
    return this.collectionHelper.getFieldValues(this.element('productCards'), 'price');
  }

  /**
   * Tìm product card theo tên (using CollectionHelper)
   * Accepts string, RegExp, or function matcher
   */
  async findProductByName(name: TextMatcher) {
    return this.collectionHelper.findItem(this.element('productCards'), 'name', name);
  }

  /**
   * Lấy dữ liệu của một product card
   */
  async getProductData(productName: string): Promise<Record<string, string>> {
    const card = await this.findProductByName(productName);
    return this.collectionHelper.getItemData(card, ['name', 'price', 'type']);
  }

  /**
   * Lấy dữ liệu tất cả products hiện tại
   */
  async getAllProductsData(): Promise<Array<Record<string, string>>> {
    return this.collectionHelper.getCollectionData(
      this.element('productCards'),
      ['name', 'price']
    );
  }

  /**
   * Click vào sản phẩm theo tên
   */
  async clickProduct(productName: string): Promise<void> {
    const card = this.element('productCardByName')(productName);
    await this.clickWithLog(card);
  }

  /**
   * Click vào sản phẩm theo index (0-based)
   */
  async clickProductByIndex(index: number): Promise<void> {
    const card = this.element('productCardByIndex')(index);
    await this.clickWithLog(card);
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 NAVIGATION METHODS
  // ═══════════════════════════════════════════════════════════

  async clickNavHome(): Promise<void> {
    await this.clickWithLog(this.element('navHome'));
  }

  async clickNavShop(): Promise<void> {
    await this.clickWithLog(this.element('navShop'));
  }

  async clickNavAbout(): Promise<void> {
    await this.clickWithLog(this.element('navAbout'));
  }

  async clickNavOrderTracking(): Promise<void> {
    await this.clickWithLog(this.element('navOrderTracking'));
  }

  async clickNavRegister(): Promise<void> {
    await this.clickWithLog(this.element('navRegister'));
  }

  async clickNavLogin(): Promise<void> {
    await this.clickWithLog(this.element('navLogin'));
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 FILTER & SORT METHODS (nếu trang có filter)
  // ═══════════════════════════════════════════════════════════

  /**
   * Chọn danh mục (nếu có filter)
   */
  async selectCategory(categoryName: string): Promise<void> {
    const filter = this.element('categoryFilter');
    // TODO: Implement khi có filter thực tế
    await filter.click();
  }

  /**
   * Sắp xếp sản phẩm
   */
  async sortBy(option: string): Promise<void> {
    const dropdown = this.element('sortDropdown');
    // TODO: Implement khi có sort dropdown thực tế
    await dropdown.click();
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 PAGINATION METHODS (nếu trang có pagination)
  // ═══════════════════════════════════════════════════════════

  async goToNextPage(): Promise<void> {
    const nextBtn = this.element('paginationNext');
    await this.clickWithLog(nextBtn);
    // Wait for products to update
    await this.element('productCards').first().waitFor({ state: 'visible' });
  }

  async goToPrevPage(): Promise<void> {
    const prevBtn = this.element('paginationPrev');
    await this.clickWithLog(prevBtn);
    await this.element('productCards').first().waitFor({ state: 'visible' });
  }

  async hasPagination(): Promise<boolean> {
    const pageButtons = this.element('paginationButtons');
    const count = await pageButtons.count();
    return count > 1; // More than 1 page means pagination exists
  }

  /**
   * Get total number of pages from pagination
   */
  async getTotalPages(): Promise<number> {
    const pageButtons = this.element('paginationButtons');
    const count = await pageButtons.count();
    
    if (count === 0) {
      return 1; // No pagination = 1 page
    }
    
    // Find the highest page number
    let maxPage = 1;
    for (let i = 0; i < count; i++) {
      const text = await pageButtons.nth(i).textContent();
      const num = parseInt(text || '', 10);
      if (!isNaN(num) && num > maxPage) {
        maxPage = num;
      }
    }
    
    return maxPage;
  }

  /**
   * Go to specific page
   */
  async goToPage(pageNumber: number): Promise<void> {
    const pageButton = this.element('paginationButtons').filter({ hasText: new RegExp(`^${pageNumber}$`) });
    await this.clickWithLog(pageButton);
    // Wait for products to update
    await this.element('productCards').first().waitFor({ state: 'visible' });
  }

  /**
   * Go to first page
   */
  async goToFirstPage(): Promise<void> {
    await this.goToPage(1);
  }

  /**
   * Get current page number
   */
  async getCurrentPage(): Promise<number> {
    const pagination = this.element('pagination');
    const activePage = pagination.locator('.page-item.active, [aria-current="page"]');
    const text = await activePage.textContent();
    return parseInt(text || '1', 10) || 1;
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 SEARCH ACROSS PAGES
  // ═══════════════════════════════════════════════════════════

  /**
   * Find product by name across all pages
   *
   * @param name - Product name to find (string, regex, or function)
   * @returns Product card locator and page number where found
   *
   * @example
   * ```typescript
   * const { item, pageNumber } = await productsPage.findProductByNameAcrossPages('Indonesia Java Estate');
   * console.log(`Found on page ${pageNumber}`);
   * await item.click();
   * ```
   */
  async findProductByNameAcrossPages(name: TextMatcher): Promise<{ item: Locator; pageNumber: number }> {
    return this.collectionHelper.findItemWithNextPage(
      () => this.element('productCards'),
      'name',
      name,
      {
        getTotalPages: () => this.getTotalPages(),
        goToNextPage: () => this.goToNextPage(),
        goToFirstPage: () => this.goToFirstPage(),
      }
    );
  }
}
