/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO CONTEXT FACTORY — Single source of truth cho POM + Service creation
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Tập trung logic tạo POMs và API Services vào 1 nơi duy nhất (DRY).
 * Cả app.fixture (admin) và role.fixture (bất kỳ role) đều dùng factory này.
 *
 * 📌 PATTERN: Factory + DRY
 * - Thêm POM mới → sửa NekoPOMs type + createNekoPOMs()
 * - Thêm Service mới → sửa NekoServices type + createNekoServices()
 * - KHÔNG cần sửa app.fixture, role.fixture, hay unified.fixture!
 *
 * 📚 CÁCH FACTORY ĐƯỢC SỬ DỤNG:
 *
 * ┌─────────────────┐     createNekoPOMs()      ┌─────────────────┐
 * │  app.fixture.ts  │ ──────────────────────── │  Factory này      │
 * │  (admin POMs)   │     createNekoServices()  │  (tạo tất cả)   │
 * └─────────────────┘                           └─────────────────┘
 *         │                                              │
 *         │  Cùng factory!                               │
 *         │                                              │
 * ┌─────────────────┐     createNekoPOMs()      ┌─────────────────┐
 * │  role.fixture.ts │ ──────────────────────── │  Factory này      │
 * │  (mọi role)     │     createNekoServices()  │  (tạo tất cả)   │
 * └─────────────────┘                           └─────────────────┘
 *
 * 🔧 THÊM POM MỚI:
 * 1. import { NewPage } from '@pages/neko/NewPage';
 * 2. NekoPOMs type → thêm newPage: NewPage;
 * 3. createNekoPOMs() → thêm newPage: new NewPage(page, viewport);
 * → Tự động có trong app.fixture (admin) VÀ asRole() (mọi role)!
 *
 * 🔧 THÊM SERVICE MỚI:
 * 1. import { NewService } from '@api/neko/NewService';
 * 2. NekoServices type → thêm newService: NewService;
 * 3. createNekoServices() → thêm newService: new NewService(apiRequest, token);
 * → Tự động có trong services.fixture (admin) VÀ asRole() (mọi role)!
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: app.fixture.ts (admin POMs), role.fixture.ts (multi-role)
 * - Dùng bởi: services.fixture.ts (admin services)
 */

import { Page, APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { ViewportType } from '@fixtures/common/ViewportType';
import { EnvManager } from '@utils/EnvManager';
import { Logger } from '@utils/Logger';

// ─── Import POMs ────────────────────────────────────────────────────────────
import { ProductsPage } from '@pages/neko/ProductsPage';
import { OrdersPage } from '@pages/neko/OrdersPage';
import { ChatPage } from '@pages/neko/ChatPage';

// ─── Import Services ────────────────────────────────────────────────────────
import { ProductService } from '@api/neko/ProductService';
import { OrderService } from '@api/neko/OrderService';
import { ChatService } from '@api/neko/ChatService';

// ─── Import Auth utils ──────────────────────────────────────────────────────
import { nekoAuth } from './NekoAuthProvider';
import { getLocalStorageValue } from '@fixtures/common/auth/storage-state.utils';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Tất cả POMs của Neko project */
export type NekoPOMs = {
  productsPage: ProductsPage;
  ordersPage: OrdersPage;
  chatPage: ChatPage;
};

/** Tất cả API Services của Neko project */
export type NekoServices = {
  apiRequest: APIRequestContext;
  orderService: OrderService;
  productService: ProductService;
  chatService: ChatService;
};

/** Full context cho 1 role — POMs + Services + raw page/token */
export type NekoRoleContext = NekoPOMs & NekoServices & {
  page: Page;
  token: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tạo tất cả POMs từ 1 Page.
 * Thêm POM mới → thêm vào đây.
 */
export function createNekoPOMs(page: Page, viewport: ViewportType): NekoPOMs {
  return {
    productsPage: new ProductsPage(page, viewport),
    ordersPage: new OrdersPage(page, viewport),
    chatPage: new ChatPage(page, viewport),
  };
}

/**
 * Tạo tất cả API Services từ token.
 * Mỗi lần gọi sẽ tạo 1 APIRequestContext mới (isolated per role).
 *
 * ⚠️ Caller phải dispose apiRequest sau khi dùng xong.
 */
export async function createNekoServices(token: string): Promise<NekoServices> {
  const apiBaseUrl = EnvManager.get('NEKO_API_URL');
  const apiRequest = await playwrightRequest.newContext({
    baseURL: apiBaseUrl,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  });

  return {
    apiRequest,
    orderService: new OrderService(apiRequest, token),
    productService: new ProductService(apiRequest, token),
    chatService: new ChatService(apiRequest, token),
  };
}

/**
 * Extract auth token từ storageState file cho 1 role.
 * Check 2 nơi: `access_token` (direct) và `neko_auth` (Zustand format).
 */
export function extractTokenForRole(role: string): string {
  const state = nekoAuth.loadStorageState(role);
  if (!state) {
    throw new Error(
      `Storage state not found for role "${role}". ` +
      `Run neko-setup first or check .auth/neko-${role}.json exists.`
    );
  }

  // Try direct access_token first
  const accessToken = getLocalStorageValue(state, 'access_token');
  if (accessToken) return accessToken;

  // Fallback: Zustand format (neko_auth)
  const nekoAuthValue = getLocalStorageValue(state, 'neko_auth');
  if (nekoAuthValue) {
    try {
      const parsed = JSON.parse(nekoAuthValue);
      const token = parsed.state?.accessToken;
      if (token) return token;
    } catch {
      // ignore parse errors
    }
  }

  throw new Error(
    `Could not extract token from storage state for role "${role}". ` +
    `Check .auth/neko-${role}.json format.`
  );
}
