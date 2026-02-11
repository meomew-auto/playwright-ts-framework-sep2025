/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STORAGE STATE UTILITIES — File I/O cho Playwright storageState
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Đọc/ghi file storageState JSON — format của Playwright để lưu
 * cookies và localStorage giữa các test runs.
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: BaseAuthProvider (load/save storage state)
 * - Helper cho: NekoAuthProvider (getLocalStorageValue → đọc neko_auth)
 *              CMSAuthProvider (getCookieValue → đọc session cookie)
 *
 * 📌 FILE FORMAT (admin.json):
 * ```json
 * {
 *   "cookies": [{ "name": "session", "value": "...", "domain": "..." }],
 *   "origins": [{
 *     "origin": "https://example.com",
 *     "localStorage": [{ "name": "token", "value": "..." }]
 *   }]
 * }
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import type { StorageState, LocalStorageItem } from './auth.types';

/**
 * Đọc storageState từ file JSON.
 * Trả về null nếu file không tồn tại hoặc JSON invalid.
 *
 * Dùng bởi: BaseAuthProvider.loadStorageState()
 */
export function readStorageState(filePath: string): StorageState | null {
  if (!fs.existsSync(filePath)) return null;
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as StorageState;
  } catch {
    return null;
  }
}

/**
 * Ghi storageState vào file JSON.
 * Tự động tạo thư mục cha nếu chưa tồn tại.
 *
 * Dùng bởi: BaseAuthProvider.saveStorageState()
 */
export function writeStorageState(filePath: string, state: StorageState): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

/** Kiểm tra file storageState tồn tại trên disk */
export function storageStateExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Đọc 1 giá trị localStorage từ storageState object.
 *
 * Dùng bởi: NekoAuthProvider.isStorageStateValid()
 * → đọc key 'neko_auth' để check token expiry
 *
 * @param state - StorageState object (đã đọc từ file)
 * @param key - localStorage key cần tìm (vd: 'neko_auth', 'access_token')
 * @param origin - Origin URL cụ thể (mặc định: origin đầu tiên)
 */
export function getLocalStorageValue(
  state: StorageState,
  key: string,
  origin?: string
): string | null {
  const targetOrigin = origin
    ? state.origins.find((o) => o.origin === origin)
    : state.origins[0];

  if (!targetOrigin?.localStorage) return null;

  const item = targetOrigin.localStorage.find((i) => i.name === key);
  return item?.value ?? null;
}

/**
 * Đọc 1 cookie value từ storageState object.
 *
 * Dùng bởi: CMSAuthProvider (đọc session cookie)
 */
export function getCookieValue(state: StorageState, cookieName: string): string | null {
  const cookie = state.cookies.find((c) => c.name === cookieName);
  return cookie?.value ?? null;
}

/**
 * Tạo storageState rỗng với 1 origin.
 * Dùng làm base khi build storageState thủ công.
 */
export function createEmptyStorageState(origin: string): StorageState {
  return {
    cookies: [],
    origins: [{ origin, localStorage: [] }],
  };
}

/**
 * Thêm localStorage items vào storageState.
 * Nếu origin đã tồn tại → append items, ngược lại → tạo origin mới.
 */
export function addLocalStorageItems(
  state: StorageState,
  items: LocalStorageItem[],
  origin: string
): StorageState {
  const existingOrigin = state.origins.find((o) => o.origin === origin);
  
  if (existingOrigin) {
    existingOrigin.localStorage.push(...items);
  } else {
    state.origins.push({ origin, localStorage: items });
  }
  
  return state;
}

