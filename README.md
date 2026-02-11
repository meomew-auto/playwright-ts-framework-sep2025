# 🎭 Playwright TypeScript Framework

Framework kiểm thử tự động sử dụng **Playwright** và **TypeScript**, được tổ chức theo Clean Architecture. Hỗ trợ nhiều dự án (CMS, Neko Coffee), multi-environment (dev, UAT), và CI/CD với GitHub Actions + Allure Report.

## 📁 Cấu trúc thư mục

```
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
│   │   ├── neko/                  # Neko fixtures (auth, app, gatekeeper)
│   │   ├── common/                # Shared (ViewportType)
│   │   └── unified.fixture.ts     # Merge tất cả fixtures
│   │
│   ├── helpers/                   # Helper classes
│   │   └── cms/                   # CollectionHelper, TableResolver
│   │
│   ├── models/                    # TypeScript interfaces/types
│   │   ├── cms/                   # CMS models
│   │   └── neko/                  # Neko models
│   │
│   ├── pages/                     # Page Object Models (POM)
│   │   ├── base/BasePage.ts       # Abstract base class
│   │   ├── cms/                   # CMS pages
│   │   └── neko-coffee/           # Neko Coffee pages
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
            └── products/
                ├── api/           # API tests (create, validate)
                └── ui/            # UI tests (list, read)
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

```
NEKO_ADMIN_USERNAME
NEKO_ADMIN_PASSWORD
NEKO_STAFF_USERNAME
NEKO_STAFF_PASSWORD
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
