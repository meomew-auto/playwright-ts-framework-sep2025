/**
 * ============================================================================
 * NEKO SERVICES FIXTURE — API context + service instances cho API testing
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Tạo Playwright APIRequestContext với baseURL và auth token,
 * rồi inject vào các service classes (ProductService, etc.)
 *
 * 📌 DRY PATTERN:
 * Dùng createNekoServices() từ neko-context.factory.ts (shared factory).
 * Thêm service mới → chỉ cần sửa factory, không cần sửa file này.
 *
 * 📚 PATTERN:
 * authToken (từ auth.api.fixture) → createNekoServices(token) → services
 *
 * 🔗 LIÊN KẾT:
 * - Phụ thuộc: auth.api.fixture.ts (authToken)
 * - Dùng: neko-context.factory.ts (createNekoServices)
 * - Dùng bởi: gatekeeper.api.fixture.ts (merge)
 */

import { APIRequestContext } from '@playwright/test';
import { AuthApiFixtures } from './auth.api.fixture';
import { Logger } from '../../../utils/Logger';
import {
  createNekoServices,
  type NekoServices,
} from '../neko-context.factory';

// ─────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────

export type ServicesFixtures = NekoServices;

type ServicesDeps = AuthApiFixtures;

// ─────────────────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────────────────

export const servicesFixtures = {
  /**
   * API REQUEST CONTEXT
   *
   * Tạo context riêng với API baseURL.
   * Dùng bởi services (inject qua factory).
   */
  apiRequest: async (
    { authToken }: ServicesDeps,
    use: (r: APIRequestContext) => Promise<void>
  ) => {
    const services = await createNekoServices(authToken);
    Logger.info('API Context ready (via factory)', { context: 'fixture' });
    await use(services.apiRequest);
    await services.apiRequest.dispose();
  },

  /**
   * PRODUCT SERVICE
   */
  productService: async (
    { authToken }: ServicesDeps,
    use: (r: NekoServices['productService']) => Promise<void>
  ) => {
    const services = await createNekoServices(authToken);
    await use(services.productService);
    await services.apiRequest.dispose();
  },

  /**
   * ORDER SERVICE
   */
  orderService: async (
    { authToken }: ServicesDeps,
    use: (r: NekoServices['orderService']) => Promise<void>
  ) => {
    const services = await createNekoServices(authToken);
    await use(services.orderService);
    await services.apiRequest.dispose();
  },

  /**
   * chatService: API service cho Chat features
   *
   * Dùng cho: check online users, chat-related API calls
   */
  chatService: async (
    { authToken }: ServicesDeps,
    use: (r: NekoServices['chatService']) => Promise<void>
  ) => {
    const services = await createNekoServices(authToken);
    await use(services.chatService);
    await services.apiRequest.dispose();
  },
};

