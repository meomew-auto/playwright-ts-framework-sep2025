/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO AUTHENTICATION SETUP — Chạy 1 lần trước tất cả Neko tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Tạo file storageState (.auth/neko-admin.json) chứa localStorage data.
 * Khác CMS (cookie-based), Neko lưu JWT trong localStorage key `neko_auth`.
 *
 * 📌 FLOW:
 * 1. Check storageState file có valid không (JWT chưa hết hạn)
 * 2. Nếu valid → skip
 * 3. Nếu invalid → gọi API login → tạo Zustand format → save file
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: NekoAuthProvider (login + createStorageState)
 * - Tạo ra: .auth/neko-admin.json → dùng bởi auth.fixture.ts + auth.api.fixture.ts
 */

import { test as setup, expect } from '@playwright/test';
import { nekoAuth } from './NekoAuthProvider';
import { Logger } from '@utils/Logger';

setup('Neko Coffee Authentication', async ({ request }) => {
  // Check if storage state is still valid
  if (nekoAuth.isStorageStateValid('admin')) {
    Logger.info('Storage state valid, skipping login', { context: 'setup' });
    return;
  }

  // Login and save storage state
  Logger.info('Logging in as admin...', { context: 'setup' });
  const result = await nekoAuth.loginAndSave(request, 'admin');
  
  expect(result.accessToken).toBeTruthy();
  Logger.info('Authentication complete', { context: 'setup' });
});
