/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO AUTHENTICATION SETUP — Chạy 1 lần trước tất cả Neko tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Tạo file storageState (.auth/neko-admin.json) cho admin role.
 * Khác CMS (cookie-based), Neko lưu JWT trong localStorage key `neko_auth`.
 *
 * 📌 FLOW:
 * 1. Check storageState file có valid không (JWT chưa hết hạn)
 * 2. Nếu valid → skip
 * 3. Nếu invalid → gọi API login → tạo Zustand format → save file
 *
 * 📌 MULTI-ROLE:
 * Setup chỉ login ADMIN (mặc định, chạy mọi test).
 * Roles khác (staff, manager) → lazy login trong role.fixture.ts
 * khi test gọi asRole('staff') hoặc asRole('manager').
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: NekoAuthProvider (login + createStorageState)
 * - Tạo ra: .auth/neko-admin.json
 * - Dùng bởi: auth.fixture.ts, auth.api.fixture.ts
 * - Roles khác: role.fixture.ts (lazy login)
 */

import { test as setup, expect } from '@playwright/test';
import { nekoAuth } from './NekoAuthProvider';
import { Logger } from '@utils/Logger';

setup('Neko Coffee Authentication', async ({ request }) => {
  if (nekoAuth.isStorageStateValid('admin')) {
    Logger.info('Storage state valid for admin, skipping login', { context: 'setup' });
    return;
  }

  Logger.info('Logging in as admin...', { context: 'setup' });
  const result = await nekoAuth.loginAndSave(request, 'admin');
  expect(result.accessToken).toBeTruthy();
  Logger.info('Authentication complete for admin', { context: 'setup' });
});
