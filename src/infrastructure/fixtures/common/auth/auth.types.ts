/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUTH TYPES — Shared contracts cho multi-project authentication
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Định nghĩa các interface CHUNG mà CMS và Neko đều tuân theo.
 * Đây là "contract" giữa BaseAuthProvider và các concrete implementations.
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: BaseAuthProvider, CMSAuthProvider, NekoAuthProvider
 * - Import bởi: storage-state.utils, jwt.utils
 */

/** Role name — dùng generic string để mỗi project tự định nghĩa roles */
export type RoleName = string;

/**
 * Config cho auth của 1 project.
 * Được tạo tự động bởi BaseAuthProvider.config getter
 * từ environment variables (CMS_API_URL, NEKO_UI_ORIGIN, ...).
 */
export interface AuthConfig {
  /** API base URL, vd: 'https://api.example.com' */
  apiUrl: string;
  /** UI origin cho storageState, vd: 'https://example.com' */
  uiOrigin: string;
  /** Thư mục lưu file auth, vd: 'auth' hoặc '.auth' */
  authDir: string;
  /** Số phút buffer trước khi token hết hạn (default: 5) */
  bufferMinutes: number;
}

/**
 * Credentials cho 1 role — trả về từ AuthProvider.getCredentials().
 * - CMS dùng email + password
 * - Neko dùng username + password
 */
export interface RoleCredentials {
  username?: string;
  email?: string;
  password: string;
}

/**
 * Kết quả trả về từ login API.
 * Cả CMS và Neko đều trả về cùng interface này,
 * dù API endpoint và field names có thể khác nhau.
 */
export interface LoginResult {
  accessToken: string;
  refreshToken?: string;
  /** Unix timestamp in ms — dùng để check hết hạn */
  expiresAt?: number;
}

/**
 * User info — decode từ JWT payload bởi jwt.utils.extractUserFromToken().
 * Neko dùng để tạo Zustand state (neko_auth.state.user).
 */
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAYWRIGHT STORAGE STATE FORMAT
// ═══════════════════════════════════════════════════════════════════════════
// Đây là format chính thức của Playwright để lưu trạng thái browser.
// File JSON này được load bởi `storageState` option trong playwright.config.
//
// CMS dùng cookies: { cookies: [...], origins: [] }
// Neko dùng localStorage: { cookies: [], origins: [{ localStorage: [...] }] }

/** Playwright storageState format — root object */
export interface StorageState {
  cookies: Cookie[];
  origins: Origin[];
}

/** Browser cookie — CMS auth dùng format này */
export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/** Origin entry — chứa localStorage items cho 1 origin */
export interface Origin {
  origin: string;
  localStorage: LocalStorageItem[];
}

/** localStorage item — Neko auth dùng format này */
export interface LocalStorageItem {
  name: string;
  value: string;
}

