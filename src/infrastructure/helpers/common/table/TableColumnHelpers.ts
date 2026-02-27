/**
 * ============================================================================
 * TABLE COLUMN HELPERS — Utility functions cho HTML table automation
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Cung cấp helper functions để đọc và thao tác dữ liệu từ HTML tables.
 * Dùng cho các page có layout <table> (thead/tbody/tr/td).
 *
 * 📌 COLUMN MAP:
 * Tự động build mapping từ header text → column index:
 *   { 'mã đơn': { index: 0, text: 'Mã đơn' }, 'khách hàng': { index: 1, ...} }
 * Hỗ trợ cả camelCase và lowercase keys.
 *
 * 📌 COLUMN CLEANERS:
 * Custom text extraction cho từng cột (ví dụ: lấy tên từ nested <p>,
 * clean price format, strip icon text...).
 *
 * 📚 FUNCTIONS:
 * - createColumnMap: Build header → index mapping
 * - getColumnValuesSimple: Lấy tất cả values của 1 cột
 * - getTableDataSimple: Lấy data nhiều cột từ tất cả rows
 * - findRowByFilterSimple: Tìm row theo nhiều điều kiện
 * - getRowDataByFiltersSimple: Tìm row + lấy data
 *
 * Copy từ PW_TS[2] — giữ nguyên logic, thêm JSDoc.
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: pages/neko-coffee/OrdersPage.ts
 */

import { Locator } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────

/** Thông tin 1 cột: vị trí index và text header */
export type ColumnInfo = {
  index: number;
  text: string;
};

/** Map từ column key → ColumnInfo */
export type ColumnMap = Record<string, ColumnInfo>;

/** Matcher cho text: string hoặc custom function */
export type TextMatcher = string | ((text: string) => boolean);

/** Custom cleaner cho 1 cell — extract text theo cách riêng */
export type ColumnTextCleaner = (cell: Locator) => Promise<string>;

// ─────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────

/** Chuyển "khách hàng" → "kháchHàng" (camelCase) */
function toCamelCase(text: string): string {
  const words = text.toLowerCase().split(' ');
  let result = words[0];
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const chuHoa = word.charAt(0).toUpperCase() + word.slice(1);
    result += chuHoa;
  }
  return result;
}

/** Clean header text: bỏ khoảng trắng thừa */
function cleanHeaderText(text: string): string {
  const parts = text.split(' ');
  const words = parts.filter((word) => word !== '');
  return words.join(' ');
}

// ─────────────────────────────────────────────────────────────────────────
// COLUMN MAP — Build mapping từ header text → column index
// ─────────────────────────────────────────────────────────────────────────

/**
 * Tạo column map từ header locators.
 * Mỗi header tạo 2 keys: camelCase và lowercase.
 *
 * @example
 * // Headers: ["Mã đơn", "Khách hàng", "Tổng tiền"]
 * // Result: { 'mãĐơn': { index: 0 }, 'mã đơn': { index: 0 }, ... }
 */
export async function createColumnMap(headers: Locator): Promise<ColumnMap> {
  const count = await headers.count();
  const map: ColumnMap = {};

  for (let index = 0; index < count; index++) {
    const headerLocator = headers.nth(index);
    const rawText = await headerLocator.innerText();
    const clean = cleanHeaderText(rawText);

    const info: ColumnInfo = { index, text: clean };

    const camelKey = toCamelCase(clean);
    if (camelKey) map[camelKey] = info;

    const lowerKey = clean.toLowerCase();
    if (lowerKey) map[lowerKey] = info;
  }
  return map;
}

/**
 * Lấy ColumnInfo cho 1 column key.
 * Có retry strategy: nếu không tìm thấy → rebuild map từ DOM.
 */
export async function getColumnInfoSimple(
  headersLocator: Locator,
  columnKey: string,
  columnMapCache?: ColumnMap | null
): Promise<{ info: ColumnInfo; columnMap: ColumnMap }> {
  // B1: Thử dùng cache nếu có
  let map: ColumnMap | null = columnMapCache || null;
  if (!map) {
    map = await createColumnMap(headersLocator);
  }

  // B2: Tìm column trong map
  let info = map[columnKey];

  // B3: Nếu không tìm thấy → tạo lại map từ DOM (retry)
  if (!info) {
    map = await createColumnMap(headersLocator);
    info = map[columnKey];
  }
  if (!info) {
    throw new Error(`Column "${columnKey}" không tìm thấy trong table headers`);
  }
  return { info, columnMap: map };
}

// ─────────────────────────────────────────────────────────────────────────
// CELL TEXT — Lấy text từ 1 cell (có hỗ trợ custom cleaner)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Lấy text từ 1 cell.
 * Nếu có custom cleaner cho column key đó → dùng cleaner.
 * Nếu không → dùng textContent mặc định.
 */
export async function getCellTextSimple(
  cell: Locator,
  columnKey: string,
  columnCleaner?: Record<string, ColumnTextCleaner>
): Promise<string> {
  const cleaner = columnCleaner?.[columnKey];
  if (cleaner) {
    return cleaner(cell);
  }
  const text = await cell.textContent();
  return (text || '').trim();
}

// ─────────────────────────────────────────────────────────────────────────
// GET COLUMN VALUES — Lấy tất cả values của 1 cột
// ─────────────────────────────────────────────────────────────────────────

/**
 * Lấy giá trị của 1 cột từ tất cả rows.
 *
 * @example
 * const orderIds = await getColumnValuesSimple(headers, rows, 'mã đơn');
 * // ['#B2C-001', '#B2C-002', ...]
 */
export async function getColumnValuesSimple(
  headersLocator: Locator,
  rowsLocator: Locator,
  columnKey: string,
  columnCleaner?: Record<string, ColumnTextCleaner>,
  columnMapCache?: ColumnMap | null
): Promise<string[]> {
  const result = await getColumnInfoSimple(headersLocator, columnKey, columnMapCache);
  const count = await rowsLocator.count();

  const values: string[] = [];
  for (let i = 0; i < count; i++) {
    const cell = rowsLocator.nth(i).locator(`td:nth-child(${result.info.index + 1})`);
    values.push(await getCellTextSimple(cell, columnKey, columnCleaner));
  }
  return values;
}

// ─────────────────────────────────────────────────────────────────────────
// BUILD ROW DATA — Xây dựng object dữ liệu từ 1 row
// ─────────────────────────────────────────────────────────────────────────

/**
 * Lấy text từ nhiều cells trong 1 row → trả về object.
 *
 * Logic:
 * 1. Loop qua từng column key
 * 2. Tìm vị trí cột (index) từ column map
 * 3. Lấy cell ở vị trí đó trong row
 * 4. Lấy text từ cell
 * 5. Lưu vào rowData object
 */
export async function buildRowDataSimple(
  headersLocator: Locator,
  rowsLocator: Locator,
  columnKeys: string[],
  columnCleaner?: Record<string, ColumnTextCleaner>,
  columnMapCache?: ColumnMap | null
): Promise<{ rowData: Record<string, string>; columnMap: ColumnMap }> {
  const rowData: Record<string, string> = {};
  let currentColumnMap = columnMapCache;

  for (const key of columnKeys) {
    const result = await getColumnInfoSimple(headersLocator, key, currentColumnMap);
    currentColumnMap = result.columnMap;
    const cell = rowsLocator.locator(`td:nth-child(${result.info.index + 1})`);
    rowData[key] = await getCellTextSimple(cell, key, columnCleaner);
  }
  return { rowData, columnMap: currentColumnMap! };
}

// ─────────────────────────────────────────────────────────────────────────
// GET TABLE DATA — Lấy dữ liệu toàn bộ table
// ─────────────────────────────────────────────────────────────────────────

/**
 * Lấy dữ liệu nhiều cột từ tất cả rows.
 *
 * @example
 * const data = await getTableDataSimple(headers, rows, ['mã đơn', 'tổng tiền']);
 * // [{ 'mã đơn': '#B2C-001', 'tổng tiền': '550000' }, ...]
 */
export async function getTableDataSimple(
  headersLocator: Locator,
  rowsLocator: Locator,
  columnKeys: string[],
  columnCleaner?: Record<string, ColumnTextCleaner>,
  columnMapCache?: ColumnMap | null
): Promise<Array<Record<string, string>>> {
  const rowCount = await rowsLocator.count();
  const data: Array<Record<string, string>> = [];
  let currentColumnMap = columnMapCache;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const row = rowsLocator.nth(rowIndex);
    const result = await buildRowDataSimple(
      headersLocator,
      row,
      columnKeys,
      columnCleaner,
      currentColumnMap
    );
    currentColumnMap = result.columnMap;
    data.push(result.rowData);
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────
// TEXT MATCHING
// ─────────────────────────────────────────────────────────────────────────

/** Kiểm tra text có khớp với matcher không */
const textMatches = (cellValue: string, condition: TextMatcher): boolean => {
  if (typeof condition === 'string') {
    return cellValue.includes(condition);
  }
  if (typeof condition === 'function') {
    return condition(cellValue);
  }
  return false;
};

// ─────────────────────────────────────────────────────────────────────────
// FIND ROW — Tìm row theo điều kiện
// ─────────────────────────────────────────────────────────────────────────

/**
 * Tìm row theo giá trị 1 cột.
 *
 * @example
 * const row = await findRowByColumnValueSimple(headers, rows, 'mã đơn', '#B2C-001');
 */
export async function findRowByColumnValueSimple(
  headersLocator: Locator,
  rowsLocator: Locator,
  columnKey: string,
  matcher: TextMatcher,
  columnCleaner?: Record<string, ColumnTextCleaner>,
  columnMapCache?: ColumnMap | null
): Promise<Locator> {
  const result = await getColumnInfoSimple(headersLocator, columnKey, columnMapCache);
  const count = await rowsLocator.count();

  for (let i = 0; i < count; i++) {
    const row = rowsLocator.nth(i);
    const cell = row.locator(`td:nth-child(${result.info.index + 1})`);
    const text = await getCellTextSimple(cell, columnKey, columnCleaner);
    if (textMatches(text, matcher)) {
      return row;
    }
  }
  throw new Error(`Không tìm thấy row có cột "${columnKey}" khớp với matcher`);
}

/**
 * Tìm row khớp với nhiều điều kiện filter cùng lúc.
 *
 * @example
 * const row = await findRowByFilterSimple(headers, rows, {
 *   'mã đơn': '#B2C-001',
 *   'trạng thái': 'Đã hủy'
 * });
 */
export async function findRowByFilterSimple(
  headersLocator: Locator,
  rowsLocator: Locator,
  filters: Record<string, TextMatcher>,
  columnCleaner?: Record<string, ColumnTextCleaner>,
  columnMapCache?: ColumnMap | null
): Promise<Locator> {
  const keys = Object.keys(filters);
  const count = await rowsLocator.count();
  let currentColumnMap = columnMapCache;

  // Tối ưu: lấy column index trước, tránh tìm lại nhiều lần
  const columnInfos: ColumnInfo[] = [];
  for (const key of keys) {
    const result = await getColumnInfoSimple(headersLocator, key, currentColumnMap);
    currentColumnMap = result.columnMap;
    columnInfos.push(result.info);
  }

  // Loop qua từng row để tìm row khớp tất cả filters
  for (let i = 0; i < count; i++) {
    const row = rowsLocator.nth(i);
    let matchedAll = true;

    for (let j = 0; j < keys.length; j++) {
      const key = keys[j];
      const info = columnInfos[j];
      const cell = row.locator(`td:nth-child(${info.index + 1})`);
      const text = await getCellTextSimple(cell, key, columnCleaner);

      if (!textMatches(text, filters[key])) {
        matchedAll = false;
        break;
      }
    }
    if (matchedAll) {
      return row;
    }
  }
  throw new Error('Không tìm thấy row khớp với tất cả filters');
}

// ─────────────────────────────────────────────────────────────────────────
// GET ROW DATA BY FILTERS — Tìm row + lấy data
// ─────────────────────────────────────────────────────────────────────────

/**
 * Xác định columnKeys để lấy dữ liệu.
 * Priority: columnKeys > defaultColumnKeys > keys từ filters
 */
const resolveColumnKeysForRowData = (
  filters: Record<string, TextMatcher>,
  columnKeys?: string[],
  defaultColumnKeys?: string[]
): string[] => {
  if (columnKeys && columnKeys.length > 0) return columnKeys;
  if (defaultColumnKeys && defaultColumnKeys.length > 0) return defaultColumnKeys;
  const keys = Object.keys(filters);
  if (keys.length === 0) {
    throw new Error('Không có column keys nào để lấy dữ liệu');
  }
  return keys;
};

/**
 * Tìm row theo filters rồi lấy data từ các cột chỉ định.
 *
 * @example
 * const data = await getRowDataByFiltersSimple(headers, rows,
 *   { 'mã đơn': '#B2C-001' },
 *   ['mã đơn', 'khách hàng', 'tổng tiền', 'trạng thái']
 * );
 * // { 'mã đơn': '#B2C-001', 'khách hàng': 'Ngô Thị K', ... }
 */
export async function getRowDataByFiltersSimple(
  headersLocator: Locator,
  rowsLocator: Locator,
  filters: Record<string, TextMatcher>,
  columnKeys?: string[],
  defaultColumnKeys?: string[],
  columnCleaners?: Record<string, ColumnTextCleaner>,
  columnMapCache?: ColumnMap | null
): Promise<Record<string, string>> {
  // Bước 1: Tìm row khớp với filters
  const row = await findRowByFilterSimple(
    headersLocator,
    rowsLocator,
    filters,
    columnCleaners,
    columnMapCache
  );

  // Bước 2: Xác định columnKeys để lấy dữ liệu
  const resolvedKeys = resolveColumnKeysForRowData(filters, columnKeys, defaultColumnKeys);

  // Bước 3: Lấy dữ liệu từ row
  const result = await buildRowDataSimple(
    headersLocator,
    row,
    resolvedKeys,
    columnCleaners,
    columnMapCache
  );

  return result.rowData;
}
