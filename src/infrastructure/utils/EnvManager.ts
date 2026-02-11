/**
 * ============================================================================
 * ENV MANAGER — Typed access cho environment variables
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Cung cấp typed getters cho biến môi trường (string, number, boolean).
 * Tự động load từ .env files bằng dotenv-flow.
 *
 * 📌 DOTENV-FLOW PRIORITY (cao → thấp):
 * 1. process.env (CLI args, system env)
 * 2. .env.local       (local overrides, git-ignored)
 * 3. .env.development (hoặc .env.production theo NODE_ENV)
 * 4. .env             (defaults)
 *
 * 📚 API:
 * - EnvManager.get(key, default?)        → string
 * - EnvManager.getNumber(key, default?)  → number
 * - EnvManager.getBoolean(key, default?) → boolean
 * - Throw Error nếu thiếu key và không có default
 *
 * 🔗 DÙNG BỞI:
 * - BaseAuthProvider.ts   → đọc credentials (username, password)
 * - NekoAuthProvider.ts   → NEKO_BASE_URL, NEKO_USERNAME, ...
 * - CMSAuthProvider.ts    → CMS_BASE_URL, CMS_USERNAME, ...
 * - BaseService.ts        → base URL cho API calls
 * - services.fixture.ts   → API token config
 * - auth.api.fixture.ts   → auth API config
 */

import dotenvFlow from 'dotenv-flow';

// Đảm bảo các biến môi trường được tải nếu Playwright chưa thực hiện
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Chỉ tải nếu các biến cần thiết có thể bị thiếu, 
// mặc dù cấu hình Playwright thường đã xử lý việc này.
// Đây là kiểm tra an toàn cho việc sử dụng độc lập hoặc tải nghiêm ngặt.
dotenvFlow.config({
  default_node_env: 'development',
  silent: true // tắt cảnh báo nếu thiếu file
});

export class EnvManager {
  /**
   * Lấy biến môi trường dưới dạng chuỗi.
   * @param key Tên của biến môi trường.
   * @param defaultValue Giá trị mặc định tùy chọn nếu biến không được thiết lập.
   * @returns Giá trị của biến môi trường.
   * @throws Error nếu biến không được thiết lập và không có giá trị mặc định.
   */
  static get(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Biến môi trường "${key}" chưa được định nghĩa.`);
    }
    return value;
  }

  /**
   * Lấy biến môi trường dưới dạng số.
   * @param key Tên của biến môi trường.
   * @param defaultValue Giá trị mặc định tùy chọn nếu biến không được thiết lập hoặc không hợp lệ.
   * @returns Giá trị số của biến môi trường.
   */
  static getNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (value === undefined) {
       if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Biến môi trường "${key}" chưa được định nghĩa.`);
    }
    const parsed = Number(value);
    if (isNaN(parsed)) {
       if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Biến môi trường "${key}" không phải là số hợp lệ: "${value}"`);
    }
    return parsed;
  }

  /**
   * Lấy biến môi trường dưới dạng boolean.
   * @param key Tên của biến môi trường.
   * @param defaultValue Giá trị mặc định tùy chọn nếu biến không được thiết lập.
   * @returns True nếu giá trị là 'true' (không phân biệt hoa thường), ngược lại là false.
   */
  static getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) {
       if (defaultValue !== undefined) {
        return defaultValue;
      }
       throw new Error(`Biến môi trường "${key}" chưa được định nghĩa.`);
    }
    return value.toLowerCase() === 'true';
  }
}
