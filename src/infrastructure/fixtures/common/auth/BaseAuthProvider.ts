/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BASE AUTH PROVIDER — Abstract class cho multi-project authentication
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 DESIGN PATTERN: Template Method
 * - Class này định nghĩa "skeleton" của auth flow (ensureAuthenticated)
 * - Mỗi project (CMS, Neko) chỉ cần override các bước khác nhau
 * - Các bước chung (load/save file, check exists) được xử lý ở đây
 *
 * 📌 CONCRETE IMPLEMENTATIONS:
 * - CMSAuthProvider  → cookie-based auth (loginViaUI)
 * - NekoAuthProvider → localStorage + Zustand (login API)
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: auth.setup.ts (CMS), neko.setup.ts (Neko)
 * - Phụ thuộc: storage-state.utils (file I/O), auth.types (interfaces)
 * - Config từ: EnvManager → .env file (CMS_API_URL, NEKO_API_URL, ...)
 *
 * 📚 FLOW TỔNG QUÁT:
 * ```
 * ensureAuthenticated(role)
 *   ├── isStorageStateValid(role)  ← abstract, mỗi project check khác nhau
 *   │   ├── CMS: check cookie expires
 *   │   └── Neko: check neko_auth.expiresAt
 *   │
 *   └── nếu invalid → loginAndSave(role)
 *       ├── login()                ← abstract, mỗi project login API khác
 *       ├── createStorageState()   ← abstract, CMS: cookies / Neko: localStorage
 *       └── saveStorageState()     ← shared, ghi file JSON
 * ```
 */

import * as path from 'path';
import { APIRequestContext } from '@playwright/test';
import { EnvManager } from '../../../utils/EnvManager';
import {
  readStorageState,
  writeStorageState,
  storageStateExists,
} from './storage-state.utils';
import type {
  AuthConfig,
  RoleCredentials,
  LoginResult,
  StorageState,
} from './auth.types';

export abstract class BaseAuthProvider {
  // ═══════════════════════════════════════════════════════════════════════
  // ABSTRACT METHODS — Mỗi project PHẢI override
  // ═══════════════════════════════════════════════════════════════════════
  // Đây là các bước KHÁC NHAU giữa CMS và Neko.
  // Template Method pattern: base class gọi các method này,
  // nhưng logic cụ thể do subclass quyết định.

  /**
   * Prefix cho environment variables.
   * - CMS: 'CMS' → CMS_API_URL, CMS_ADMIN_EMAIL, ...
   * - Neko: 'NEKO' → NEKO_API_URL, NEKO_ADMIN_USERNAME, ...
   */
  abstract readonly envPrefix: string;

  /**
   * Lấy credentials cho 1 role từ environment variables.
   * - CMS dùng email/password: CMS_ADMIN_EMAIL, CMS_ADMIN_PASSWORD
   * - Neko dùng username/password: NEKO_ADMIN_USERNAME, NEKO_ADMIN_PASSWORD
   */
  abstract getCredentials(role: string): RoleCredentials;

  /**
   * Tạo Playwright storageState format từ login result.
   * Đây là điểm KHÁC BIỆT LỚN NHẤT giữa CMS và Neko:
   * - CMS: trả về { cookies: [...], origins: [] }      (cookie-based)
   * - Neko: trả về { cookies: [], origins: [{ localStorage: [...] }] }  (Zustand)
   */
  abstract createStorageState(tokens: LoginResult): StorageState;

  /**
   * Kiểm tra storageState file còn valid không.
   * - CMS: check cookie `ecommerce_cms_session` chưa hết hạn
   * - Neko: parse JSON neko_auth → check expiresAt > now + buffer
   */
  abstract isStorageStateValid(role: string): boolean;

  /**
   * Login qua API và trả về tokens.
   * - CMS: POST /login (⚠️ deprecated, dùng loginViaUI thay thế)
   * - Neko: POST /auth/login
   */
  abstract login(request: APIRequestContext, role: string): Promise<LoginResult>;

  // ═══════════════════════════════════════════════════════════════════════
  // CONFIG — Tự động load từ EnvManager theo envPrefix
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Config getter — tự động đọc env vars theo prefix.
   * Ví dụ với envPrefix = 'NEKO':
   * - apiUrl     ← NEKO_API_URL
   * - uiOrigin   ← NEKO_UI_ORIGIN
   * - authDir    ← NEKO_AUTH_DIR (default: 'auth')
   * - bufferMinutes ← NEKO_TOKEN_BUFFER_MINUTES (default: 5)
   */
  get config(): AuthConfig {
    return {
      apiUrl: EnvManager.get(`${this.envPrefix}_API_URL`),
      uiOrigin: EnvManager.get(`${this.envPrefix}_UI_ORIGIN`),
      authDir: EnvManager.get(`${this.envPrefix}_AUTH_DIR`, 'auth'),
      bufferMinutes: EnvManager.getNumber(`${this.envPrefix}_TOKEN_BUFFER_MINUTES`, 5),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SHARED METHODS — Logic CHUNG cho tất cả projects
  // ═══════════════════════════════════════════════════════════════════════
  // Các method này KHÔNG cần override vì logic giống nhau:
  // đọc/ghi file JSON, compose login flow.

  /**
   * Tạo đường dẫn đến file storageState: {authDir}/{role}.json
   * Ví dụ: 'auth/admin.json', '.auth/cms-admin.json'
   */
  getStorageStatePath(role: string): string {
    return path.join(this.config.authDir, `${role}.json`);
  }

  /** Kiểm tra file storageState tồn tại trên disk */
  storageStateExists(role: string): boolean {
    return storageStateExists(this.getStorageStatePath(role));
  }

  /** Đọc storageState từ file JSON → object (hoặc null nếu lỗi) */
  loadStorageState(role: string): StorageState | null {
    return readStorageState(this.getStorageStatePath(role));
  }

  /** Ghi storageState object → file JSON */
  saveStorageState(role: string, state: StorageState): void {
    writeStorageState(this.getStorageStatePath(role), state);
    console.log(`✅ [${this.envPrefix}] Saved storage state for role: ${role}`);
  }

  /**
   * Full login flow: login → tạo storageState → ghi file.
   * Compose 3 abstract methods thành 1 pipeline hoàn chỉnh.
   *
   * Flow: login() → createStorageState() → saveStorageState()
   */
  async loginAndSave(request: APIRequestContext, role: string): Promise<LoginResult> {
    console.log(`🔐 [${this.envPrefix}] Logging in as: ${role}`);

    const tokens = await this.login(request, role);         // abstract → project-specific
    const state = this.createStorageState(tokens);           // abstract → cookies vs localStorage
    this.saveStorageState(role, state);                       // shared → ghi file JSON

    return tokens;
  }

  /**
   * 🎯 TEMPLATE METHOD chính — Entry point cho auth flow.
   *
   * Logic: Check valid → skip (nhanh) / login lại (chậm)
   * Được gọi từ setup projects (auth.setup.ts, neko.setup.ts)
   */
  async ensureAuthenticated(request: APIRequestContext, role: string): Promise<void> {
    // Fast path: nếu file tồn tại và token chưa hết hạn → skip login
    if (this.isStorageStateValid(role)) {
      console.log(`✅ [${this.envPrefix}] Storage state valid for: ${role}`);
      return;
    }

    // Slow path: login lại và lưu file mới
    console.log(`⚠️ [${this.envPrefix}] Storage state invalid, re-authenticating...`);
    await this.loginAndSave(request, role);
  }
}
