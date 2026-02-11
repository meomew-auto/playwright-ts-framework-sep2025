/**
 * ============================================================================
 * COLLECTION HELPER - Helper chung cho Tables, Grids & Collections
 * ============================================================================
 *
 * Helper dựa trên Strategy pattern, hoạt động với mọi loại collection.
 * Sử dụng FieldResolver để trừu tượng hóa cách tìm field trong item.
 *
 * @example
 * ```typescript
 * // Cho grids (product cards, articles)
 * const resolver = new GridResolver({ name: 'h3', price: '.price' });
 * const helper = new CollectionHelper(resolver);
 *
 * // Cho tables (có headers)
 * const resolver = await TableResolver.create(headers);
 * const helper = new CollectionHelper(resolver);
 *
 * // API giống nhau cho cả hai
 * const names = await helper.getFieldValues(items, 'name');
 * const item = await helper.findItem(items, 'name', 'Arabica');
 * ```
 */

import { Locator } from '@playwright/test';
import { Logger } from '../../../utils/Logger';
import {
  FieldResolver,
  TextMatcher,
  FieldCleanerMap,
  FilterCriteria,
  matchesValue,
  cleanFieldText,
} from './FieldResolver';

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTION HELPER CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class CollectionHelper<R extends FieldResolver = FieldResolver> {
  constructor(private readonly resolver: R) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁC METHOD CHO ITEM ĐƠN LẺ
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Lấy giá trị text từ một field của item
   *
   * @param item - Item trong collection (row, card, v.v.)
   * @param field - Tên field cần lấy
   * @param cleaners - Các hàm làm sạch text (tuỳ chọn)
   */
  async getFieldValue(
    item: Locator,
    field: string,
    cleaners?: FieldCleanerMap
  ): Promise<string> {
    const fieldLocator = this.resolver.resolve(item, field);
    const text = (await fieldLocator.textContent()) || '';
    return cleanFieldText(text, field, cleaners);
  }

  /**
   * Lấy nhiều giá trị field từ một item dưới dạng object
   *
   * @param item - Item trong collection
   * @param fields - Mảng tên các field cần lấy
   * @param cleaners - Các hàm làm sạch text (tuỳ chọn)
   */
  async getItemData(
    item: Locator,
    fields: string[],
    cleaners?: FieldCleanerMap
  ): Promise<Record<string, string>> {
    const data: Record<string, string> = {};

    for (const field of fields) {
      data[field] = await this.getFieldValue(item, field, cleaners);
    }

    return data;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁC METHOD CHO COLLECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Lấy tất cả giá trị của một field từ tất cả items
   *
   * @param items - Locator cho tất cả items
   * @param field - Tên field cần lấy
   * @param cleaners - Các hàm làm sạch text (tuỳ chọn)
   */
  async getFieldValues(
    items: Locator,
    field: string,
    cleaners?: FieldCleanerMap
  ): Promise<string[]> {
    const count = await items.count();
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      const value = await this.getFieldValue(items.nth(i), field, cleaners);
      values.push(value);
    }

    return values;
  }

  /**
   * Lấy data từ tất cả items trong collection
   *
   * @param items - Locator cho tất cả items
   * @param fields - Mảng tên các field cần lấy
   * @param cleaners - Các hàm làm sạch text (tuỳ chọn)
   */
  async getCollectionData(
    items: Locator,
    fields: string[],
    cleaners?: FieldCleanerMap
  ): Promise<Array<Record<string, string>>> {
    const count = await items.count();
    const data: Array<Record<string, string>> = [];

    for (let i = 0; i < count; i++) {
      const itemData = await this.getItemData(items.nth(i), fields, cleaners);
      data.push(itemData);
    }

    return data;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁC METHOD TÌM KIẾM
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Tìm item bằng cách so khớp một giá trị field
   *
   * @param items - Locator cho tất cả items
   * @param field - Tên field để so khớp
   * @param matcher - Giá trị cần khớp (string, regex, hoặc function)
   * @param cleaners - Các hàm làm sạch text (tuỳ chọn)
   * @throws Error nếu không tìm thấy item
   */
  async findItem(
    items: Locator,
    field: string,
    matcher: TextMatcher,
    cleaners?: FieldCleanerMap
  ): Promise<Locator> {
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const value = await this.getFieldValue(item, field, cleaners);

      if (matchesValue(value, matcher)) {
        return item;
      }
    }

    throw new Error(
      `CollectionHelper: Không tìm thấy item với "${field}" khớp ${matcher}`
    );
  }

  /**
   * Tìm item bằng cách so khớp nhiều giá trị field
   *
   * @param items - Locator cho tất cả items
   * @param filters - Object với tên field và matcher
   * @param cleaners - Các hàm làm sạch text (tuỳ chọn)
   * @throws Error nếu không tìm thấy item
   */
  async findItemByFilters(
    items: Locator,
    filters: FilterCriteria,
    cleaners?: FieldCleanerMap
  ): Promise<Locator> {
    const count = await items.count();
    const filterEntries = Object.entries(filters);

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      let allMatch = true;

      for (const [field, matcher] of filterEntries) {
        const value = await this.getFieldValue(item, field, cleaners);
        if (!matchesValue(value, matcher)) {
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        return item;
      }
    }

    const filterDesc = filterEntries
      .map(([field, matcher]) => `${field}=${matcher}`)
      .join(', ');
    throw new Error(
      `CollectionHelper: Không tìm thấy item khớp filters: ${filterDesc}`
    );
  }

  /**
   * Tìm item và lấy data của nó
   *
   * @param items - Locator cho tất cả items
   * @param filters - Object với tên field và matcher
   * @param fields - Các fields cần trả về (mặc định là các filter keys)
   * @param cleaners - Các hàm làm sạch text (tuỳ chọn)
   */
  async findItemData(
    items: Locator,
    filters: FilterCriteria,
    fields?: string[],
    cleaners?: FieldCleanerMap
  ): Promise<Record<string, string>> {
    const item = await this.findItemByFilters(items, filters, cleaners);
    const fieldsToGet = fields || Object.keys(filters);
    return this.getItemData(item, fieldsToGet, cleaners);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁC METHOD TIỆN ÍCH
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Lấy instance của resolver
   */
  getResolver(): R {
    return this.resolver;
  }

  /**
   * Lấy số lượng items trong collection
   */
  async getCount(items: Locator): Promise<number> {
    return items.count();
  }

  /**
   * Kiểm tra có item nào khớp filter không
   */
  async hasItem(
    items: Locator,
    field: string,
    matcher: TextMatcher,
    cleaners?: FieldCleanerMap
  ): Promise<boolean> {
    try {
      await this.findItem(items, field, matcher, cleaners);
      return true;
    } catch {
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁC METHOD PHÂN TRANG
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Tìm item qua nhiều trang với phân trang thông minh
   *
   * Thuật toán:
   * 1. Lấy tổng số trang via getTotalPages()
   * 2. Tìm trên trang hiện tại trước
   * 3. Nếu không thấy, duyệt qua các trang còn lại
   * 4. Trả về item khi tìm thấy hoặc throw sau khi duyệt hết
   *
   * @param getItems - Function trả về items locator (gọi mỗi trang)
   * @param field - Tên field để so khớp
   * @param matcher - Giá trị cần khớp (string, regex, hoặc function)
   * @param pagination - Các callback phân trang
   * @param cleaners - Các hàm làm sạch text (tuỳ chọn)
   * @returns Item tìm được và số trang
   *
   * @example
   * ```typescript
   * const result = await helper.findItemAcrossPages(
   *   () => productsPage.element('productCards'),
   *   'name',
   *   'Indonesia Java Estate',
   *   {
   *     getTotalPages: () => productsPage.getTotalPages(),
   *     goToPage: (page) => productsPage.goToPage(page),
   *     getCurrentPage: () => productsPage.getCurrentPage(), // tuỳ chọn
   *   }
   * );
   * console.log(`Tìm thấy ở trang ${result.pageNumber}`);
   * ```
   */
  async findItemAcrossPages(
    getItems: () => Locator,
    field: string,
    matcher: TextMatcher,
    pagination: {
      getTotalPages: () => Promise<number>;
      goToPage: (pageNumber: number) => Promise<void>;
      getCurrentPage?: () => Promise<number>;
    },
    cleaners?: FieldCleanerMap
  ): Promise<{ item: Locator; pageNumber: number }> {
    // Bước 1: Lấy tổng số trang
    const totalPages = await pagination.getTotalPages();
    
    // Bước 2: Xác định trang bắt đầu
    const startPage = pagination.getCurrentPage 
      ? await pagination.getCurrentPage() 
      : 1;

    // Bước 3: Tìm kiếm từ trang hiện tại
    for (let page = startPage; page <= totalPages; page++) {
      // Chuyển đến trang nếu chưa ở đó
      if (page !== startPage) {
        await pagination.goToPage(page);
      }

      // Thử tìm item trên trang này
      const items = getItems();
      const found = await this.hasItem(items, field, matcher, cleaners);
      
      if (found) {
        const item = await this.findItem(items, field, matcher, cleaners);
        return { item, pageNumber: page };
      }
    }

    // Bước 4: Nếu bắt đầu giữa chừng, tìm các trang trước startPage
    if (startPage > 1) {
      for (let page = 1; page < startPage; page++) {
        await pagination.goToPage(page);
        
        const items = getItems();
        const found = await this.hasItem(items, field, matcher, cleaners);
        
        if (found) {
          const item = await this.findItem(items, field, matcher, cleaners);
          return { item, pageNumber: page };
        }
      }
    }

    throw new Error(
      `CollectionHelper: Không tìm thấy item với "${field}" khớp ${matcher} ` +
      `sau khi duyệt hết ${totalPages} trang`
    );
  }

  /**
   * Tìm item qua nhiều trang với callback goToNextPage đơn giản hơn
   * Dùng khi không có navigation trực tiếp đến trang
   *
   * @param getItems - Function trả về items locator
   * @param field - Tên field để so khớp
   * @param matcher - Giá trị cần khớp
   * @param pagination - Các callback phân trang
   * @param cleaners - Các hàm làm sạch text (tuỳ chọn)
   */
  async findItemWithNextPage(
    getItems: () => Locator,
    field: string,
    matcher: TextMatcher,
    pagination: {
      getTotalPages: () => Promise<number>;
      goToNextPage: () => Promise<void>;
      goToFirstPage?: () => Promise<void>;
    },
    cleaners?: FieldCleanerMap
  ): Promise<{ item: Locator; pageNumber: number }> {
    // Về trang đầu nếu có
    if (pagination.goToFirstPage) {
      await pagination.goToFirstPage();
    }

    const totalPages = await pagination.getTotalPages();
    Logger.ui(`🔍 Đang tìm trong ${totalPages} trang với ${field}="${matcher}"`);

    for (let page = 1; page <= totalPages; page++) {
      // Tìm trên trang hiện tại
      const items = getItems();
      const found = await this.hasItem(items, field, matcher, cleaners);
      
      if (found) {
        const item = await this.findItem(items, field, matcher, cleaners);
        Logger.ui(`✔ Tìm thấy ở trang ${page}/${totalPages}`);
        return { item, pageNumber: page };
      }

      // Chuyển sang trang tiếp nếu chưa phải trang cuối
      if (page < totalPages) {
        await pagination.goToNextPage();
      }
    }

    Logger.ui(`✖ Không tìm thấy sau khi duyệt ${totalPages} trang`);
    throw new Error(
      `CollectionHelper: Không tìm thấy item với "${field}" khớp ${matcher} ` +
      `sau khi duyệt hết ${totalPages} trang`
    );
  }
}
