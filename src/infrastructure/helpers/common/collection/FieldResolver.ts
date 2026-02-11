/**
 * ============================================================================
 * FIELD RESOLVER - Interface & Types cho CollectionHelper
 * ============================================================================
 *
 * Định nghĩa contract để tìm field locators từ các item trong collection.
 * Có thể implement các resolver khác nhau cho tables, grids, hoặc cấu trúc tuỳ chỉnh.
 */

import { Locator } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Matcher cho giá trị field - hỗ trợ exact match, regex, hoặc custom function
 */
export type TextMatcher = string | RegExp | ((value: string) => boolean);

/**
 * Function để làm sạch/biến đổi text trước khi so sánh hoặc trả về
 */
export type FieldCleaner = (text: string) => string;

/**
 * Map các field cleaners - key là tên field
 */
export type FieldCleanerMap = Record<string, FieldCleaner>;

/**
 * Tiêu chí lọc - key là tên field, value là matcher
 */
export type FilterCriteria = Record<string, TextMatcher>;

// ─────────────────────────────────────────────────────────────────────────────
// FIELD RESOLVER INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FieldResolver - Strategy interface để định vị fields trong collection items
 *
 * Các implementation:
 * - GridResolver: Dùng CSS selectors để tìm fields
 * - TableResolver: Dùng column index từ headers
 * - Custom: Logic tuỳ chỉnh cho cấu trúc DOM phức tạp
 *
 * @example
 * ```typescript
 * // Grid resolver
 * const resolver: FieldResolver = {
 *   resolve: (card, 'name') => card.locator('h3')
 * };
 *
 * // Table resolver
 * const resolver: FieldResolver = {
 *   resolve: (row, 'name') => row.locator('td').nth(0)
 * };
 * ```
 */
export interface FieldResolver {
  /**
   * Chuyển tên field thành Locator trong item
   *
   * @param item - Item trong collection (row, card, article, v.v.)
   * @param field - Tên field cần tìm
   * @returns Locator trỏ đến element của field
   * @throws Error nếu field không tồn tại
   */
  resolve(item: Locator, field: string): Locator;

  /**
   * Khởi tạo tuỳ chọn (ví dụ: mapping column của table)
   * Được gọi một lần trước khi resolve()
   */
  init?(): Promise<void>;

  /**
   * Lấy danh sách tên các field có sẵn
   */
  getFieldNames?(): string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// HÀM TIỆN ÍCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kiểm tra giá trị có khớp với TextMatcher không
 */
export function matchesValue(value: string, matcher: TextMatcher): boolean {
  if (typeof matcher === 'string') {
    return value === matcher;
  }
  if (matcher instanceof RegExp) {
    return matcher.test(value);
  }
  return matcher(value);
}

/**
 * Áp dụng cleaner cho text nếu có
 */
export function cleanFieldText(
  text: string,
  field: string,
  cleaners?: FieldCleanerMap
): string {
  const cleaner = cleaners?.[field];
  return cleaner ? cleaner(text) : text.trim();
}
