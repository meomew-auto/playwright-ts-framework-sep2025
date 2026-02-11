/**
 * ============================================================================
 * NEKO SERVICES FIXTURE — API context + service instances cho API testing
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Tạo Playwright APIRequestContext với baseURL và auth token,
 * rồi inject vào các service classes (ProductService, etc.)
 *
 * 📌 TẠI SAO TẠO API CONTEXT RIÊNG:
 * - UI test dùng page.request (context từ browser)
 * - API test cần context ĐỘC LẬP — không cần browser
 * - APIRequestContext từ `playwright.request.newContext()`
 *
 * 📚 PATTERN:
 * authToken (từ auth.api.fixture) → apiRequest (context) → services
 *
 * 🔗 LIÊN KẾT:
 * - Phụ thuộc: auth.api.fixture.ts (authToken)
 * - Dùng bởi: gatekeeper.api.fixture.ts (merge)
 */

import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { AuthApiFixtures } from './auth.api.fixture';
import { ProductService } from '../../../api/services/neko/ProductService';
import { EnvManager } from '../../../utils/EnvManager';
import { Logger } from '../../../utils/Logger';

// API Base URL from environment
const API_BASE_URL = EnvManager.get('NEKO_API_URL');

// ─────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────

export type ServicesFixtures = {
  apiRequest: APIRequestContext;
  productService: ProductService;
};

type ServicesDeps = { apiRequest: APIRequestContext } & AuthApiFixtures;

// ─────────────────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────────────────

export const servicesFixtures = {
  /**
   * API REQUEST CONTEXT
   * 
   * Luôn tạo context mới với API baseURL.
   * Hoạt động cho cả:
   * - Combined (neko-chromium): project baseURL là frontend
   * - Standalone (neko-api): project baseURL là API
   */
  apiRequest: async (
    {}: Record<string, never>,
    use: (r: APIRequestContext) => Promise<void>
  ) => {
    const ctx = await playwrightRequest.newContext({
      baseURL: API_BASE_URL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });

    Logger.info(`API Context: ${API_BASE_URL}`, { context: 'fixture' });
    await use(ctx);
    await ctx.dispose();
  },

  /**
   * PRODUCT SERVICE
   */
  productService: async (
    { apiRequest, authToken }: ServicesDeps,
    use: (r: ProductService) => Promise<void>
  ) => {
    await use(new ProductService(apiRequest, authToken));
  },
};
