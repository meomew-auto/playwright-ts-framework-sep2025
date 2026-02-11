/**
 * ============================================================================
 * GRID RESOLVER - Tìm Field dựa trên CSS Selector
 * ============================================================================
 *
 * Tìm fields bằng CSS selectors. Phù hợp cho:
 * - Product cards
 * - Article grids
 * - Bất kỳ collection nào không có table headers
 *
 * @example
 * ```typescript
 * const resolver = new GridResolver({
 *   name: 'h3',
 *   price: '.price',
 *   type: '[data-testid="type"]',
 *   image: 'img',
 * });
 *
 * const helper = new CollectionHelper(resolver);
 * const names = await helper.getFieldValues(cards, 'name');
 * ```
 */

import { Locator } from '@playwright/test';
import { FieldResolver } from './FieldResolver';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map field: tên field → CSS selector
 */
export type FieldSelectorMap = Record<string, string>;

// ─────────────────────────────────────────────────────────────────────────────
// GRID RESOLVER CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class GridResolver implements FieldResolver {
  constructor(private readonly fieldMap: FieldSelectorMap) {
    if (Object.keys(fieldMap).length === 0) {
      throw new Error('GridResolver: fieldMap không được rỗng');
    }
  }

  /**
   * Chuyển tên field thành Locator bằng CSS selector
   *
   * @param item - Item trong grid (card, article, v.v.)
   * @param field - Tên field cần tìm
   * @returns Locator cho element của field
   * @throws Error nếu field không được định nghĩa trong fieldMap
   */
  resolve(item: Locator, field: string): Locator {
    const selector = this.fieldMap[field];

    if (!selector) {
      const available = this.getFieldNames().join(', ');
      throw new Error(
        `GridResolver: Không tìm thấy field "${field}". Các field có sẵn: ${available}`
      );
    }

    return item.locator(selector);
  }

  /**
   * Lấy tất cả tên field có sẵn
   */
  getFieldNames(): string[] {
    return Object.keys(this.fieldMap);
  }

  /**
   * Kiểm tra field có được định nghĩa không
   */
  hasField(field: string): boolean {
    return field in this.fieldMap;
  }

  /**
   * Lấy selector của field (để debug)
   */
  getSelector(field: string): string | undefined {
    return this.fieldMap[field];
  }
}
