/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PLAYWRIGHT CONFIG — Cấu hình chính cho Playwright Test
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 📌 MÔI TRƯỜNG:
 * dotenv-flow: load .env files theo NODE_ENV (entry point — chạy ĐẦU TIÊN)
 * EnvManager:  đọc typed values (string, number, boolean) từ process.env
 *
 * 📌 CẤU TRÚC PROJECTS:
 * ┌─────────────────┬────────────────────────────────────┐
 * │ Setup           │ cms-setup, neko-setup               │
 * │ CMS UI          │ cms-desktop, cms-mobile             │
 * │ Neko UI         │ neko-ui                             │
 * │ Neko API        │ neko-api                            │
 * └─────────────────┴────────────────────────────────────┘
 *
 * 🔗 XEM THÊM: https://playwright.dev/docs/test-configuration
 */

import { defineConfig, devices } from '@playwright/test';
import dotenvFlow from 'dotenv-flow';
import type { ViewportType } from './src/infrastructure/fixtures/common/ViewportType';
import { EnvManager } from './src/infrastructure/utils/EnvManager';

// ═══════════════════════════════════════════════════════════════════════════
// 1️⃣ INIT MÔI TRƯỜNG — dotenv-flow load .env → .env.development → .env.local
//    Đây là entry point chính, phải chạy TRƯỚC khi đọc bất kỳ biến nào.
//    EnvManager cũng có fallback init, nhưng file này đảm bảo load sớm nhất.
// ═══════════════════════════════════════════════════════════════════════════
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

dotenvFlow.config({
  default_node_env: 'development',
});

// ═══════════════════════════════════════════════════════════════════════════
// 2️⃣ ĐỌC BIẾN MÔI TRƯỜNG — EnvManager typed getters (string, number)
// ═══════════════════════════════════════════════════════════════════════════
const CMS_UI_ORIGIN = EnvManager.get('CMS_UI_ORIGIN');
const NEKO_UI_ORIGIN = EnvManager.get('NEKO_UI_ORIGIN');
const NEKO_API_URL = EnvManager.get('NEKO_API_URL');
const AUTH_DIR = EnvManager.get('AUTH_DIR', '.auth');
const DEFAULT_EXPECT_TIMEOUT = EnvManager.getNumber('DEFAULT_EXPECT_TIMEOUT', 30000);

// Mở rộng Playwright test options với viewportType
// Mỗi project có thể set: use: { viewportType: 'desktop' | 'mobile' | 'tablet' }
type CustomTestOptions = {
  viewportType: ViewportType;
};

export default defineConfig<CustomTestOptions>({
  testDir: './src/presentation/tests',

  /* Chạy test song song trong cùng 1 file */
  fullyParallel: true,

  /* Fail nếu để quên test.only trong CI */
  forbidOnly: !!process.env.CI,

  /* Retry chỉ trên CI */
  retries: process.env.CI ? 2 : 0,

  /* CI: chạy 1 worker, local: tự động */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter dạng HTML */
  reporter: [
    ['line'],
    ['allure-playwright'],
    ['html'],
  ],

  /* Cấu hình chung cho tất cả projects */
  use: {
    /* Base URL mặc định (CMS) */
    baseURL: CMS_UI_ORIGIN,

    /* Thu trace khi retry test thất bại */
    trace: 'on-first-retry',
    headless: !!process.env.CI, // CI: true (no display), Local: false (headed)

    /* Timeout cho actions (click, fill, ...) */
    actionTimeout: 15000,

    /* Maximize cửa sổ trình duyệt */
    launchOptions: {
      args: ['--start-maximized'],
    },
    viewport: null,
  },

  /* Timeout cho mỗi test (mặc định dùng từ env) */
  timeout: DEFAULT_EXPECT_TIMEOUT,

  /* ═══════════════════════════════════════════════════════════════════════ */
  /* 📋 DANH SÁCH PROJECTS                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */
  projects: [
    // ──────────────────────────────────────────────────────────
    // 🔐 CMS SETUP — Đăng nhập và lưu auth state
    // ──────────────────────────────────────────────────────────
    {
      name: 'cms-setup',
      testMatch: '**/auth.setup.ts',
      testDir: './src/infrastructure/fixtures/cms',
    },

    // ──────────────────────────────────────────────────────────
    // 🐱 NEKO SETUP — Đăng nhập API và lưu token
    // ──────────────────────────────────────────────────────────
    {
      name: 'neko-setup',
      testMatch: '**/neko.setup.ts',
      testDir: './src/infrastructure/fixtures/neko',
    },

    // ──────────────────────────────────────────────────────────
    // 🐱 NEKO COFFEE — Desktop UI Tests
    // ──────────────────────────────────────────────────────────
    {
      name: 'neko-ui',
      testDir: './src/presentation/tests/neko',
      testIgnore: '**/api/**', // Bỏ qua API tests
      use: {
        baseURL: NEKO_UI_ORIGIN,
        storageState: `${AUTH_DIR}/neko-admin.json`,
      },
      dependencies: ['neko-setup'],
    },

    // ──────────────────────────────────────────────────────────
    // 🐱 NEKO COFFEE — API Tests (không cần browser, cần token từ setup)
    // ──────────────────────────────────────────────────────────
    {
      name: 'neko-api',
      testDir: './src/presentation/tests/neko/products/api',
      use: {
        baseURL: NEKO_API_URL,
      },
      dependencies: ['neko-setup'],
    },

    // ──────────────────────────────────────────────────────────
    // 🖥️ CMS — Desktop Tests
    // ──────────────────────────────────────────────────────────
    {
      name: 'cms-desktop',
      testDir: './src/presentation/tests/cms',
      testIgnore: '**/*.mobile.spec.ts',
      use: {
        viewportType: 'desktop' as const,
        storageState: `${AUTH_DIR}/cms-admin.json`,
      },
      dependencies: ['cms-setup'],
    },

    // ──────────────────────────────────────────────────────────
    // 📱 CMS — Mobile Tests (iPhone viewport)
    // ──────────────────────────────────────────────────────────
    // ⚠️ PHẢI dùng viewport < 768px để trigger Footable responsive mode.
    // iPad (810px) quá rộng → Footable KHÔNG ẩn cột → expandRow() fail.
    // iPhone 12 (390px) → Footable ẩn cột → expand/collapse hoạt động.
    {
      name: 'cms-mobile',
      testDir: './src/presentation/tests/cms',
      testMatch: '**/*.mobile.spec.ts',
      use: {
        ...devices['iPhone 12'],
        viewportType: 'mobile' as const,
        storageState: `${AUTH_DIR}/cms-admin.json`,
      },
      dependencies: ['cms-setup'],
    },

    // Commented out projects (bật khi cần):
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // { name: 'mobile-safari', use: { ...devices['iPhone 12'], viewportType: 'mobile' as const } },
    // { name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
    // { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
  ],

  // Web server (bật khi test local dev server):
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
