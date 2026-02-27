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
import { BaseTablePage } from '../base/BaseTablePage';
import { ViewportType } from '../../fixtures/common/ViewportType';
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
 * Trick `string & {}` giữ IntelliSense autocomplete cho ProductColumnKey
 * mà vẫn chấp nhận string bất kỳ.
 * Dùng cho tham số đơn: columnKey, columnKeys[]
 */
type ColumnKey = ProductColumnKey | (string & {});

/**
 * Partial Record cho filters — cho phép truyền 1 vài key thay vì tất cả.
 * Ví dụ: `{ name: 'Product X' }` thay vì phải truyền đủ 9 key.
 */
type ColumnFilters = Partial<Record<ProductColumnKey, TextMatcher>> & Record<string, TextMatcher>;

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

export class CMSAllProductsPage extends BaseTablePage {
  // ──────────────────────────────────────────────────────────
  // 🔹 PAGE LOCATORS: Định nghĩa tất cả selectors cho page (BASE - Desktop)
  // ──────────────────────────────────────────────────────────
  private readonly pageLocators = {
    pageTitle: (page: Page) =>
      page.locator('.aiz-titlebar h1, .aiz-titlebar h2, .aiz-titlebar h3').filter({ hasText: 'All products' }),
    addNewProductButton: 'a.btn-circle.btn-info',
    // ⚠️ :not(.footable-details) — Footable tạo thêm <table class="footable-details table aiz-table">
    // bên trong expanded row → gây strict mode violation nếu không loại trừ.
    productsTable: '.table.aiz-table:not(.footable-details)',
    tableHeaders: '.table.aiz-table:not(.footable-details) thead th',
    tableRows: '.table.aiz-table:not(.footable-details) tbody tr',
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
  //
  // 📘 TẠI SAO CẦN OVERRIDE tableRows TRÊN MOBILE?
  //
  // Desktop: mỗi <tr> trong <tbody> = 1 sản phẩm → locator 'tbody tr' OK.
  //
  // Mobile (Footable): khi expand dòng, Footable CHÈN THÊM 1 <tr> chứa
  // detail ngay bên dưới main row:
  //
  //   <tbody>
  //     <tr class="footable-visible">...</tr>           ← main row (SP 1)
  //     <tr class="footable-detail-row">...</tr>        ← ⚠️ detail row (Footable tạo)
  //     <tr class="footable-visible">...</tr>           ← main row (SP 2)
  //   </tbody>
  //
  // Nếu dùng 'tbody tr' trên mobile → bắt cả detail rows → sai số lượng:
  //   getRowCount()         → 3 thay vì 2
  //   getColumnValues()     → trả thêm giá trị rác từ detail row
  //   findRowByColumnValue() → có thể match nhầm detail row
  //
  // Fix: dùng :not(.footable-detail-row) để chỉ bắt main rows.
  //
  private readonly mobileOverrides = {
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
  // 📦 ABSTRACT IMPLEMENTATIONS (from BaseTablePage)
  // ═══════════════════════════════════════════════════════════

  protected getTableHeadersLocator(): Locator {
    return this.getLocator('tableHeaders');
  }

  protected getTableRowsLocator(): Locator {
    return this.getLocator('tableRows');
  }

  protected getDefaultColumns(): string[] {
    return [...DEFAULT_PRODUCT_TABLE_COLUMNS];
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

  /**
   * Điều hướng đến trang All Products.
   */
  async goto() {
    await this.navigateTo('/admin/products/all');
  }

  /**
   * Verify trang All Products đã load hoàn tất.
   *
   * ⚠️ LƯU Ý QUAN TRỌNG: table visible ≠ rows loaded
   * ────────────────────────────────────────────────────
   * CMS render table structure (thead) TRƯỚC khi data rows (tbody tr) load.
   * Nếu chỉ check `productsTable.toBeVisible()` → fixture trả page object
   * → test gọi getFirstProductName() → tbody chưa có rows → trả "" → fail.
   *
   * Hiện tượng: chạy từng TC thì pass, chạy serial thì TC đầu fail.
   * Nguyên nhân: serial = liên tục navigate → server chậm hơn → rows load chậm.
   *
   * Fix: thêm `tableRows.first().toBeVisible()` = đợi ít nhất 1 row data render.
   */
  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/products\/all/);
    await expect(this.getLocator('pageTitle')).toBeVisible();
    await expect(this.getLocator('productsTable')).toBeVisible();
    // Đợi ít nhất 1 row data load — table visible ≠ rows loaded
    await expect(this.getLocator('tableRows').first()).toBeVisible();
  }

  /**
   * Click nút "Add New Product" để chuyển sang trang tạo sản phẩm mới.
   */
  async clickAddNewProduct() {
    await this.clickWithLog(this.getLocator('addNewProductButton'));
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 TABLE LOADING STATE
  // ═══════════════════════════════════════════════════════════

  /**
   * Override: Đợi bảng load xong với thêm check table container + name cell.
   *
   * ⚠️ Khi chạy parallel (14 workers), server CMS bị quá tải →
   * response chậm hơn bình thường → cần timeout dài hơn cho rows.
   */
  override async waitForTableReady() {
    // 0. Đợi network ổn định — tránh check DOM khi server chưa trả data xong
    await this.page.waitForLoadState('networkidle');

    const table = this.getLocator('productsTable');

    // 1. Table visible
    await expect(table).toBeVisible({ timeout: 10000 });

    // 2. Headers đã render
    const headers = this.getTableHeadersLocator();
    await expect(headers.first()).toBeVisible({ timeout: 5000 });

    // 3. Ít nhất 1 row visible (name cell là indicator chính)
    //    Timeout 15s vì parallel run → server chậm → tbody có thể trống lâu
    const rows = this.getTableRowsLocator();
    await expect(rows.first()).toBeVisible({ timeout: 15000 });

    const firstRow = rows.first();
    const nameCell = firstRow.locator('td').nth(1);
    await expect(nameCell).toBeVisible({ timeout: 15000 });
  }

  /**
   * Các cột chứa checkbox — cần đọc isChecked() thay vì textContent()
   */
  private static readonly CHECKBOX_COLUMNS = new Set([
    'select', 'todaysDeal', 'published', 'featured',
  ]);

  /**
   * Override: Extract field value (checkbox-aware).
   * Checkbox columns: đọc isChecked() → "Yes"/"No"
   * Regular columns: dùng CollectionHelper.getFieldValue()
   */
  protected override async getFieldValueForRow(
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
  // 📍 TABLE ROW FINDER — Page-specific overrides
  // ═══════════════════════════════════════════════════════════

  /**
   * Override findRowByColumnValue to pass fieldCleaners.
   */
  override async findRowByColumnValue(
    columnKey: ColumnKey,
    matcher: TextMatcher
  ): Promise<Locator> {
    return super.findRowByColumnValue(columnKey, matcher, this.fieldCleaners);
  }

  /**
   * Override findRowByFilters to pass fieldCleaners.
   */
  override async findRowByFilters(
    filters: ColumnFilters
  ): Promise<Locator> {
    return super.findRowByFilters(filters, this.fieldCleaners);
  }

  /**
   * Helper nội bộ: Chuyển sang trang tiếp theo.
   * @returns `true` nếu chuyển trang thành công, `false` nếu đã ở trang cuối.
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
   * Helper nội bộ: Tính tổng số trang từ pagination UI.
   * Đọc text của từng page link rồi lấy số lớn nhất.
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
    filters: ColumnFilters,
    options?: { maxPages?: number }
  ): Promise<{ row: Locator; pageNumber: number }> {
    const helper = await this.ensureCollectionHelper();
    const result = await helper.findItemWithNextPage(
      () => this.getTableRowsLocator(),
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
    filters: ColumnFilters,
    options?: { maxPages?: number },
    columnKeys?: ColumnKey[]
  ): Promise<{ data: Record<string, string>; pageNumber: number }> {
    const { row, pageNumber } = await this.findRowByFiltersAcrossPages(filters, options);
    const data = await this.getRowDataForItem(
      row,
      columnKeys || this.getDefaultColumns(),
    );
    return { data, pageNumber };
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 TABLE ROW ACTIONS - Thao tác trên row
  // ═══════════════════════════════════════════════════════════

  /**
   * Click action button trên row (View/Edit/Duplicate/Delete).
   * Hover vào row để hiện action buttons, rồi click button tương ứng.
   * @param productNameMatcher - Tên sản phẩm để tìm row
   * @param action - Loại action cần click
   */
  async clickRowAction(productNameMatcher: TextMatcher, action: 'View' | 'Edit' | 'Duplicate' | 'Delete') {
    const row = await this.findRowByColumnValue('name', productNameMatcher);
    await row.scrollIntoViewIfNeeded();
    await row.hover({ force: true });
    
    const actionButton = row.locator(`a[title="${action}"]`).first();
    await expect(actionButton).toBeVisible();
    await this.clickWithLog(actionButton);
  }

  /**
   * Mở trang xem chi tiết sản phẩm.
   * @param productNameMatcher - Tên sản phẩm cần xem
   */
  async viewProduct(productNameMatcher: TextMatcher) {
    await this.clickRowAction(productNameMatcher, 'View');
  }

  /**
   * Mở trang chỉnh sửa sản phẩm.
   * @param productNameMatcher - Tên sản phẩm cần sửa
   */
  async editProduct(productNameMatcher: TextMatcher) {
    await this.clickRowAction(productNameMatcher, 'Edit');
  }

  /**
   * Nhân bản sản phẩm (tạo bản copy).
   * @param productNameMatcher - Tên sản phẩm cần nhân bản
   */
  async duplicateProduct(productNameMatcher: TextMatcher) {
    await this.clickRowAction(productNameMatcher, 'Duplicate');
  }

  /**
   * Xóa một sản phẩm và xác nhận dialog.
   *
   * Sau khi click Delete, CMS hiện confirm dialog (SweetAlert2 hoặc Bootstrap modal).
   * Hàm tự động tìm và click nút confirm, rồi đợi trang reload.
   *
   * @param productNameMatcher - Tên sản phẩm cần xóa
   */
  async deleteProduct(productNameMatcher: TextMatcher) {
    await this.clickRowAction(productNameMatcher, 'Delete');
    
    // Đợi confirm dialog xuất hiện (có thể là SweetAlert2 hoặc Bootstrap modal)
    const dialog = this.page.locator('.swal2-popup, .modal.show, [role="dialog"]').first();
    await this.expectVisible(dialog, '[deleteProduct] Confirm dialog', 5000);
    
    // Tìm nút xác nhận — thử nhiều locator vì CMS dùng khác nhau tùy context
    const confirmButton = dialog.locator(
      'button:has-text("Delete"), ' +
      'button:has-text("OK"), ' +
      'button:has-text("Confirm"), ' +
      'button.btn-danger, ' +
      'button.swal2-confirm, ' +
      'a:has-text("Delete"), ' +
      'a.btn-danger'
    ).first();
    
    await this.expectVisible(confirmButton, '[deleteProduct] Nút xác nhận xóa', 3000);
    await this.clickWithLog(confirmButton);
    
    // Trang reload hoàn toàn sau khi xóa (server-side delete)
    // → Không dùng expectHidden(dialog) vì DOM context cũ bị destroy
    await this.page.waitForLoadState('networkidle');
    await this.waitForTableReady();
  }

  /**
   * Bật/tắt checkbox của một sản phẩm theo tên.
   *
   * Click vào `span.aiz-square-check` thay vì `input` trực tiếp
   * vì span hoạt động tốt hơn trên responsive layout.
   *
   * @param productNameMatcher - Tên sản phẩm
   * @param checked - `true` để check, `false` để uncheck
   */
  async toggleRowCheckboxByName(productNameMatcher: TextMatcher, checked: boolean) {
    const row = await this.findRowByColumnValue('name', productNameMatcher);
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    
    // Checkbox nằm trong cột đầu tiên: <td><div><label><input class="check-one"><span>...</span></label></div></td>
    const checkbox = row.locator('td').first().locator('input[type="checkbox"].check-one').first();
    await this.expectVisible(checkbox, '[toggleRowCheckboxByName] Checkbox');
    
    const isCurrentlyChecked = await checkbox.isChecked().catch(() => false);
    
    if (checked && !isCurrentlyChecked) {
      const checkboxSpan = row.locator('td').first().locator('span.aiz-square-check').first();
      await this.expectVisible(checkboxSpan, '[toggleRowCheckboxByName] Checkbox span');
      await this.clickWithLog(checkboxSpan);
      await expect(checkbox).toBeChecked({ timeout: 2000 });
    } else if (!checked && isCurrentlyChecked) {
      const checkboxSpan = row.locator('td').first().locator('span.aiz-square-check').first();
      await this.expectVisible(checkboxSpan, '[toggleRowCheckboxByName] Checkbox span');
      await this.clickWithLog(checkboxSpan);
      await expect(checkbox).not.toBeChecked({ timeout: 2000 });
    }
  }

  /**
   * Chọn nhiều sản phẩm theo tên rồi xóa hàng loạt (Bulk Delete).
   *
   * Quy trình: Check từng checkbox → Click "Bulk Action" → Click "Delete"
   * → Xác nhận modal → Đợi xóa xong → Reload table.
   *
   * @param productNameMatchers - Mảng tên sản phẩm cần xóa
   */
  async bulkDeleteProducts(productNameMatchers: TextMatcher[]) {
    await this.waitForTableReady();
    
    // Bước 1: Check checkbox từng sản phẩm
    Logger.info(`🗑️ [bulkDelete] Chọn ${productNameMatchers.length} sản phẩm...`);
    for (const nameMatcher of productNameMatchers) {
      await this.toggleRowCheckboxByName(nameMatcher, true);
    }
    
    // Bước 2: Mở menu Bulk Action
    const bulkActionButton = this.getLocator('bulkActionButton');
    await this.clickWithLog(bulkActionButton);
    await this.page.waitForTimeout(300);
    
    // Bước 3: Click "Delete selection"
    const bulkDeleteMenuItem = this.getLocator('bulkDeleteMenuItem');
    await expect(bulkDeleteMenuItem).toBeVisible();
    await this.clickWithLog(bulkDeleteMenuItem);
    
    // Bước 4: Xác nhận dialog
    const bulkDeleteModal = this.getLocator('bulkDeleteModal');
    await this.expectVisible(bulkDeleteModal, '[bulkDelete] Modal xác nhận');
    
    const confirmButton = this.getLocator('bulkDeleteConfirmButton');
    await this.expectVisible(confirmButton, '[bulkDelete] Nút xác nhận');
    await this.clickWithLog(confirmButton);
    
    // Bước 5: Đợi xóa xong (modal đóng) → reload table
    await this.expectHidden(bulkDeleteModal, '[bulkDelete] Modal xác nhận', 10000);
    await this.waitForTableReady();
    
    // Clear cache sau khi xóa
    this.resetCollectionCache();
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 TABLE FILTERS & PAGINATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Tìm kiếm sản phẩm bằng từ khóa.
   * Nhập text vào ô search → Enter → đợi table reload.
   * @param term - Từ khóa tìm kiếm (string rỗng để xóa filter)
   */
  async search(term: string) {
    const searchInput = this.getLocator('searchInput');
    await searchInput.fill(term);
    await this.page.keyboard.press('Enter');
    await this.waitForTableReady();
    this.resetCollectionCache();
  }

  /**
   * Xóa bộ lọc tìm kiếm (search rỗng).
   */
  async clearSearch() {
    await this.search('');
  }

  /**
   * Lọc bảng theo seller.
   *
   * ⚠️ Dùng native `<select>` thay vì bootstrap-select button vì plugin
   * destroy/recreate button DOM khi init → gây "Element not attached to DOM".
   * `selectOption()` tương tác trực tiếp với `<select id="user_id">` (ổn định).
   * Sau đó dispatch 'change' event để trigger CMS form submit.
   *
   * @param sellerName - Tên seller cần lọc (text hiển thị trên option)
   */
  async selectSeller(sellerName: string) {
    const nativeSelect = this.getLocator('sellerSelect');
    await nativeSelect.selectOption({ label: sellerName });
    await nativeSelect.dispatchEvent('change');
    await this.page.waitForLoadState('networkidle');
    await this.waitForTableReady();
    this.resetCollectionCache();
  }

  /**
   * Sắp xếp bảng theo tiêu chí.
   *
   * ⚠️ Dùng native `<select>` thay vì bootstrap-select button vì plugin
   * destroy/recreate button DOM khi init → gây "Element not attached to DOM".
   * `selectOption()` tương tác trực tiếp với `<select id="type">` (ổn định).
   * Sau đó dispatch 'change' event để trigger CMS form submit.
   *
   * @param sortOption - Tùy chọn sắp xếp (text hiển thị trên option)
   */
  async selectSort(sortOption: string) {
    const nativeSelect = this.getLocator('sortSelect');
    await nativeSelect.selectOption({ label: sortOption });
    await nativeSelect.dispatchEvent('change');
    await this.page.waitForLoadState('networkidle');
    await this.waitForTableReady();
    this.resetCollectionCache();
  }

  /**
   * Chuyển đến trang cụ thể trong pagination.
   * @param pageNumber - Số trang cần chuyển đến
   */
  async goToPage(pageNumber: number) {
    const pageLink = this.getLocator('paginationPageLink')(pageNumber);
    await this.clickWithLog(pageLink);
    await this.waitForTableReady();
    this.resetCollectionCache();
  }

  /**
   * Chuyển sang trang tiếp theo.
   * Throw error nếu đã ở trang cuối.
   */
  async goToNextPage() {
    const didNavigate = await this.goToNextPageHelper();
    if (!didNavigate) {
      throw new Error('Đã ở trang cuối — không thể chuyển trang tiếp');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 📍 HELPER METHODS
  // ═══════════════════════════════════════════════════════════

  /**
   * Lấy tên sản phẩm đầu tiên trong bảng (bỏ qua giá trị rỗng).
   * Thường dùng làm target cho test expand/collapse.
   */
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
  // 📱 MOBILE FOOTABLE — Mở rộng/Thu gọn chi tiết dòng
  // ═══════════════════════════════════════════════════════════
  //
  // Footable là responsive table plugin của CMS:
  // - Desktop: tất cả cột hiển thị bình thường trong <thead>/<tbody>
  // - Mobile: ẩn các cột "ít quan trọng" → chỉ giữ cột 'name'
  //   → User click icon (+/-) để mở rộng dòng → hiện detail row
  //   → Detail row là <tr class="footable-detail-row"> chứa nested table
  //
  // DOM Structure khi expand:
  // ┌─────────────────────────────────────────────────────────┐
  // │ <tr class="footable-visible">                          │ ← main row
  // │   <td class="footable-first-visible">                  │
  // │     <span class="footable-toggle fooicon-minus"/>      │ ← toggle icon
  // │   </td>                                                │
  // │   <td>Product Name</td>                                │
  // │ </tr>                                                  │
  // │ <tr class="footable-detail-row">                       │ ← detail row
  // │   <td colspan="N">                                     │
  // │     <table class="footable-details">                   │
  // │       <tbody>                                          │
  // │         <tr><th>Added By</th><td>Admin</td></tr>       │
  // │         <tr><th>Total Stock</th><td>100</td></tr>      │
  // │       </tbody>                                         │
  // │     </table>                                           │
  // │   </td>                                                │
  // │ </tr>                                                  │
  // └─────────────────────────────────────────────────────────┘

  /**
   * Kiểm tra viewport hiện tại có phải mobile không.
   * Dựa vào viewportType được inject từ fixture (desktop | mobile).
   */
  isMobileViewport(): boolean {
    return this.viewportType === 'mobile';
  }

  /**
   * Mở rộng dòng để hiện chi tiết (chỉ dùng trên mobile).
   *
   * Footable ẩn các cột trên mobile → click icon (+) để mở rộng.
   * Toggle icon classes:
   * - fooicon-plus  = đang thu gọn → click để mở
   * - fooicon-minus = đang mở rộng → không cần click
   *
   * @param row - Locator của dòng cần mở rộng (main row, KHÔNG phải detail row)
   */
  async expandRow(row: Locator): Promise<void> {
    if (!this.isMobileViewport()) {
      Logger.info('📱 [expandRow] Không phải mobile viewport — bỏ qua');
      return;
    }

    // Đợi Footable init xong — Footable JS cần thời gian để thêm class
    // "footable-first-visible" vào <td> đầu tiên. Nếu check ngay lập tức
    // sau pageload, class có thể chưa tồn tại → cần wait với timeout.
    const toggleCell = row.locator('td.footable-first-visible').first();
    try {
      await expect(toggleCell).toBeVisible({ timeout: 5000 });
    } catch {
      Logger.info('📱 [expandRow] Không tìm thấy cell footable-first-visible sau 5s — bỏ qua');
      return;
    }

    // Tìm toggle icon (span) trong cell
    const toggleIcon = toggleCell.locator('span.footable-toggle').first();
    const toggleExists = await toggleIcon.count() > 0;

    if (!toggleExists) {
      Logger.info('📱 [expandRow] Không tìm thấy icon footable-toggle — bỏ qua');
      return;
    }

    // Kiểm tra đã mở rộng chưa (fooicon-minus = đang mở)
    const isExpanded = await toggleIcon.evaluate((el) =>
      el.classList.contains('fooicon-minus')
    );

    if (isExpanded) {
      Logger.info('📱 [expandRow] Dòng đã mở rộng — bỏ qua');
      return;
    }

    // Click để mở rộng
    await this.clickWithLog(toggleIcon);

    // Đợi detail row xuất hiện (sibling tiếp theo của main row)
    const detailRow = row.locator('+ tr.footable-detail-row');
    await expect(detailRow).toBeVisible({ timeout: 3000 });
    Logger.info('📱 [expandRow] ✅ Đã mở rộng dòng thành công');
  }

  /**
   * Thu gọn dòng để ẩn chi tiết (chỉ dùng trên mobile).
   *
   * Ngược lại với expandRow():
   * - fooicon-plus  = đã thu gọn → không cần click
   * - fooicon-minus = đang mở → click để thu gọn
   *
   * @param row - Locator của dòng cần thu gọn (main row)
   */
  async collapseRow(row: Locator): Promise<void> {
    if (!this.isMobileViewport()) {
      Logger.info('📱 [collapseRow] Không phải mobile viewport — bỏ qua');
      return;
    }

    // Tìm cell đầu tiên chứa toggle icon
    const toggleCell = row.locator('td.footable-first-visible').first();
    const toggleCellExists = await toggleCell.count() > 0;

    if (!toggleCellExists) {
      Logger.info('📱 [collapseRow] Không tìm thấy cell footable-first-visible — bỏ qua');
      return;
    }

    // Tìm toggle icon trong cell
    const toggleIcon = toggleCell.locator('span.footable-toggle').first();
    const toggleExists = await toggleIcon.count() > 0;

    if (!toggleExists) {
      Logger.info('📱 [collapseRow] Không tìm thấy icon footable-toggle — bỏ qua');
      return;
    }

    // Kiểm tra đã thu gọn chưa (fooicon-plus = đã gọn)
    const isCollapsed = await toggleIcon.evaluate((el) =>
      el.classList.contains('fooicon-plus')
    );

    if (isCollapsed) {
      Logger.info('📱 [collapseRow] Dòng đã thu gọn — bỏ qua');
      return;
    }

    // Click để thu gọn
    await this.clickWithLog(toggleIcon);

    // Đợi detail row biến mất
    const detailRow = row.locator('+ tr.footable-detail-row');
    await expect(detailRow).toBeHidden({ timeout: 3000 });
    Logger.info('📱 [collapseRow] ✅ Đã thu gọn dòng thành công');
  }

  /**
   * Đọc dữ liệu từ detail row đã mở rộng (chỉ dùng trên mobile).
   *
   * Detail row chứa nested table (<table class="footable-details">)
   * với các dòng <tr><th>Key</th><td>Value</td></tr>.
   *
   * ⚠️ PHẢI gọi expandRow() TRƯỚC khi gọi method này.
   * Nếu detail row chưa visible → throw Error.
   *
   * @param row - Locator của main row (KHÔNG phải detail row)
   * @returns Object key-value: { 'Added By': 'Admin', 'Total Stock': '100', ... }
   */
  async getExpandedRowData(row: Locator): Promise<Record<string, string>> {
    if (!this.isMobileViewport()) {
      throw new Error('[getExpandedRowData] Chỉ dùng được trên mobile viewport');
    }

    // Tìm detail row (sibling tiếp theo có class footable-detail-row)
    const detailRow = row.locator('+ tr.footable-detail-row');
    const isVisible = await detailRow.isVisible();

    if (!isVisible) {
      throw new Error('[getExpandedRowData] Detail row chưa visible. Gọi expandRow() trước.');
    }

    const data: Record<string, string> = {};

    // Đọc tất cả dòng từ nested table trong detail row
    const detailRows = detailRow.locator('table.footable-details tbody tr');
    const count = await detailRows.count();

    for (let i = 0; i < count; i++) {
      const detailRowItem = detailRows.nth(i);
      const th = await detailRowItem.locator('th').textContent();
      const td = await detailRowItem.locator('td').textContent();

      if (th && td) {
        // Clean key: bỏ whitespace thừa
        const key = th.trim();

        // Clean value: gộp nhiều khoảng trắng/xuống dòng thành 1 space
        const value = td
          .replace(/\s+/g, ' ')
          .trim();

        data[key] = value;
      }
    }

    Logger.info(`📱 [getExpandedRowData] Đọc được ${Object.keys(data).length} fields từ detail row`);
    return data;
  }
}

