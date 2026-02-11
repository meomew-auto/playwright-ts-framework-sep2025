/**
 * ============================================================
 * 📦 TEST DATA REPOSITORY (Catalog Pattern)
 * ============================================================
 *
 * Module trung tâm quản lý tất cả test data tĩnh (JSON).
 * Cung cấp hàm `getTestData()` để lấy data theo namespace + key,
 * với type-safety đầy đủ (autocomplete cả namespace lẫn key).
 *
 * 🔑 Khái niệm chính:
 * - Namespace = tên file JSON (vd: 'products', 'login')
 * - Key       = tên entry trong file JSON (vd: 'minimal', 'full')
 * - Data      = giá trị trong trường `data` của entry
 *
 * 📌 Ví dụ sử dụng:
 * ```ts
 * const product = getTestData('products', 'minimal');
 * // → { name: "Auto Minimal Product", category: "Sport shoes", ... }
 *
 * const custom = getTestData('products', 'minimal', {
 *   overrides: { name: 'Custom Name' },    // ghi đè 1 vài field
 * });
 *
 * const filtered = getTestData('login', 'negativeTestCases', {
 *   transform: (cases) => cases.filter(c => c.validationType === 'server'),
 * });
 * ```
 * ============================================================
 */

// ============================================================
// 📥 IMPORT JSON DATA FILES
// ============================================================
// Mỗi file JSON đại diện cho 1 "namespace" trong catalog.
// `with { type: 'json' }` = import assertion, cho TypeScript biết đây là JSON
// để suy ra type chính xác từ nội dung file (không cần khai báo interface thủ công).

import products from '../cms/json/products.json' with { type: 'json' };
import productsDev from '../cms/json/products-dev.json' with { type: 'json' };
import login from '../cms/json/login.json' with { type: 'json' };

// ============================================================
// 📐 TYPE DEFINITIONS
// ============================================================

/**
 * Cấu trúc 1 entry trong JSON file.
 * Mỗi entry gồm:
 * - `description` (optional): mô tả mục đích test data
 * - `data`: giá trị test data thực tế (object, array, hoặc primitive)
 *
 * Ví dụ 1 entry trong products.json:
 * ```json
 * {
 *   "minimal": {                         ← key
 *     "description": "Required fields",  ← mô tả
 *     "data": { "name": "...", ... }     ← data thực tế
 *   }
 * }
 * ```
 */
type DataEntry = {
  description?: string;
  data: unknown;
};

/**
 * Cấu trúc tổng thể của catalog:
 * - Level 1: namespace (tên file JSON) → Record<string, DataEntry>
 * - Level 2: key (tên entry) → DataEntry
 *
 * Dùng để validate `testDataCatalog` bên dưới có đúng format.
 */
type DataCatalog = Record<string, Record<string, DataEntry>>;

// ============================================================
// 📚 TEST DATA CATALOG
// ============================================================

/**
 * Catalog tập trung tất cả test data JSON.
 *
 * - `as const` → giữ nguyên literal types (không bị widen thành string/number)
 *   → cho phép autocomplete chính xác: getTestData('products', 'minimal')
 * - `satisfies DataCatalog` → validate cấu trúc đúng format DataEntry
 *   mà KHÔNG mất type information (khác với `: DataCatalog` sẽ mất literal types)
 *
 * 📌 Thêm JSON mới: import file → thêm vào object này → tự động có autocomplete.
 */
export const testDataCatalog = {
  products,     // namespace 'products'    → products.json
  productsDev,  // namespace 'productsDev' → products-dev.json
  login,        // namespace 'login'       → login.json
} as const satisfies DataCatalog;

// ============================================================
// 🔧 UTILITY TYPES (dùng nội bộ cho type-safety)
// ============================================================

/** Type chính xác của catalog (giữ literal types từ `as const`) */
export type TestDataCatalog = typeof testDataCatalog;

/** Các namespace hợp lệ: 'products' | 'productsDev' | 'login' */
export type TestDataNamespace = keyof TestDataCatalog;

/**
 * Trích xuất type đầy đủ của 1 entry (bao gồm cả `description` và `data`).
 *
 * Dùng conditional type + `infer D` để "đào" vào trường `data`:
 * - Nếu entry có dạng `{ data: infer D }` → trả về entry & { data: D }
 * - Ngược lại → never (entry không hợp lệ)
 *
 * @template N - Namespace (vd: 'products')
 * @template K - Key trong namespace (vd: 'minimal')
 */
type CatalogEntry<
  N extends TestDataNamespace,
  K extends keyof TestDataCatalog[N]
> = TestDataCatalog[N][K] extends { data: infer D }
  ? TestDataCatalog[N][K] & { data: D }
  : never;

/**
 * Trích xuất CHỈ type của trường `data` từ 1 entry.
 *
 * Đây là type mà `getTestData()` trả về.
 * Ví dụ: CatalogData<'products', 'minimal'>
 * → { name: string; category: string; unit: string; ... }
 *
 * @template N - Namespace
 * @template K - Key
 */
export type CatalogData<
  N extends TestDataNamespace,
  K extends keyof TestDataCatalog[N]
> = CatalogEntry<N, K>['data'];

/**
 * Options cho `getTestData()`.
 *
 * @property overrides - Ghi đè 1 vài field (chỉ dùng với object data, không dùng cho array)
 *   Ví dụ: `{ overrides: { name: 'Custom' } }` → chỉ đổi name, giữ nguyên các field khác
 *
 * @property transform - Biến đổi data sau khi clone (dùng cho cả object lẫn array)
 *   Ví dụ: `{ transform: (cases) => cases.filter(c => c.validationType === 'server') }`
 */
type GetTestDataOptions<N extends TestDataNamespace, K extends keyof TestDataCatalog[N]> = {
  overrides?: Partial<CatalogData<N, K>>;
  transform?: (data: CatalogData<N, K>) => CatalogData<N, K>;
};

// ============================================================
// 🔨 HELPER FUNCTIONS
// ============================================================

/**
 * Deep clone data để mỗi test nhận bản copy riêng, tránh mutation chéo.
 *
 * Ưu tiên dùng `structuredClone` (native, hỗ trợ Date, Map, Set, ...).
 * Fallback sang `JSON.parse(JSON.stringify())` cho môi trường cũ
 * (không hỗ trợ circular references hoặc special types).
 */
function cloneData<T>(data: T): T {
  return structuredClone
    ? structuredClone(data)
    : JSON.parse(JSON.stringify(data));
}

// ============================================================
// 🚀 MAIN API
// ============================================================

/**
 * Lấy test data từ catalog theo namespace + key.
 *
 * Flow xử lý:
 * 1. Tra cứu entry trong catalog bằng namespace + key
 * 2. Deep clone data (tránh mutation ảnh hưởng test khác)
 * 3. Áp dụng overrides nếu có (Object.assign, chỉ cho object)
 * 4. Áp dụng transform nếu có (function tùy chỉnh)
 *
 * @template N - Namespace (autocomplete: 'products' | 'productsDev' | 'login')
 * @template K - Key trong namespace (autocomplete tùy namespace)
 *
 * @param namespace - Tên nhóm data (= tên file JSON)
 * @param key       - Tên entry trong nhóm
 * @param options   - Tùy chọn: overrides (ghi đè field) hoặc transform (biến đổi)
 * @returns Deep clone của data, đã áp dụng overrides/transform
 *
 * @throws Error nếu namespace.key không tồn tại
 * @throws Error nếu dùng overrides với data không phải object (array, primitive)
 *
 * @example
 * // Lấy data nguyên bản
 * const product = getTestData('products', 'minimal');
 *
 * // Ghi đè 1 vài field
 * const custom = getTestData('products', 'full', {
 *   overrides: { name: 'My Product', unitPrice: 999 },
 * });
 *
 * // Biến đổi data (dùng cho array)
 * const serverCases = getTestData('login', 'negativeTestCases', {
 *   transform: (cases) => cases.filter(c => c.validationType === 'server'),
 * });
 */
export function getTestData<
  N extends TestDataNamespace,
  K extends keyof TestDataCatalog[N]
>(
  namespace: N,
  key: K,
  options?: GetTestDataOptions<N, K>
): CatalogData<N, K> {

  // Bước 1: Tra cứu entry trong catalog
  const entry = testDataCatalog[namespace][key] as CatalogEntry<N, K>;

  if (!entry) {
    throw new Error(`Unknown test data entry: ${String(namespace)}.${String(key)}`);
  }

  // Bước 2: Deep clone data (mỗi test nhận bản riêng, tránh mutation chéo)
  const base = cloneData(entry.data) as CatalogData<N, K>;

  // Bước 3: Áp dụng overrides (chỉ hỗ trợ object, không hỗ trợ array/primitive)
  if (options?.overrides) {
    if (Array.isArray(base) || typeof base !== 'object' || base === null) {
      throw new Error(
        `Overrides are only supported for object data. Use transform() for arrays or primitives: ${String(
          namespace
        )}.${String(key)}`
      );
    }

    // Merge overrides vào base (shallow merge, chỉ ghi đè top-level fields)
    Object.assign(base as object, options.overrides);
  }

  // Bước 4: Áp dụng transform function nếu có
  return options?.transform ? options.transform(base) : base;
}
