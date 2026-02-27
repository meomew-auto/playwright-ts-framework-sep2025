/**
 * ============================================================================
 * BASE TABLE PAGE — Abstract base cho tất cả Page Objects có bảng dữ liệu
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Gom logic chung khi tương tác với table (TableResolver + CollectionHelper)
 * để tránh duplicate code giữa các page objects.
 *
 * 📌 CUNG CẤP (concrete — subclass kế thừa, KHÔNG cần implement lại):
 * - ensureCollectionHelper() + resetCollectionCache() — lazy init + cache
 * - getRowCount()        — đếm số rows
 * - getColumnMap()       — debug/verify cột tồn tại
 * - getColumnValues()    — lấy tất cả giá trị 1 cột
 * - getTableData()       — lấy data nhiều cột
 * - findRowByColumnValue() — tìm row theo 1 cột (overridable)
 * - findRowByFilters()     — tìm row theo nhiều cột
 * - getRowDataByFilters()  — tìm + lấy data
 * - waitForTableReady()    — đợi table load xong (overridable)
 *
 * 📌 YÊU CẦU SUBCLASS (abstract — PHẢI implement):
 * - getTableHeadersLocator() — locator cho <thead th>
 * - getTableRowsLocator()    — locator cho <tbody tr>
 * - getFieldValueForRow()    — extract data từ cell (cleaners + DOM)
 * - getDefaultColumns()      — default column keys cho getDefaultTableData()
 *
 * 📚 HIERARCHY:
 * BasePage
 *   └── BaseTablePage (THIS)
 *         ├── CMSAllProductsPage
 *         └── OrdersPage
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: TableResolver, CollectionHelper (@collection/)
 * - Extends: BasePage
 */
import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { TableResolver } from '@collection/TableResolver';
import { CollectionHelper } from '@collection/CollectionHelper';
import { TextMatcher, FieldCleanerMap } from '@collection/FieldResolver';
import { Logger } from '@utils/Logger';

export abstract class BaseTablePage extends BasePage {

  // ════════════════════════════════════════════════════════════════════════════
  // 📦 ABSTRACT HOOKS — Subclass PHẢI implement
  // ════════════════════════════════════════════════════════════════════════════

  /** Locator cho tất cả header cells (<thead th>) */
  protected abstract getTableHeadersLocator(): Locator;

  /** Locator cho tất cả data rows (<tbody tr>) */
  protected abstract getTableRowsLocator(): Locator;

  /**
   * Extract giá trị từ 1 field trong 1 row.
   * Mỗi page override để xử lý DOM-complex cells (checkbox, badge, etc.)
   * và áp dụng fieldCleaners riêng.
   */
  protected abstract getFieldValueForRow(row: Locator, field: string): Promise<string>;

  /** Danh sách cột mặc định khi gọi getDefaultTableData() */
  protected abstract getDefaultColumns(): string[];

  // ════════════════════════════════════════════════════════════════════════════
  // 📦 COLLECTION HELPER — Lazy init + cache
  // ════════════════════════════════════════════════════════════════════════════

  protected tableResolver: TableResolver | null = null;
  private _collectionHelper: CollectionHelper<TableResolver> | null = null;

  /**
   * Đảm bảo TableResolver + CollectionHelper đã được khởi tạo.
   * Gọi waitForTableReady() nếu chưa init.
   */
  protected async ensureCollectionHelper(): Promise<CollectionHelper<TableResolver>> {
    if (!this._collectionHelper || !this.tableResolver) {
      await this.waitForTableReady();
      this.tableResolver = await TableResolver.create(this.getTableHeadersLocator());
      this._collectionHelper = new CollectionHelper(this.tableResolver);
    }
    return this._collectionHelper;
  }

  /**
   * Reset cache — gọi khi navigate, search, filter, paginate.
   * Subclass gọi method này trong các action thay đổi table content.
   */
  protected resetCollectionCache(): void {
    this.tableResolver = null;
    this._collectionHelper = null;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 📍 TABLE LOADING STATE (overridable)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Đợi table load xong. Default implementation:
   * networkidle → headers visible → first row visible → first cell not empty
   *
   * Subclass có thể override nếu cần thêm/bớt checks.
   */
  async waitForTableReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');

    const headers = this.getTableHeadersLocator();
    await expect(headers.first()).toBeVisible({ timeout: 10000 });

    const rows = this.getTableRowsLocator();
    await expect(rows.first()).toBeVisible({ timeout: 15000 });

    // Đợi cell đầu tiên có text (data đã load)
    const firstCell = rows.first().locator('td').first();
    await expect(firstCell).not.toBeEmpty({ timeout: 10000 });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 📊 TABLE DATA EXTRACTION — Concrete methods (subclass kế thừa)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Đếm số dòng hiện tại trong bảng.
   */
  async getRowCount(): Promise<number> {
    await this.waitForTableReady();
    return this.getTableRowsLocator().count();
  }

  /**
   * Lấy column map (debug/verify).
   * Trả về non-null vì ensureCollectionHelper() đảm bảo resolver đã init.
   */
  async getColumnMap() {
    await this.ensureCollectionHelper();
    return this.tableResolver!.getColumnMap()!;
  }

  /**
   * Lấy tất cả giá trị của 1 cột.
   */
  async getColumnValues(columnKey: string): Promise<string[]> {
    await this.ensureCollectionHelper();
    const rows = this.getTableRowsLocator();
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    const count = await rows.count();
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      values.push(await this.getFieldValueForRow(rows.nth(i), columnKey));
    }
    return values;
  }

  /**
   * Lấy dữ liệu nhiều cột từ table.
   */
  async getTableData(columnKeys: string[]): Promise<Array<Record<string, string>>> {
    await this.ensureCollectionHelper();
    const rows = this.getTableRowsLocator();
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    const count = await rows.count();
    Logger.info(`${this.logPrefix}📊 Table rows count: ${count}`);

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
   * Lấy dữ liệu tất cả cột mặc định.
   */
  async getDefaultTableData(): Promise<Array<Record<string, string>>> {
    return this.getTableData(this.getDefaultColumns());
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 📍 TABLE ROW FINDER
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Tìm row đầu tiên khớp với giá trị cột.
   * Subclass có thể override nếu cần xử lý DOM columns đặc biệt.
   */
  async findRowByColumnValue(
    columnKey: string,
    matcher: TextMatcher,
    fieldCleaners?: FieldCleanerMap,
  ): Promise<Locator> {
    const helper = await this.ensureCollectionHelper();
    return helper.findItem(
      this.getTableRowsLocator(),
      columnKey,
      matcher,
      fieldCleaners,
    );
  }

  /**
   * Tìm row theo nhiều filters.
   */
  async findRowByFilters(
    filters: Record<string, TextMatcher>,
    fieldCleaners?: FieldCleanerMap,
  ): Promise<Locator> {
    const helper = await this.ensureCollectionHelper();
    return helper.findItemByFilters(
      this.getTableRowsLocator(),
      filters,
      fieldCleaners,
    );
  }

  /**
   * Lấy data từ 1 row cho nhiều columns.
   */
  protected async getRowDataForItem(
    row: Locator,
    columnKeys: string[],
  ): Promise<Record<string, string>> {
    const data: Record<string, string> = {};
    for (const key of columnKeys) {
      data[key] = await this.getFieldValueForRow(row, key);
    }
    return data;
  }

  /**
   * Tìm row theo filters rồi lấy data.
   */
  async getRowDataByFilters(
    filters: Record<string, TextMatcher>,
    columnKeys?: string[],
  ): Promise<Record<string, string>> {
    const row = await this.findRowByFilters(filters);
    return this.getRowDataForItem(
      row,
      columnKeys || this.getDefaultColumns(),
    );
  }
}
