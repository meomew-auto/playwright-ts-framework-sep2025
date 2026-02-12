/**
 * ============================================================================
 * CMS ALL PRODUCTS PAGE — POM cho trang danh sách sản phẩm CMS
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Automate bảng sản phẩm: đọc data, search, filter, sort, pagination, bulk actions.
 * URL: /admin/products
 *
 * 📌 KEY PATTERNS:
 * - TableResolver + CollectionHelper: đọc table data theo column headers
 * - fieldCleaners: clean text trước khi so sánh (bỏ ký tự thừa)
 * - Responsive locators: desktop vs mobile layout
 * - Bulk actions: select all → delete
 *
 * 📚 SECTIONS:
 * - Types: ProductColumnKey (union type cho column names)
 * - Locators: pageLocators (static) + responsive overrides
 * - Table ops: getTableData, getColumnValues, search, filter
 * - Pagination: goToNextPage, getMaxPages
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: TableResolver, CollectionHelper (@collection/)
 * - Fixture: cms/ui/app.fixture.ts (allProductsPage)
 * - Extends: BasePage
 */
import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { ViewportType } from '../../fixtures/common/ViewportType';
import { TableResolver } from '@collection/TableResolver';
import { CollectionHelper } from '@collection/CollectionHelper';
import { TextMatcher, FieldCleanerMap } from '@collection/FieldResolver';
import { Logger } from '../../utils/Logger';

// ============================================================
// 📌 TYPES - Định nghĩa các key cho Table Columns
// ============================================================

/**
 * Key cho các cột trong bảng All Products
 */
export type ProductColumnKey =
  | 'select'        // Cột checkbox (đầu tiên)
  | 'name'          // Tên sản phẩm
  | 'addedBy'       // Added By
  | 'info'          // Info (Num of Sale, Base Price, Rating)
  | 'totalStock'    // Total Stock
  | 'todaysDeal'    // Todays Deal
  | 'published'     // Published
  | 'featured'      // Featured
  | 'options';      // Options (View, Edit, Duplicate, Delete)

/**
 * Danh sách cột mặc định để lấy data từ bảng
 */
export const DEFAULT_PRODUCT_TABLE_COLUMNS: ProductColumnKey[] = [
  'name',
  'addedBy',
  'info',
  'totalStock',
  'todaysDeal',
  'published',
  'featured',
] as const;

// ============================================================
// 📌 PAGE OBJECT MODEL: CMSAllProductsPage
// ============================================================

export class CMSAllProductsPage extends BasePage {
  // ──────────────────────────────────────────────────────────
  // 🔹 PAGE LOCATORS: Định nghĩa tất cả selectors cho page (BASE - Desktop)
  // ──────────────────────────────────────────────────────────
  private readonly pageLocators = {
    pageTitle: (page: Page) =>
      page.locator('.aiz-titlebar h1, .aiz-titlebar h2, .aiz-titlebar h3').filter({ hasText: 'All products' }),
    addNewProductButton: 'a.btn-circle.btn-info',
    productsTable: '.table.aiz-table',
    tableHeaders: '.table.aiz-table thead th',
    tableRows: '.table.aiz-table tbody tr',
    searchInput: '#search',
    sellerSelect: 'select#user_id',
    sellerSelectButton: (page: Page) => page.locator('button[data-id="user_id"]'),
    sortSelect: 'select#type',
    sortSelectButton: (page: Page) => page.locator('button[data-id="type"]'),
    bulkActionButton: (page: Page) => page.getByRole('button', { name: 'Bulk Action' }),
    bulkDeleteMenuItem: 'a.dropdown-item.confirm-alert[data-target="#bulk-delete-modal"]',
    bulkDeleteModal: '#bulk-delete-modal',
    bulkDeleteConfirmButton: (page: Page) => page.locator('#bulk-delete-modal').locator('a.btn-primary[onclick*="bulk_delete"]'),
    paginationContainer: '.aiz-pagination',
    paginationNext: (page: Page) => page.locator('.aiz-pagination .pagination .page-item:has(a[rel="next"])'),
    paginationPageLink: (page: Page, pageNumber: number) =>
      page.locator('.aiz-pagination .pagination .page-item').filter({ hasText: new RegExp(`^${pageNumber}$`) }).locator('a'),
  } as const;

  // ──────────────────────────────────────────────────────────
  // 🔹 MOBILE OVERRIDES: Locators khác biệt trên mobile
  // ──────────────────────────────────────────────────────────
  private readonly mobileOverrides = {
    // Mobile: Loại bỏ các row mở rộng của footable (expanded detail rows)
    tableRows: '.table.aiz-table tbody tr:not(.footable-detail-row)',
    // Thêm các mobile-specific overrides khác ở đây khi cần
  } as const;

  // ──────────────────────────────────────────────────────────
  // 🔹 RESPONSIVE LOCATOR GETTER
  // Tự động chọn locator đúng dựa vào viewport
  // ──────────────────────────────────────────────────────────
  private readonly getLocator = this.createResponsiveLocatorGetter(
    this.pageLocators,
    { mobile: this.mobileOverrides }
  );

  constructor(page: Page, viewportType: ViewportType = 'desktop') {
    super(page, viewportType);
  }

  // ═══════════════════════════════════════════════════════════
  // 📦 COLLECTION HELPER - Lazy initialized
  // ═══════════════════════════════════════════════════════════
  private tableResolver: TableResolver | null = null;
  private _collectionHelper: CollectionHelper<TableResolver> | null = null;

  /**
   * Đảm bảo TableResolver + CollectionHelper đã được khởi tạo
   */
  private async ensureCollectionHelper(): Promise<CollectionHelper<TableResolver>> {
    if (!this._collectionHelper || !this.tableResolver) {
      await this.waitForTableReady();
      this.tableResolver = await TableResolver.create(this.getLocator('tableHeaders'));
      this._collectionHelper = new CollectionHelper(this.tableResolver);
    }
    return this._collectionHelper;
  }

  /**
   * Reset collection helper cache (gọi khi navigate, search, filter)
   */
  private resetCollectionCache(): void {
    this.tableResolver = null;
    this._collectionHelper = null;
  }

  /**
   * Simple text cleaners cho CollectionHelper
   * Chỉ xử lý text-based transformations
   */
  private get fieldCleaners(): FieldCleanerMap {
    return {
      name: (text: string) => text.trim(),
      // Collapse multiline whitespace → single line, separated by " | "
      // "Num of Sale: 0 Times \n       Base Price: $509.19" → "Num of Sale: 0 Times | Base Price: $509.19"
      info: (text: string) => text.split(/\s*\n\s*/).map(s => s.trim()).filter(Boolean).join(' | '),
      totalStock: (text: string) => {
        const trimmed = text.trim();
        const match = trimmed.match(/^\d+/);
        return match ? match[0] : trimmed;
      },
    };
  }

  /**
   * Lấy giá trị name từ cell (xử lý DOM phức tạp: image + text)
   */
  private async getNameFromCell(cell: Locator): Promise<string> {
    const nameText = await cell.locator('span.text-muted').textContent().catch(() => null);
    if (nameText) return nameText.trim();
    const raw = (await cell.textContent()) || '';
    return raw.trim();
  }

  /**
   * Lấy giá trị checkbox từ cell (Yes/No)
   */
  private async getCheckboxValue(cell: Locator, selector = 'input[type="checkbox"]'): Promise<string> {
    const checkbox = cell.locator(selector);
    const isChecked = await checkbox.isChecked().catch(() => false);
    return isChecked ? 'Yes' : 'No';
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 NAVIGATION & PAGE VERIFICATION
  // ═══════════════════════════════════════════════════════════

  async goto() {
    await this.navigateTo('/admin/products/all');
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/products\/all/);
    await expect(this.getLocator('pageTitle')).toBeVisible();
    await expect(this.getLocator('productsTable')).toBeVisible();
  }

  async clickAddNewProduct() {
    await this.clickWithLog(this.getLocator('addNewProductButton'));
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 TABLE LOADING STATE
  // ═══════════════════════════════════════════════════════════

  /**
   * Đợi bảng load xong với nhiều checks để đảm bảo chắc chắn
   */
  async waitForTableReady() {
    const table = this.getLocator('productsTable');

    // 1. Table visible
    await expect(table).toBeVisible({ timeout: 10000 });

    // 2. Headers đã render
    const headers = this.getLocator('tableHeaders');
    await expect(headers.first()).toBeVisible({ timeout: 5000 });

    // 3. Ít nhất 1 row visible (name cell là indicator chính)
    const rows = this.getRowsLocator();
    await expect(rows.first()).toBeVisible({ timeout: 5000 });

    const firstRow = rows.first();
    const nameCell = firstRow.locator('td').nth(1);
    await expect(nameCell).toBeVisible({ timeout: 5000 });
  }

  /**
   * Các cột chứa checkbox — cần đọc isChecked() thay vì textContent()
   */
  private static readonly CHECKBOX_COLUMNS = new Set([
    'select', 'todaysDeal', 'published', 'featured',
  ]);

  /**
   * Lấy giá trị từ một field cho một row
   * Checkbox columns: đọc isChecked() → "Yes"/"No"
   * Regular columns: dùng CollectionHelper.getFieldValue()
   */
  private async getFieldValueForRow(
    row: Locator,
    field: string,
  ): Promise<string> {
    const helper = await this.ensureCollectionHelper();
    if (CMSAllProductsPage.CHECKBOX_COLUMNS.has(field)) {
      const cell = this.tableResolver!.resolve(row, field);
      const selector = field === 'select'
        ? 'input[type="checkbox"].check-one'
        : 'input[type="checkbox"]';
      return this.getCheckboxValue(cell, selector);
    }
    return helper.getFieldValue(row, field, this.fieldCleaners);
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 TABLE DATA EXTRACTION - Lấy dữ liệu từ bảng
  // ═══════════════════════════════════════════════════════════

  private getRowsLocator(): Locator {
    return this.getLocator('tableRows');
  }

  async getRowCount(): Promise<number> {
    await this.waitForTableReady();
    return this.getRowsLocator().count();
  }

  /**
   * Lấy tất cả giá trị của một cột
   */
  async getColumnValues(columnKey: ProductColumnKey | string): Promise<string[]> {
    await this.ensureCollectionHelper();
    const rows = this.getRowsLocator();
    const count = await rows.count();
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      values.push(await this.getFieldValueForRow(rows.nth(i), columnKey));
    }
    return values;
  }

  /**
   * Lấy dữ liệu của nhiều cột từ bảng
   */
  async getTableData(columnKeys: Array<ProductColumnKey | string>): Promise<Array<Record<string, string>>> {
    await this.ensureCollectionHelper();
    const rows = this.getRowsLocator();
    const count = await rows.count();
    const result: Array<Record<string, string>> = [];

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const data: Record<string, string> = {};
      for (const key of columnKeys) {
        data[key] = await this.getFieldValueForRow(row, key);
      }
      result.push(data);
    }
    return result;
  }

  /**
   * Lấy dữ liệu của tất cả các cột mặc định
   */
  async getDefaultTableData() {
    return this.getTableData(DEFAULT_PRODUCT_TABLE_COLUMNS as unknown as Array<ProductColumnKey>);
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 TABLE ROW FINDER - Tìm row theo điều kiện
  // ═══════════════════════════════════════════════════════════

  /**
   * Tìm row đầu tiên khớp với giá trị cột
   */
  async findRowByColumnValue(
    columnKey: ProductColumnKey | string,
    matcher: TextMatcher
  ): Promise<Locator> {
    const helper = await this.ensureCollectionHelper();
    return helper.findItem(
      this.getRowsLocator(),
      columnKey,
      matcher,
      this.fieldCleaners
    );
  }

  /**
   * Tìm row đầu tiên khớp với filters (chỉ tìm trong trang hiện tại)
   */
  async findRowByFilters(
    filters: Record<ProductColumnKey | string, TextMatcher>
  ): Promise<Locator> {
    const helper = await this.ensureCollectionHelper();
    return helper.findItemByFilters(
      this.getRowsLocator(),
      filters,
      this.fieldCleaners
    );
  }

  /**
   * Lấy dữ liệu từ row cho nhiều columns (checkbox-aware)
   */
  private async getRowDataForItem(
    row: Locator,
    columnKeys: Array<ProductColumnKey | string>,
  ): Promise<Record<string, string>> {
    const data: Record<string, string> = {};
    for (const key of columnKeys) {
      data[key] = await this.getFieldValueForRow(row, key);
    }
    return data;
  }

  /**
   * Lấy dữ liệu của row khớp với filters
   */
  async getRowDataByFilters(
    filters: Record<ProductColumnKey | string, TextMatcher>,
    columnKeys?: Array<ProductColumnKey | string>
  ): Promise<Record<string, string>> {
    const row = await this.findRowByFilters(filters);
    return this.getRowDataForItem(
      row,
      columnKeys || (DEFAULT_PRODUCT_TABLE_COLUMNS as unknown as Array<ProductColumnKey>),
    );
  }

  /**
   * Pagination helper: go to next page
   */
  private async goToNextPageHelper(): Promise<boolean> {
    const nextButton = this.getLocator('paginationNext');
    const isNextDisabled = (await nextButton.count()) === 0;
    if (isNextDisabled) {
      return false;
    }
    await this.clickWithLog(nextButton.locator('a'));
    await this.waitForTableReady();
    // Clear cache khi chuyển trang
    this.resetCollectionCache();
    return true;
  }

  /**
   * Pagination helper: get max pages
   */
  private async getMaxPagesHelper(): Promise<number> {
    const pagination = this.getLocator('paginationContainer');
    const pageItems = pagination.locator('.pagination .page-item');
    const pageCount = await pageItems.count();
    
    if (pageCount === 0) {
      return 1;
    }
    
    // Tìm số trang lớn nhất từ các page links
    let maxPage = 1;
    for (let i = 0; i < pageCount; i++) {
      const pageItem = pageItems.nth(i);
      const pageLink = pageItem.locator('a, span');
      const text = await pageLink.textContent();
      const pageNum = Number(text?.trim());
      if (!Number.isNaN(pageNum) && pageNum > maxPage) {
        maxPage = pageNum;
      }
    }
    
    return maxPage;
  }

  /**
   * Tìm row đầu tiên khớp với filters qua nhiều trang
   * Tự động: về trang đầu → detect tổng trang → scan tất cả
   * @returns { row, pageNumber } — row Locator + trang tìm thấy
   */
  async findRowByFiltersAcrossPages(
    filters: Record<ProductColumnKey | string, TextMatcher>,
    options?: { maxPages?: number }
  ): Promise<{ row: Locator; pageNumber: number }> {
    const helper = await this.ensureCollectionHelper();
    const result = await helper.findItemWithNextPage(
      () => this.getRowsLocator(),
      Object.keys(filters)[0],
      Object.values(filters)[0],
      {
        getTotalPages: () => this.getMaxPagesHelper(),
        goToNextPage: async () => { await this.goToNextPageHelper(); },
      },
      this.fieldCleaners
    );
    return { row: result.item, pageNumber: result.pageNumber };
  }

  /**
   * Lấy dữ liệu của row khớp với filters qua nhiều trang
   * @returns { data, pageNumber } — row data + trang tìm thấy
   */
  async getRowDataByFiltersAcrossPages(
    filters: Record<ProductColumnKey | string, TextMatcher>,
    options?: { maxPages?: number },
    columnKeys?: Array<ProductColumnKey | string>
  ): Promise<{ data: Record<string, string>; pageNumber: number }> {
    const { row, pageNumber } = await this.findRowByFiltersAcrossPages(filters, options);
    const data = await this.getRowDataForItem(
      row,
      columnKeys || (DEFAULT_PRODUCT_TABLE_COLUMNS as unknown as Array<ProductColumnKey>),
    );
    return { data, pageNumber };
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 TABLE ROW ACTIONS - Thao tác trên row
  // ═══════════════════════════════════════════════════════════

  async clickRowAction(productNameMatcher: TextMatcher, action: 'View' | 'Edit' | 'Duplicate' | 'Delete') {
    const row = await this.findRowByColumnValue('name', productNameMatcher);
    await row.scrollIntoViewIfNeeded();
    await row.hover({ force: true });
    
    const actionButton = row.locator(`a[title="${action}"]`).first();
    await expect(actionButton).toBeVisible();
    await this.clickWithLog(actionButton);
  }

  async viewProduct(productNameMatcher: TextMatcher) {
    await this.clickRowAction(productNameMatcher, 'View');
  }

  async editProduct(productNameMatcher: TextMatcher) {
    await this.clickRowAction(productNameMatcher, 'Edit');
  }

  async duplicateProduct(productNameMatcher: TextMatcher) {
    await this.clickRowAction(productNameMatcher, 'Duplicate');
  }

  async deleteProduct(productNameMatcher: TextMatcher) {
    await this.clickRowAction(productNameMatcher, 'Delete');
    
    // Handle confirm dialog - có thể là SweetAlert2 hoặc Bootstrap modal
    // Đợi dialog xuất hiện
    const dialog = this.page.locator('.swal2-popup, .modal.show, [role="dialog"]').first();
    await this.expectVisible(dialog, '[deleteProduct] Delete confirmation dialog', 5000);
    
    // Tìm button confirm - thử nhiều locator
    const confirmButton = dialog.locator(
      'button:has-text("Delete"), ' +
      'button:has-text("OK"), ' +
      'button:has-text("Confirm"), ' +
      'button.btn-danger, ' +
      'button.swal2-confirm, ' +
      'a:has-text("Delete"), ' +
      'a.btn-danger'
    ).first();
    
    await this.expectVisible(confirmButton, '[deleteProduct] Delete confirm button', 3000);
    await this.clickWithLog(confirmButton);
    
    // Đợi dialog đóng
    await this.expectHidden(dialog, '[deleteProduct] Delete confirmation dialog', 10000);
    
    // Đợi delete hoàn thành
    await this.page.waitForTimeout(1000);
  }

  async toggleRowCheckboxByName(productNameMatcher: TextMatcher, checked: boolean) {
    const row = await this.findRowByColumnValue('name', productNameMatcher);
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    
    // Tìm checkbox input trong row - checkbox nằm trong cột đầu tiên (td đầu tiên)
    // Cấu trúc: <tr><td><div><label><input class="check-one"><span class="aiz-square-check"></span></label></div></td>...
    const checkbox = row.locator('td').first().locator('input[type="checkbox"].check-one').first();
    
    // Verify checkbox tồn tại và visible
    await this.expectVisible(checkbox, '[toggleRowCheckboxByName] Checkbox');
    
    // Kiểm tra trạng thái hiện tại
    const isCurrentlyChecked = await checkbox.isChecked().catch(() => false);
    
    if (checked && !isCurrentlyChecked) {
      // Click vào span.aiz-square-check thay vì input trực tiếp (hoạt động tốt hơn khi responsive)
      const checkboxSpan = row.locator('td').first().locator('span.aiz-square-check').first();
      await this.expectVisible(checkboxSpan, '[toggleRowCheckboxByName] Checkbox span');
      await this.clickWithLog(checkboxSpan);
      
      // Verify đã check thành công
      await expect(checkbox).toBeChecked({ timeout: 2000 });
    } else if (!checked && isCurrentlyChecked) {
      // Uncheck cũng click vào span
      const checkboxSpan = row.locator('td').first().locator('span.aiz-square-check').first();
      await this.expectVisible(checkboxSpan, '[toggleRowCheckboxByName] Checkbox span');
      await this.clickWithLog(checkboxSpan);
      
      // Verify đã uncheck
      await expect(checkbox).not.toBeChecked({ timeout: 2000 });
    }
  }

  /**
   * Select multiple products by names và thực hiện bulk delete
   * @param productNameMatchers - Mảng các tên sản phẩm cần delete
   */
  async bulkDeleteProducts(productNameMatchers: TextMatcher[]) {
    await this.waitForTableReady();
    
    // Step 1: Select tất cả products
    console.log(`[Bulk Delete] Selecting ${productNameMatchers.length} products...`);
    for (const nameMatcher of productNameMatchers) {
      await this.toggleRowCheckboxByName(nameMatcher, true);
    }
    
    // Step 2: Click Bulk Action button
    const bulkActionButton = this.getLocator('bulkActionButton');
    await this.clickWithLog(bulkActionButton);
    await this.page.waitForTimeout(300);
    
    // Step 3: Click "Delete selection"
    const bulkDeleteMenuItem = this.getLocator('bulkDeleteMenuItem');
    await expect(bulkDeleteMenuItem).toBeVisible();
    await this.clickWithLog(bulkDeleteMenuItem);
    
    // Step 4: Wait for modal và confirm
    const bulkDeleteModal = this.getLocator('bulkDeleteModal');
    await this.expectVisible(bulkDeleteModal, '[bulkDeleteProducts] Bulk delete modal');
    
    const confirmButton = this.getLocator('bulkDeleteConfirmButton');
    await this.expectVisible(confirmButton, '[bulkDeleteProducts] Delete confirm button');
    await this.clickWithLog(confirmButton);
    
    // Step 5: Wait for delete to complete (modal sẽ đóng sau khi delete)
    await this.expectHidden(bulkDeleteModal, '[bulkDeleteProducts] Bulk delete modal', 10000);
    await this.waitForTableReady();
    
    // Clear cache sau khi delete
    this.resetCollectionCache();
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 TABLE FILTERS & PAGINATION
  // ═══════════════════════════════════════════════════════════

  async search(term: string) {
    const searchInput = this.getLocator('searchInput');
    await searchInput.fill(term);
    await this.page.keyboard.press('Enter');
    await this.waitForTableReady();
    // Clear cache khi search để rebuild với data mới
    this.resetCollectionCache();
  }

  async clearSearch() {
    await this.search('');
  }

  async selectSeller(sellerName: string) {
    const selectButton = this.getLocator('sellerSelectButton');
    await this.helpers.selectBootstrapOption(selectButton, sellerName);
    await this.waitForTableReady();
    this.resetCollectionCache();
  }

  async selectSort(sortOption: string) {
    const selectButton = this.getLocator('sortSelectButton');
    await this.helpers.selectBootstrapOption(selectButton, sortOption);
    // Đợi page reload xong sau khi sort (tránh đọc data giữa lúc re-render)
    await this.page.waitForLoadState('networkidle');
    await this.waitForTableReady();
    this.resetCollectionCache();
  }

  async goToPage(pageNumber: number) {
    const pageLink = this.getLocator('paginationPageLink')(pageNumber);
    await this.clickWithLog(pageLink);
    await this.waitForTableReady();
    this.resetCollectionCache();
  }

  async goToNextPage() {
    const didNavigate = await this.goToNextPageHelper();
    if (!didNavigate) {
      throw new Error('Next page is not available');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 HELPER METHODS
  // ═══════════════════════════════════════════════════════════

  async getFirstProductName(): Promise<string> {
    const values = await this.getColumnValues('name');
    const firstNonEmpty = values.find((value) => value.trim().length > 0);
    return firstNonEmpty || '';
  }

  /**
   * Helper: Tìm một product ở trang tiếp theo để làm target test
   * Return name của product hoặc null nếu không tìm thấy/không có trang tiếp theo
   * Lưu ý: Sau khi gọi hàm này, page sẽ ở lại trang chứa target (không quay về trang 1)
   */
  async getTestTargetFromNextPage(): Promise<string | null> {
    try {
      await this.goToNextPage();
      const productNames = await this.getColumnValues('name');
      
      if (productNames.length > 0) {
        const target = productNames[0];
        Logger.info(`🎯 Tìm thấy target ở trang hiện tại: "${target}"`);
        return target;
      }
      
      Logger.info('⚠️ Trang tiếp theo trống');
      return null;
    } catch (error) {
      Logger.info(`⚠️ Không thể chuyển trang (có thể chỉ có 1 trang): ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 📱 MOBILE FOOTABLE METHODS - Expand/Collapse row details
  // ═══════════════════════════════════════════════════════════

  /**
   * Check if current viewport is mobile (based on viewportType)
   */
  isMobileViewport(): boolean {
    return this.viewportType === 'mobile';
  }

  /**
   * Expand a row to show footable details (mobile only)
   * @param row - Locator of the row to expand
   */
  async expandRow(row: Locator): Promise<void> {
    if (!this.isMobileViewport()) {
      console.log('[expandRow] Not on mobile viewport, skipping expand');
      return;
    }

    // Find the first visible cell which contains the toggle icon
    const toggleCell = row.locator('td.footable-first-visible').first();
    const toggleCellExists = await toggleCell.count() > 0;
    
    if (!toggleCellExists) {
      console.log('[expandRow] No footable-first-visible cell found, skipping');
      return;
    }

    // Find the toggle icon (span) inside the cell
    const toggleIcon = toggleCell.locator('span.footable-toggle').first();
    const toggleExists = await toggleIcon.count() > 0;
    
    if (!toggleExists) {
      console.log('[expandRow] No footable-toggle icon found, skipping');
      return;
    }

    // Check if already expanded (icon has fooicon-minus class when expanded)
    const isExpanded = await toggleIcon.evaluate((el) => 
      el.classList.contains('fooicon-minus')
    );

    if (isExpanded) {
      console.log('[expandRow] Row already expanded');
      return;
    }

    // Click to expand
    await this.clickWithLog(toggleIcon);
    
    // Wait for detail row to appear
    const detailRow = row.locator('+ tr.footable-detail-row');
    await expect(detailRow).toBeVisible({ timeout: 3000 });
    console.log('[expandRow] Row expanded successfully');
  }

  /**
   * Collapse a row to hide footable details (mobile only)
   * @param row - Locator of the row to collapse
   */
  async collapseRow(row: Locator): Promise<void> {
    if (!this.isMobileViewport()) {
      console.log('[collapseRow] Not on mobile viewport, skipping collapse');
      return;
    }

    // Find the first visible cell which contains the toggle icon
    const toggleCell = row.locator('td.footable-first-visible').first();
    const toggleCellExists = await toggleCell.count() > 0;
    
    if (!toggleCellExists) {
      console.log('[collapseRow] No footable-first-visible cell found, skipping');
      return;
    }

    // Find the toggle icon (span) inside the cell
    const toggleIcon = toggleCell.locator('span.footable-toggle').first();
    const toggleExists = await toggleIcon.count() > 0;
    
    if (!toggleExists) {
      console.log('[collapseRow] No footable-toggle icon found, skipping');
      return;
    }

    // Check if already collapsed (icon has fooicon-plus class when collapsed)
    const isCollapsed = await toggleIcon.evaluate((el) => 
      el.classList.contains('fooicon-plus')
    );

    if (isCollapsed) {
      console.log('[collapseRow] Row already collapsed');
      return;
    }

    // Click to collapse
    await this.clickWithLog(toggleIcon);
    
    // Wait for detail row to disappear
    const detailRow = row.locator('+ tr.footable-detail-row');
    await expect(detailRow).toBeHidden({ timeout: 3000 });
    console.log('[collapseRow] Row collapsed successfully');
  }

  /**
   * Get data from expanded footable detail row (mobile only)
   * @param row - The main row (not the detail row)
   * @returns Object with detail data
   */
  async getExpandedRowData(row: Locator): Promise<Record<string, string>> {
    if (!this.isMobileViewport()) {
      throw new Error('[getExpandedRowData] Only available on mobile viewport');
    }

    // Find the detail row (next sibling with class footable-detail-row)
    const detailRow = row.locator('+ tr.footable-detail-row');
    const isVisible = await detailRow.isVisible();
    
    if (!isVisible) {
      throw new Error('[getExpandedRowData] Detail row is not visible. Please expand the row first.');
    }

    const data: Record<string, string> = {};
    
    // Get all detail rows from the nested table
    const detailRows = detailRow.locator('table.footable-details tbody tr');
    const count = await detailRows.count();

    for (let i = 0; i < count; i++) {
      const detailRowItem = detailRows.nth(i);
      const th = await detailRowItem.locator('th').textContent();
      const td = await detailRowItem.locator('td').textContent();
      
      if (th && td) {
        // Clean key: trim whitespace
        const key = th.trim();
        
        // Clean value: normalize whitespace (replace multiple spaces/newlines with single space)
        const value = td
          .replace(/\s+/g, ' ')  // Replace multiple whitespace chars with single space
          .trim();               // Remove leading/trailing whitespace
        
        data[key] = value;
      }
    }

    console.log(`[getExpandedRowData] Retrieved ${Object.keys(data).length} fields from detail row`);
    return data;
  }
}

