/**
 * ============================================================================
 * NEKO AUTH API FIXTURE — Extract JWT token cho API testing
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Đọc JWT token từ storageState file (admin.json) để inject vào API calls.
 * Token có thể nằm ở 2 nơi (do Zustand format phức tạp):
 * 1. localStorage key `access_token` (trực tiếp)
 * 2. localStorage key `neko_auth` → parse JSON → state.access_token
 *
 * 📌 TẠI SAO PHẢI CHECK 2 NƠI:
 * - Zustand persist format wrap data trong { state: {}, version: 0 }
 * - Nhưng capture-auth script có thể lưu trực tiếp vào key `access_token`
 * - Fixture check cả 2 để tương thích với cả 2 cách
 *
 * 🔗 LIÊN KẾT:
 * - Phụ thuộc: .auth/neko-admin.json (từ neko.setup.ts)
 * - Dùng bởi: services.fixture.ts (inject token vào API context)
 */

import { test as base } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { EnvManager } from '../../../utils/EnvManager';

// Storage state file path from env (same as NekoAuthProvider uses)
const authDir = EnvManager.get('NEKO_AUTH_DIR', 'auth');
const storageStatePath = path.resolve(authDir, 'admin.json');

// ─────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────

export type AuthApiFixtures = {
  authToken: string;
};

// ─────────────────────────────────────────────────────────────────────────
// FIXTURE
// ─────────────────────────────────────────────────────────────────────────

export const test = base.extend<AuthApiFixtures>({
  authToken: async ({}, use) => {
    if (!fs.existsSync(storageStatePath)) {
      throw new Error(
        `Storage state not found: ${storageStatePath}. Run neko-setup first.`
      );
    }
    
    // Read storage state
    const state = JSON.parse(fs.readFileSync(storageStatePath, 'utf-8'));
    
    // Extract token from localStorage (neko_auth or access_token)
    const origin = state.origins?.[0];
    const localStorage = origin?.localStorage || [];
    
    // Try access_token first (simpler)
    const accessTokenEntry = localStorage.find(
      (item: { name: string }) => item.name === 'access_token'
    );
    
    if (accessTokenEntry?.value) {
      await use(accessTokenEntry.value);
      return;
    }
    
    // Fallback to neko_auth (Zustand format)
    const nekoAuthEntry = localStorage.find(
      (item: { name: string }) => item.name === 'neko_auth'
    );
    
    if (nekoAuthEntry?.value) {
      const nekoAuth = JSON.parse(nekoAuthEntry.value);
      const token = nekoAuth.state?.accessToken;
      if (token) {
        await use(token);
        return;
      }
    }
    
    throw new Error('Could not extract access token from storage state');
  },
});
