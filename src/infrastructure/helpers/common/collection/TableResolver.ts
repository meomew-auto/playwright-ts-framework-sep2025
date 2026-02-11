/**
 * ============================================================================
 * TABLE RESOLVER - Tìm Field dựa trên Column Index
 * ============================================================================
 *
 * Tìm fields bằng column index từ table headers.
 * Tự động đọc headers từ DOM và tạo column map.
 *
 * @example
 * ```typescript
 * // Tạo resolver với factory method (tự động init)
 * const resolver = await TableResolver.create(page.locator('th'));
 * const helper = new CollectionHelper(resolver);
 * const names = await helper.getFieldValues(rows, 'Name');
 * ```
 */

import { Locator } from '@playwright/test';
import { FieldResolver } from './FieldResolver';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thông tin của một column
 */
export type ColumnInfo = {
  index: number;
  text: string;
};

/**
 * Map column: key → ColumnInfo
 * Keys có thể là camelCase hoặc lowercase
 */
export type ColumnMap = Record<string, ColumnInfo>;

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chuyển text thành camelCase
 * Ví dụ: "Date Created" → "dateCreated"
 */
function toCamelCase(text: string): string {
  const words = text.toLowerCase().split(' ');
  let result = words[0];
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
    result += capitalized;
  }
  return result;
}

/**
 * Làm sạch header text - loại bỏ khoảng trắng thừa
 */
function cleanHeaderText(text: string): string {
  const parts = text.split(' ');
  const words = parts.filter((word) => word !== '');
  return words.join(' ');
}

/**
 * Tạo column map từ headers locator
 * Map mỗi column theo cả camelCase và lowercase
 *
 * @example
 * // Headers: ["ID", "Date Created", "Customer Name"]
 * // Result:
 * // {
 * //   id: { index: 0, text: 'ID' },
 * //   dateCreated: { index: 1, text: 'Date Created' },
 * //   'date created': { index: 1, text: 'Date Created' },
 * //   customerName: { index: 2, text: 'Customer Name' },
 * //   'customer name': { index: 2, text: 'Customer Name' }
 * // }
 */
async function createColumnMap(headers: Locator): Promise<ColumnMap> {
  const count = await headers.count();
  const map: ColumnMap = {};

  for (let index = 0; index < count; index++) {
    const headerLocator = headers.nth(index);
    const rawText = await headerLocator.innerText();
    const clean = cleanHeaderText(rawText);

    const info: ColumnInfo = {
      index,
      text: clean,
    };

    // Thêm key dạng camelCase
    const camelKey = toCamelCase(clean);
    if (camelKey) {
      map[camelKey] = info;
    }

    // Thêm key dạng lowercase
    const lowerKey = clean.toLowerCase();
    if (lowerKey) {
      map[lowerKey] = info;
    }
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE RESOLVER CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class TableResolver implements FieldResolver {
  private columnMap: ColumnMap | null = null;
  private initialized = false;

  /**
   * Constructor private - dùng `TableResolver.create()` thay thế
   */
  private constructor(
    private readonly headers: Locator,
    private readonly cellSelector: string = 'td'
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // FACTORY METHOD
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Tạo và khởi tạo TableResolver trong một bước.
   * 
   * @example
   * ```typescript
   * const resolver = await TableResolver.create(page.locator('th'));
   * const helper = new CollectionHelper(resolver);
   * ```
   */
  static async create(
    headers: Locator,
    cellSelector: string = 'td'
  ): Promise<TableResolver> {
    const resolver = new TableResolver(headers, cellSelector);
    await resolver.init();
    return resolver;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // KHỞI TẠO
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Khởi tạo resolver bằng cách xây dựng column map từ headers.
   * Được gọi tự động bởi `TableResolver.create()`
   */
  async init(): Promise<void> {
    this.columnMap = await createColumnMap(this.headers);
    this.initialized = true;
  }

  /**
   * Chuyển tên field thành Locator bằng column index.
   *
   * @param row - Table row (tr element)
   * @param field - Tên field (khớp với header text dạng camelCase hoặc lowercase)
   * @returns Locator cho cell element
   * @throws Error nếu resolver chưa init hoặc field không tồn tại
   */
  resolve(row: Locator, field: string): Locator {
    if (!this.initialized || !this.columnMap) {
      throw new Error(
        'TableResolver: Chưa được khởi tạo. Dùng TableResolver.create() để tạo resolver.'
      );
    }

    const info = this.columnMap[field];

    if (!info) {
      const available = this.getFieldNames().join(', ');
      throw new Error(
        `TableResolver: Không tìm thấy field "${field}". Các field có sẵn: ${available}`
      );
    }

    // nth-child bắt đầu từ 1, column index bắt đầu từ 0
    return row.locator(`${this.cellSelector}:nth-child(${info.index + 1})`);
  }

  /**
   * Lấy tất cả tên field có sẵn từ column map
   */
  getFieldNames(): string[] {
    if (!this.columnMap) {
      return [];
    }
    return Object.keys(this.columnMap);
  }

  /**
   * Lấy thông tin column của một field
   */
  getColumnInfo(field: string): ColumnInfo | undefined {
    return this.columnMap?.[field];
  }

  /**
   * Lấy raw column map (để debug hoặc sử dụng nâng cao)
   */
  getColumnMap(): ColumnMap | null {
    return this.columnMap;
  }

  /**
   * Kiểm tra resolver đã được khởi tạo chưa
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Làm mới column map (hữu ích khi headers thay đổi động)
   */
  async refresh(): Promise<void> {
    await this.init();
  }

  /**
   * Kiểm tra field có tồn tại trong column map không
   */
  hasField(field: string): boolean {
    return this.columnMap ? field in this.columnMap : false;
  }
}
