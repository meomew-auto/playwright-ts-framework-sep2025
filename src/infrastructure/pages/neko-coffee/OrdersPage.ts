/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO COFFEE — ORDERS PAGE (Page Object Model)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * POM cho trang quản lý đơn hàng: /admin/orders
 * Sử dụng TableResolver + CollectionHelper (giống CMSAllProductsPage).
 *
 * 📌 KEY PATTERNS:
 * - TableResolver: build column map từ <thead th> → resolve cell bằng index
 * - CollectionHelper: getFieldValues, getCollectionData, findItem, findItemData
 * - FieldCleanerMap: text-only transform (tổng tiền → bỏ ký tự, chỉ giữ số)
 * - getFieldValueForRow(): override cho cells cần DOM access (khách hàng, trạng thái)
 * - Lazy init + resetCollectionCache: tránh rebuild khi không cần
 *
 * � SECTIONS:
 * - Types: OrderColumnKey (union type cho column names)
 * - Locators: pageLocators dict + createResponsiveLocatorGetter
 * - Table ops: getColumnValues, getTableData, getRowDataByFilters
 * - Filter: filterByStatus, resetFilters, searchOrder
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: TableResolver, CollectionHelper (@collection/)
 * - Fixture: neko/ui/app.fixture.ts (ordersPage)
 * - Extends: BasePage
 */

import { expect, Locator, Page } from '@playwright/test';
import { BaseTablePage } from '@pages/base/BaseTablePage';
import { ViewportType } from '@fixtures/common/ViewportType';
import { TextMatcher, FieldCleanerMap } from '@collection/FieldResolver';

// ════════════════════════════════════════════════════════════════════════════
// 📌 TYPES — Column keys cho Orders table
// ════════════════════════════════════════════════════════════════════════════

/**
 * Key cho các cột trong bảng Orders
 * Dựa trên headers thực tế của Neko Coffee Orders table
 */
export type OrderColumnKey =
  | 'mã đơn'       // Order number (#B2C-xxx)
  | 'khách hàng'   // Customer name + email
  | 'ngày đặt'     // Order date
  | 'tổng tiền'    // Total amount
  | 'trạng thái';  // Status badge

/**
 * Trick string & {} — giữ autocomplete cho OrderColumnKey
 * mà vẫn chấp nhận string bất kỳ
 */
type ColumnKey = OrderColumnKey | (string & {});

/**
 * Partial Record cho filters
 */
type ColumnFilters = Partial<Record<OrderColumnKey, TextMatcher>> & Record<string, TextMatcher>;

/**
 * Danh sách cột mặc định khi lấy data
 */
export const DEFAULT_ORDER_TABLE_COLUMNS: OrderColumnKey[] = [
  'mã đơn',
  'khách hàng',
  'tổng tiền',
  'trạng thái',
] as const;

// ════════════════════════════════════════════════════════════════════════════
// 📌 PAGE OBJECT MODEL: OrdersPage
// ════════════════════════════════════════════════════════════════════════════

export class OrdersPage extends BaseTablePage {
  // ──────────────────────────────────────────────────────────────────────────
  // 🔹 STATUS OPTIONS (giá trị dropdown)
  // ──────────────────────────────────────────────────────────────────────────

  static readonly STATUS_OPTIONS = {
    ALL: '',                  // Tất cả trạng thái
    PENDING: 'pending',       // Chờ xử lý
    CONFIRMED: 'confirmed',   // Đã xác nhận
    PROCESSING: 'processing', // Đang chuẩn bị
    READY: 'ready',           // Sẵn sàng giao
    SHIPPED: 'shipped',       // Đang giao hàng
    DELIVERED: 'delivered',   // Đã giao hàng
    CANCELLED: 'cancelled',   // Đã hủy
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 🔹 PAGE LOCATORS (Base — Desktop)
  // ──────────────────────────────────────────────────────────────────────────

  private readonly pageLocators = {
    ordersTable: 'table',
    tableHeaders: 'table thead th',
    tableRows: 'table tbody tr',
    statusDropdown: (page: Page) => page.locator('select').first(),
    searchInput: (page: Page) => page.locator('input[placeholder="Tìm đơn hàng..."]'),
  } as const;

  // ──────────────────────────────────────────────────────────────────────────
  // 🔹 RESPONSIVE LOCATOR GETTER
  // ──────────────────────────────────────────────────────────────────────────

  private readonly getLocator = this.createResponsiveLocatorGetter(
    this.pageLocators,
    {} // Không có mobile overrides hiện tại
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 🔹 CONSTRUCTOR
  // ──────────────────────────────────────────────────────────────────────────

  constructor(page: Page, viewportType: ViewportType = 'desktop') {
    super(page, viewportType);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 📦 ABSTRACT IMPLEMENTATIONS (from BaseTablePage)
  // ════════════════════════════════════════════════════════════════════════════

  protected getTableHeadersLocator(): Locator {
    return this.getLocator('tableHeaders');
  }

  protected getTableRowsLocator(): Locator {
    return this.getLocator('tableRows');
  }

  protected getDefaultColumns(): string[] {
    return [...DEFAULT_ORDER_TABLE_COLUMNS];
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 📦 FIELD CLEANERS — Text-only transform (FieldCleanerMap)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Simple text cleaners cho CollectionHelper
   * Chỉ xử lý text-based transformations (không cần Locator access)
   *
   * Cột TỔNG TIỀN: "550.000đ" → "550000" (chỉ giữ số)
   */
  private get fieldCleaners(): FieldCleanerMap {
    return {
      'tổng tiền': (text: string) => text.replace(/[^\d]/g, ''),
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 📦 DOM-LEVEL FIELD EXTRACTORS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Các cột cần DOM access đặc biệt (không dùng textContent đơn giản)
   * Giống pattern CMSAllProductsPage.getFieldValueForRow()
   */
  private static readonly DOM_COLUMNS = new Set<string>([
    'khách hàng',  // Cần locator: cell > p.first() (chỉ lấy tên, bỏ email)
    'trạng thái',  // Cần locator: cell > button.innerText() (bỏ "expand_more")
  ]);

  /**
   * Lấy tên khách hàng từ cell
   *
   * HTML structure:
   * <div>
   *   <p class="font-bold">Ngô Thị K</p>     ← tên (lấy cái này)
   *   <p class="text-slate-400">email@...</p>  ← email (bỏ)
   * </div>
   */
  private async getCustomerNameFromCell(cell: Locator): Promise<string> {
    const nameElement = cell.locator('p').first();
    const name = await nameElement.textContent();
    return (name || '').trim();
  }

  /**
   * Lấy trạng thái từ cell
   *
   * HTML: <button>Đã hủy expand_more</button> → "Đã hủy"
   */
  private async getStatusFromCell(cell: Locator): Promise<string> {
    const button = cell.locator('button');
    const text = await button.innerText();
    return (text || '').replace('expand_more', '').trim();
  }

  /**
   * Override: Extract field value cho Orders table.
   * DOM columns (khách hàng, trạng thái): dùng custom extractors
   * Regular columns: dùng CollectionHelper.getFieldValue() + fieldCleaners
   */
  protected override async getFieldValueForRow(
    row: Locator,
    field: string,
  ): Promise<string> {
    const helper = await this.ensureCollectionHelper();

    if (field === 'khách hàng') {
      const cell = this.tableResolver!.resolve(row, field);
      return this.getCustomerNameFromCell(cell);
    }

    if (field === 'trạng thái') {
      const cell = this.tableResolver!.resolve(row, field);
      return this.getStatusFromCell(cell);
    }

    // Regular columns → dùng CollectionHelper
    return helper.getFieldValue(row, field, this.fieldCleaners);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 📍 NAVIGATION & PAGE VERIFICATION
  // ════════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await this.page.goto('/admin/orders');
    await this.waitForTableReady();
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/admin\/orders/);
    await expect(this.getLocator('ordersTable')).toBeVisible();
    await expect(this.getTableRowsLocator().first()).toBeVisible();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 📍 TABLE LOADING STATE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Override: Đợi table load xong với check orders table container.
   */
  override async waitForTableReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');

    const table = this.getLocator('ordersTable');
    await expect(table).toBeVisible({ timeout: 10000 });

    const headers = this.getTableHeadersLocator();
    await expect(headers.first()).toBeVisible({ timeout: 5000 });

    const rows = this.getTableRowsLocator();
    await expect(rows.first()).toBeVisible({ timeout: 15000 });

    // Đợi cell đầu tiên có text (data đã load)
    const firstRow = rows.first();
    const firstCell = firstRow.locator('td').first();
    await expect(firstCell).not.toBeEmpty({ timeout: 10000 });
  }

  /**
   * Alias cho getRowCount() — backward compatible naming.
   */
  async getOrderCount(): Promise<number> {
    return this.getRowCount();
  }

  /**
   * Lấy tất cả trạng thái hiển thị
   */
  async getAllStatuses(): Promise<string[]> {
    return this.getColumnValues('trạng thái');
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 📍 TABLE ROW FINDER
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Override: Tìm row theo giá trị 1 cột (hỗ trợ DOM columns)
   */
  override async findRowByColumnValue(
    columnKey: ColumnKey,
    matcher: TextMatcher
  ): Promise<Locator> {
    // DOM column → tìm bằng custom logic
    if (OrdersPage.DOM_COLUMNS.has(columnKey)) {
      return this.findRowByDomColumn(columnKey, matcher);
    }
    // Regular columns → dùng base class (CollectionHelper)
    return super.findRowByColumnValue(columnKey, matcher, this.fieldCleaners);
  }

  /**
   * Tìm row theo DOM column (khách hàng, trạng thái)
   * Loop qua rows và dùng custom extractor
   */
  private async findRowByDomColumn(
    columnKey: string,
    matcher: TextMatcher
  ): Promise<Locator> {
    await this.ensureCollectionHelper();
    const rows = this.getTableRowsLocator();
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const value = await this.getFieldValueForRow(row, columnKey);

      const matches = typeof matcher === 'string'
        ? value === matcher
        : matcher instanceof RegExp
          ? matcher.test(value)
          : matcher(value);

      if (matches) return row;
    }
    throw new Error(`Không tìm thấy row có cột "${columnKey}" khớp với matcher`);
  }

  /**
   * Override: Lấy dữ liệu của row khớp với filters (hỗ trợ DOM columns)
   */
  override async getRowDataByFilters(
    filters: ColumnFilters,
    columnKeys?: ColumnKey[]
  ): Promise<Record<string, string>> {
    // Tìm row khớp filter đầu tiên
    const filterEntries = Object.entries(filters);
    const [firstKey, firstMatcher] = filterEntries[0];
    const row = await this.findRowByColumnValue(firstKey, firstMatcher);

    // Verify thêm các filter còn lại nếu có
    for (let i = 1; i < filterEntries.length; i++) {
      const [key, matcher] = filterEntries[i];
      const value = await this.getFieldValueForRow(row, key);
      const matches = typeof matcher === 'string'
        ? value === matcher
        : matcher instanceof RegExp
          ? matcher.test(value)
          : matcher(value);
      if (!matches) {
        throw new Error(`Row khớp "${firstKey}" nhưng không khớp "${key}"`);
      }
    }

    // Lấy data
    const resolvedKeys = columnKeys || this.getDefaultColumns();
    return this.getRowDataForItem(row, resolvedKeys);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 🔍 FILTER METHODS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Lọc theo trạng thái (dùng native selectOption)
   *
   * Fix race condition: sau selectOption, đợi table thực sự reload
   * bằng cách detect nội dung first-row thay đổi trước khi gọi waitForTableReady.
   */
  async filterByStatus(status: string): Promise<void> {
    await this.waitForTableReloadAfterAction(async () => {
      await this.getLocator('statusDropdown').selectOption({ value: status });
    });
  }

  /**
   * Reset tất cả filters
   */
  async resetFilters(): Promise<void> {
    await this.waitForTableReloadAfterAction(async () => {
      await this.getLocator('statusDropdown').selectOption({ value: '' });
    });
  }

  /**
   * Tìm kiếm order theo keyword
   */
  async searchOrder(keyword: string): Promise<void> {
    await this.waitForTableReloadAfterAction(async () => {
      await this.getLocator('searchInput').fill(keyword);
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 🔧 PRIVATE HELPERS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Chờ table reload sau một action (filter, search, reset).
   *
   * Pattern:
   * 1. Snapshot nội dung row đầu tiên TRƯỚC action
   * 2. Thực hiện action (selectOption, fill, etc.)
   * 3. Poll cho đến khi nội dung row đầu tiên THAY ĐỔI
   *    hoặc số lượng rows thay đổi (table đã reload)
   * 4. Reset cache + waitForTableReady
   *
   * Giải quyết race condition: waitForTableReady pass trên data cũ
   * vì table vẫn visible khi filter chưa reload xong.
   */
  private async waitForTableReloadAfterAction(
    action: () => Promise<void>,
    timeout = 10000
  ): Promise<void> {
    const rows = this.getTableRowsLocator();
    const oldCount = await rows.count();
    const oldFirstCellText = oldCount > 0
      ? await rows.first().locator('td').first().textContent() ?? ''
      : '';

    // Thực hiện action
    await action();

    // Poll: đợi table content thay đổi (row count hoặc first cell text)
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      await this.page.waitForTimeout(200);
      const newCount = await rows.count();
      if (newCount !== oldCount) break;
      if (newCount > 0) {
        const newText = await rows.first().locator('td').first().textContent() ?? '';
        if (newText !== oldFirstCellText) break;
      }
    }

    this.resetCollectionCache();
    await this.waitForTableReady();
  }
}
