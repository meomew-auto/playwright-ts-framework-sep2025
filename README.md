# 🎭 Playwright TypeScript Framework

Framework kiểm thử tự động sử dụng **Playwright** và **TypeScript**, được tổ chức theo Clean Architecture. Hỗ trợ nhiều dự án (CMS, Neko Coffee), multi-environment (dev, UAT), và CI/CD với GitHub Actions + Allure Report.

## 📁 Cấu trúc thư mục

```text
src/
├── infrastructure/                 # Infrastructure Layer
│   ├── api/                       # API Testing
│   │   ├── schemas/               # Zod schemas (response validation)
│   │   └── services/              # API service classes
│   │
│   ├── components/                # Reusable UI components
│   │   └── cms/                   # (BootstrapSelect, Sidebar, ...)
│   │
│   ├── data/                      # Test data management
│   │   ├── cms/json/              # CMS test data (login.json, ...)
│   │   └── common/                # TestDataRepository
│   │
│   ├── fixtures/                  # Playwright fixtures
│   │   ├── cms/                   # CMS fixtures (auth, app, gatekeeper)
│   │   ├── neko/                  # Neko fixtures
│   │   │   ├── neko.setup.ts      # Login admin (global setup)
│   │   │   ├── role.fixture.ts    # asRole() — multi-role + lazy login
│   │   │   ├── neko-context.factory.ts  # Shared POM/Service factory
│   │   │   └── unified.fixture.ts # Merge tất cả fixtures
│   │   └── common/                # Shared (ViewportType)
│   │
│   ├── helpers/                   # Helper classes
│   │   └── cms/                   # CollectionHelper, TableResolver
│   │
│   ├── models/                    # TypeScript interfaces/types
│   │   ├── cms/                   # CMS models
│   │   └── neko/                  # Neko models (order, product, chat)
│   │
│   ├── pages/                     # Page Object Models (POM)
│   │   ├── base/BasePage.ts       # Abstract base class
│   │   ├── cms/                   # CMS pages
│   │   └── neko-coffee/           # Neko pages (Products, Orders, Chat)
│   │
│   └── utils/                     # Utilities
│       ├── Logger.ts              # Winston logger (level-based)
│       └── EnvManager.ts          # Typed env variables
│
└── presentation/                   # Presentation Layer (Tests)
    └── tests/
        ├── cms/                   # CMS test specs
        │   ├── auth/ui/           # Login tests
        │   └── products/          # Product CRUD tests
        └── neko/
            ├── products/
            │   ├── api/           # API tests (create, validate)
            │   └── ui/            # UI tests (list, read)
            ├── orders/            # Orders UI+API tests
            └── chat/              # Multi-role chat tests
```

## 🚀 Chạy Tests

### Cài đặt

```bash
npm install
npx playwright install
```

### Scripts (Local)

```bash
# Tất cả tests
npm test

# Theo dự án
npm run test:cms                # CMS Desktop (dev)
npm run test:cms:mobile         # CMS Mobile (dev)
npm run test:cms:uat            # CMS Desktop (UAT)

npm run test:neko:ui            # Neko UI (dev)
npm run test:neko:api           # Neko API (dev)
npm run test:neko:api:uat       # Neko API (UAT)

# Theo tag
npx playwright test --tag @smoke
npx playwright test --tag @regression

# Xem report
npm run report
```

### Chạy trực tiếp

```bash
# Chạy file cụ thể
npx playwright test login.spec.ts --project=cms-desktop --no-deps

# Chạy theo grep
npx playwright test -g "TC_01"

# Chạy headless
npx playwright test --project=neko-api
```

## 🌍 Quản lý Môi trường

### Cách hoạt động

```
NODE_ENV=development → dotenv-flow loads: .env → .env.development (secrets)
NODE_ENV=uat         → dotenv-flow loads: .env → .env.uat → .env.uat.local (secrets)
```

### Files

| File | Git | Chứa gì |
|------|-----|---------|
| `.env` | ✅ Committed | URLs mặc định, config công khai |
| `.env.uat` | ✅ Committed | UAT URLs (override `.env`) |
| `.env.development` | ❌ Gitignored | Dev secrets (passwords) |
| `.env.uat.local` | ❌ Gitignored | UAT secrets (passwords) |

### Flow chi tiết

```
[Local]                              [CI]
cross-env NODE_ENV=uat        →     env: NODE_ENV=uat
        ↓                                  ↓
playwright.config.ts                playwright.config.ts
        ↓                                  ↓
dotenvFlow.config()                 dotenvFlow.config()
        ↓                                  ↓
load .env + .env.uat                load .env + .env.uat
        ↓                                  ↓
.env.uat.local (secrets)            GitHub Secrets → env vars
        ↓                                  ↓
EnvManager (typed access)           EnvManager (typed access)
```

## 🔧 Playwright Projects

| Project | Loại | Setup | Mô tả |
|---------|------|-------|-------|
| `cms-setup` | Setup | — | Login CMS, lưu auth state |
| `neko-setup` | Setup | — | Login Neko, lưu token |
| `neko-api` | API | `neko-setup` | API tests (không cần browser) |
| `neko-ui` | UI | `neko-setup` | Neko Coffee UI tests |
| `cms-desktop` | UI | `cms-setup` | CMS Desktop viewport |
| `cms-mobile` | UI | `cms-setup` | CMS Mobile viewport (iPad) |

## 🏗️ Architecture Patterns

### Fixture Chaining

```
auth.fixture → app.fixture → gatekeeper → test
  (page)        (POMs)       (merge)     (sử dụng)
```

```typescript
// ✅ Đúng — dùng fixtures
import { test, expect } from '@fixtures/cms/ui/gatekeeper.fixture';
test('TC_01', async ({ allProductsPage }) => { ... });

// ❌ Sai — tạo POM thủ công
const page = new CMSAllProductsPage(page);
```

### API Testing (Zod Validation)

```typescript
// Schema validation tự động
const response = await productService.createProduct(data);
const parsed = ProductSchema.parse(response);  // Zod validates
```

### Test Data Repository

```typescript
import { getTestData } from '@data/common/TestDataRepository';

const credentials = getTestData('login', 'validCredentials');
// → { email: 'admin@example.com', password: '123456' }
```

### Tagging

```typescript
test.describe('Feature', { tag: '@smoke' }, () => {
  test('TC_01: ...', async ({ page }) => { ... });
});
```

### Multi-Role Testing (asRole)

Cho phép test sử dụng **nhiều accounts** trong cùng 1 test case. Mỗi role có browser context riêng (isolated session).

#### Kiến trúc

```
neko.setup.ts ─────────── Chỉ login ADMIN (mặc định mọi test)
       │
       ▼
unified.fixture ─── chatPage, ordersPage, chatService (admin fixtures)
       │
       ▼
role.fixture.ts ─── asRole('manager') ─── Lazy Login
       │                                     │
       │                                     ├─ Check .auth/neko-manager.json
       │                                     ├─ Chưa có? → Tự login → Save file
       │                                     └─ Đã có? → Dùng luôn (skip)
       │
       ▼
neko-context.factory.ts ─── SINGLE SOURCE OF TRUTH
       │
       ├─ createNekoPOMs()     → ProductsPage, OrdersPage, ChatPage
       └─ createNekoServices() → OrderService, ProductService, ChatService
```

#### Cách sử dụng

```typescript
import { test, expect } from '@fixtures/neko/unified.fixture';

// ✅ Test chỉ cần admin — dùng fixture mặc định
test('Admin xem orders', async ({ ordersPage, orderService }) => {
  await ordersPage.goto();
  const orders = await orderService.getOrders();
});

// ✅ Test cần multi-role — admin fixture + asRole()
test('Admin và Manager chat', async ({ chatPage, chatService, asRole }) => {
  // chatPage + chatService = admin (từ fixture, KHÔNG lazy login)
  const manager = await asRole('manager'); // lazy login nếu cần

  await chatPage.goto();            // admin
  await manager.chatPage.goto();    // manager (isolated context)

  // API check — mỗi service tự mang token đúng role
  const adminView = await chatService.getOnlineUsers();
  const managerView = await manager.chatService.getOnlineUsers();
});
```

#### Lazy Login Flow

```
Lần 1 (chưa có .auth/neko-manager.json):
  asRole('manager') → isStorageStateValid? → NO
    → loginAndSave() → POST /auth/login → save .auth/neko-manager.json
    → Tạo context + POMs + Services

Lần 2+ (file đã tồn tại, token chưa hết hạn):
  asRole('manager') → isStorageStateValid? → YES
    → Skip login → Tạo context + POMs + Services (nhanh hơn!)
```

#### Thêm role mới

Chỉ cần **2 bước**:

1. **`.env.development`** — thêm credentials:
   ```
   NEKO_EDITOR_USERNAME=editor1
   NEKO_EDITOR_PASSWORD=pass123
   ```

2. **`role.fixture.ts`** — thêm vào type:
   ```typescript
   export type NekoRole = 'admin' | 'staff' | 'manager' | 'editor';
   ```

Không cần sửa factory, setup, hay unified fixture!

#### Thêm POM/Service mới

Chỉ sửa **1 file**: `neko-context.factory.ts`

```typescript
// Thêm import
import { NewPage } from '@pages/neko/NewPage';

// Thêm vào type + function
export type NekoPOMs = { ..., newPage: NewPage };
export function createNekoPOMs(page, viewport) {
  return { ..., newPage: new NewPage(page, viewport) };
}
```

Tự động có sẵn trong cả `app.fixture` (admin) và `asRole()` (mọi role).

## 🤖 CI/CD (GitHub Actions)

### Triggers

| Trigger | Suite | Environment | Tag |
|---------|-------|-------------|-----|
| **Push/PR** | `neko-api` (mặc định) | `development` | tất cả |
| **Manual** | dropdown chọn | dropdown chọn | dropdown chọn |

### Manual Dispatch Options

- **Suite**: `neko-api`, `neko-ui`, `cms-desktop`, `cms-mobile`
- **Environment**: `development`, `uat`
- **Tag**: `@smoke`, `@regression`, hoặc trống (tất cả)

### GitHub Secrets cần set

```text
NEKO_ADMIN_USERNAME
NEKO_ADMIN_PASSWORD
NEKO_STAFF_USERNAME
NEKO_STAFF_PASSWORD
NEKO_MANAGER_USERNAME
NEKO_MANAGER_PASSWORD
CMS_ADMIN_EMAIL
CMS_ADMIN_PASSWORD
```

### Reports

- **Allure Report** — deploy lên GitHub Pages (với history trends)
- **Playwright HTML Report** — upload artifact

### Log Level

| Môi trường | LOG_LEVEL | Hiển thị |
|-----------|-----------|----------|
| Local | `DEBUG` (từ `.env`) | Tất cả logs |
| CI | `warn` (từ workflow) | Chỉ warn + error |

## 📦 Path Aliases

```typescript
import { CMSLoginPage } from '@pages/cms/CMSLoginPage';
import { getTestData } from '@data/common/TestDataRepository';
import { test, expect } from '@fixtures/cms/ui/gatekeeper.fixture';
import { Logger } from '@utils/Logger';
```

## 📝 Naming Conventions

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Desktop tests | `*.spec.ts` | `login.spec.ts` |
| Mobile tests | `*.mobile.spec.ts` | `products.mobile.spec.ts` |
| Page Objects | `CMS{Name}Page.ts` | `CMSLoginPage.ts` |
| API Services | `{Name}Service.ts` | `ProductService.ts` |
| Zod Schemas | `{name}.schema.ts` | `product.schema.ts` |
| Test data | `{name}.json` | `login.json` |
