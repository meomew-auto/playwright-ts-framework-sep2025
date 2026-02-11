/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CMS AUTHENTICATION SETUP — Chạy 1 lần trước tất cả CMS tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Tạo file storageState (.auth/cms-admin.json) chứa session cookie.
 * File này được các test project dùng qua `storageState` option.
 *
 * 📌 KHI NÀO CHẠY:
 * Được config là "setup project" trong playwright.config.ts:
 * → Playwright chạy setup TRƯỚC, rồi mới chạy tests.
 *
 * 📚 FLOW:
 * 1. Check storageState file còn valid không
 * 2. Nếu valid → skip (nhanh)
 * 3. Nếu invalid → mở browser → loginViaUI() → save cookie
 *
 * 🔗 LIÊN KẾT:
 * - Dùng: CMSAuthProvider, CMSLoginPage
 * - Tạo ra: .auth/cms-admin.json → dùng bởi auth.fixture.ts
 */

import { test as setup, expect } from '@playwright/test';
import { cmsAuth } from './CMSAuthProvider';
import { CMSLoginPage } from '../../pages/cms/CMSLoginPage';
import { Logger } from '../../utils/Logger';

setup('CMS eCommerce Authentication', async ({ page }) => {
  // Check if storage state is still valid
  if (cmsAuth.isStorageStateValid('admin')) {
    Logger.info('Storage state valid, skipping login', { context: 'setup' });
    return;
  }

  // Login via UI and save storage state
  Logger.info('Logging in via UI...', { context: 'setup' });
  
  const loginPage = new CMSLoginPage(page);
  await cmsAuth.loginViaUI(page, 'admin', loginPage);

  // Verify không bị redirect về login
  expect(page.url()).not.toContain('/login');
  
  Logger.info('Authentication complete', { context: 'setup' });
});
