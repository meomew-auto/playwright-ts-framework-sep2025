/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ROLE FIXTURE — Multi-role testing với lazy login
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🎯 MỤC ĐÍCH:
 * Cho phép test chuyển đổi giữa các user roles (admin, staff, customer)
 * trong cùng 1 test case mà không cần restart browser.
 *
 * ⚡ LAZY LOGIN:
 * - storageState file tồn tại và valid → dùng luôn (nhanh)
 * - Chưa có hoặc expired → tự động login và tạo file (chậm)
 *
 * 📚 CÁCH DÙNG:
 * ```typescript
 * test('admin tạo, staff kiểm tra', async ({ asRole }) => {
 *   const admin = await asRole('admin');
 *   await admin.page.goto('/products');
 *
 *   const staff = await asRole('staff'); // Browser context mới, isolated
 *   await staff.page.goto('/products');
 * });
 * ```
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: unified.fixture.ts (merge vào project-level fixtures)
 * - Phụ thuộc: ViewportType (viewport config)
 *
 * ⚠️ STATUS: Skeleton — cần implement lazy login logic
 */

import { test as base, BrowserContext, Page } from '@playwright/test';
import { ViewportType } from './ViewportType';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Các roles có sẵn — thêm role mới vào đây */
export type RoleName = 'admin' | 'staff' | 'customer';

/**
 * Config cho mỗi role: credentials + đường dẫn storage state.
 * Env vars nên đọc từ .env theo pattern: CMS_ADMIN_EMAIL, CMS_STAFF_EMAIL, ...
 */
export interface RoleCredentials {
  email: string;
  password: string;
  storageStatePath: string;
}

/**
 * Kết quả trả về cho test khi gọi asRole().
 * Đã có page sẵn sàng dùng (đã load storageState).
 * Mở rộng: thêm POMs vào đây khi cần.
 */
export interface RoleContext {
  page: Page;
  viewportType: ViewportType;
  // TODO: Thêm POMs khi cần
  // productPage: CMSAllProductsPage;
}

/** Signature của hàm asRole — nhận role name, trả về RoleContext */
export type AsRoleFunction = (role: RoleName) => Promise<RoleContext>;

/** Type export cho merging vào unified.fixture.ts */
export interface RoleFixtures {
  asRole: AsRoleFunction;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE CONFIGS — Credentials và storage state paths cho mỗi role
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Credentials map cho các roles.
 * TODO: Di chuyển ra .env file (process.env.CMS_ADMIN_EMAIL, ...)
 */
const ROLE_CONFIGS: Record<RoleName, RoleCredentials> = {
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
    storageStatePath: '.auth/cms-admin.json',
  },
  staff: {
    email: 'staff@example.com', 
    password: 'staff123',
    storageStatePath: '.auth/cms-staff.json',
  },
  customer: {
    email: 'customer@example.com',
    password: 'customer123',
    storageStatePath: '.auth/cms-customer.json',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Kiểm tra storage state file tồn tại và còn valid.
 * TODO: Thêm logic check expiry (vd: file > 24h → invalid)
 */
function isStorageStateValid(path: string): boolean {
  try {
    const fs = require('fs');
    return fs.existsSync(path);
  } catch {
    return false;
  }
}

/**
 * Login and save storage state for a role
 * TODO: Implement actual login logic
 */
async function loginAndSaveStorageState(
  browser: BrowserContext,
  role: RoleName
): Promise<void> {
  const config = ROLE_CONFIGS[role];
  console.log(`🔐 [Role] Logging in as ${role}: ${config.email}`);
  
  // TODO: Implement login flow
  // const page = await browser.newPage();
  // await page.goto('/login');
  // await page.fill('#email', config.email);
  // await page.fill('#password', config.password);
  // await page.click('button[type="submit"]');
  // await browser.storageState({ path: config.storageStatePath });
  // await page.close();
}

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURE DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

export const roleFixtures = {
  /**
   * asRole fixture — tạo browser context mới cho 1 role.
   *
   * 📌 Mỗi lần gọi asRole() sẽ:
   * 1. Tìm config cho role trong ROLE_CONFIGS
   * 2. Check storage state file có valid không
   * 3. Tạo browser context MỚI (isolated cookies/localStorage)
   * 4. Trả về { page, viewportType }
   *
   * 🧹 Cleanup: Tất cả contexts được track và close khi test kết thúc
   */
  asRole: async (
    { browser, viewportType }: { browser: import('@playwright/test').Browser; viewportType: ViewportType },
    use: (fn: AsRoleFunction) => Promise<void>
  ) => {
    // Track tất cả contexts đã tạo để cleanup khi test xong
    const contexts: BrowserContext[] = [];

    const createRoleContext: AsRoleFunction = async (role) => {
      const config = ROLE_CONFIGS[role];
      
      // Lazy login: Nếu file chưa có hoặc token hết hạn → cần login trước
      if (!isStorageStateValid(config.storageStatePath)) {
        console.log(`⚠️ [Role] Storage state not found for ${role}, need to login first`);
        // TODO: Gọi AuthProvider.loginAndSave() tương ứng
      }
      
      console.log(`📂 [Role] Loading storageState: ${config.storageStatePath}`);
      
      // Tạo browser context MỚI — mỗi role có cookies/localStorage riêng
      // Điều này đảm bảo admin và staff không share session
      const context = await browser.newContext({
        storageState: config.storageStatePath,
      });
      
      contexts.push(context);
      const page = await context.newPage();
      
      return {
        page,
        viewportType,
      };
    };

    // Truyền hàm asRole cho test sử dụng
    await use(createRoleContext);

    // 🧹 Cleanup: Close tất cả contexts khi test kết thúc
    console.log(`🧹 [Role] Cleaning up ${contexts.length} contexts`);
    for (const context of contexts) {
      await context.close();
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST EXPORT (for standalone use)
// ═══════════════════════════════════════════════════════════════════════════

export const test = base.extend<RoleFixtures>(roleFixtures as any);
export { expect } from '@playwright/test';
