# 📄 Tests — Playwright Test Specs

## Cấu trúc thư mục

```text
tests/
├── cms/                              ← CMS eCommerce tests
│   ├── auth/ui/
│   │   └── login.spec.ts             ← Login form tests
│   └── products/
│       ├── api/                      ← (future — CMS API tests)
│       └── ui/
│           ├── list.read.spec.ts     ← Read-only: table data, search, filter
│           ├── list.mobile.spec.ts   ← Mobile viewport tests
│           ├── create.write.spec.ts  ← Create product form
│           └── manage.write.spec.ts  ← Edit, delete, bulk operations
├── neko/                             ← Neko Coffee tests
│   └── products/
│       ├── api/
│       │   └── create.spec.ts        ← API: POST /api/products
│       └── ui/
│           └── list.read.spec.ts     ← UI: product grid, pagination
└── neko-coffee/                      ← (deprecated — dùng neko/)
```

## Quy tắc đặt tên file

```text
{feature}.{action}.spec.ts           ← Desktop tests
{feature}.mobile.spec.ts             ← Mobile tests
```

| Pattern | Giải thích | Ví dụ |
| --- | --- | --- |
| `list.read.spec.ts` | Đọc danh sách (read-only, parallel OK) | Table data, search, filter |
| `list.mobile.spec.ts` | Đọc danh sách trên mobile | Mobile-specific layout |
| `create.write.spec.ts` | Tạo mới (mutating) | Form fill, submit |
| `manage.write.spec.ts` | Sửa/xóa (mutating, serial) | Edit, delete, bulk |
| `login.spec.ts` | Auth flow | Login form |

### Quy tắc quan trọng

- **`.read.`** → Chỉ đọc data → chạy **parallel** OK
- **`.write.`** → Thay đổi data → nên chạy **serial** (`test.describe.configure({ mode: 'serial' })`)
- **`.mobile.`** → Chạy với project `cms-mobile` hoặc `mobile-chrome`

## Import — Luôn dùng Alias

```typescript
// ✅ Fixtures — dùng gatekeeper fixture (auto-login + page objects)
import { test, expect } from '@fixtures/cms/ui/gatekeeper.fixture';
import { test, expect } from '@fixtures/neko/unified.fixture';
import { test, expect } from '@fixtures/neko/api/gatekeeper.api.fixture';

// ✅ Pages — khi cần manual page (không dùng fixture)
import { CMSLoginPage } from '@pages/cms/CMSLoginPage';
import { CMSDashboardPage } from '@pages/cms/CMSDashboardPage';
import { ProductsPage } from '@pages/neko/ProductsPage';

// ✅ Data
import { getTestData } from '@data/common/TestDataRepository';
import { createMinimalProductInfo } from '@data/cms/ProductDataFactory';

// ✅ Models, Schemas, Utils
import { Product } from '@models/neko/product.interface';
import { ProductSchemas } from '@schemas/neko/ProductSchemas';
import { Logger } from '@utils/Logger';

// ❌ KHÔNG dùng relative imports
import { test } from '../../../infrastructure/fixtures';           // ❌
import { CMSLoginPage } from '../../../../../infrastructure/...';  // ❌
```

### Alias cheat sheet

| Alias | Trỏ tới | Ví dụ |
| --- | --- | --- |
| `@fixtures/cms/*` | `infrastructure/fixtures/cms/*` | `@fixtures/cms/ui/gatekeeper.fixture` |
| `@fixtures/neko/*` | `infrastructure/fixtures/neko/*` | `@fixtures/neko/unified.fixture` |
| `@pages/cms/*` | `infrastructure/pages/cms/*` | `@pages/cms/CMSLoginPage` |
| `@pages/neko/*` | `infrastructure/pages/neko-coffee/*` | `@pages/neko/ProductsPage` |
| `@data/cms/*` | `infrastructure/data/cms/*` | `@data/cms/ProductDataFactory` |
| `@data/common/*` | `infrastructure/data/common/*` | `@data/common/TestDataRepository` |
| `@models/neko/*` | `infrastructure/models/neko/*` | `@models/neko/product.interface` |
| `@schemas/neko/*` | `infrastructure/api/schemas/neko/*` | `@schemas/neko/ProductSchemas` |
| `@utils/*` | `infrastructure/utils/*` | `@utils/Logger` |
| `@collection/*` | `infrastructure/helpers/common/collection/*` | `@collection/TableResolver` |

## Cách thêm test mới

### Bước 1: Chọn đúng fixture

| Loại test | Fixture import |
| --- | --- |
| CMS UI (có login + page objects) | `@fixtures/cms/ui/gatekeeper.fixture` |
| CMS UI Mobile | `@fixtures/cms/ui/gatekeeper.fixture` + project `cms-mobile` |
| Neko UI (có page objects) | `@fixtures/neko/unified.fixture` |
| Neko API (có auth token) | `@fixtures/neko/api/gatekeeper.api.fixture` |
| Không cần fixture | `@playwright/test` |

### Bước 2: Tạo file đúng vị trí

```text
tests/{project}/{feature}/{api|ui}/{tên}.spec.ts
```

Ví dụ thêm test cho CMS Orders:

```text
tests/cms/orders/ui/list.read.spec.ts
tests/cms/orders/ui/manage.write.spec.ts
tests/cms/orders/api/filter.spec.ts
```

### Bước 3: Viết test

```typescript
// tests/cms/orders/ui/list.read.spec.ts
import { test, expect } from '@fixtures/cms/ui/gatekeeper.fixture';

test.describe('CMS Orders - Read Only Tests', () => {
  // test sử dụng fixture → có sẵn allProductsPage, dashboardPage, etc.
  test('01. Hiển thị danh sách orders', async ({ allProductsPage }) => {
    // ...
  });
});
```

### Bước 4: Chạy test

```bash
# Desktop
npx playwright test list.read.spec.ts --project=chromium

# Mobile
npx playwright test list.mobile.spec.ts --project=cms-mobile

# API
npx playwright test create.spec.ts --project=neko-api

# Theo tag
npx playwright test --grep @read
npx playwright test --grep @crud
```

## Test Tags

Dùng tags trong `test.describe` title:

```typescript
test.describe('Products API - POST Create @create @crud', () => {
  // ...
});

test.describe('Products List @read @smoke', () => {
  // ...
});
```

| Tag | Ý nghĩa |
| --- | --- |
| `@read` | Read-only tests |
| `@write` | Mutating tests |
| `@crud` | Full CRUD operations |
| `@create` | Create operations |
| `@smoke` | Smoke tests (quick validation) |

## Naming convention cho test cases

```typescript
// Đánh số + mô tả tiếng Việt
test('01. Hiển thị danh sách sản phẩm', async ({ allProductsPage }) => {});
test('08. Thực hiện hành động trên dòng - clickRowAction()', async ({ allProductsPage }) => {});
test('19. Demo quy trình tìm kiếm xuyên trang hoàn chỉnh', async ({ allProductsPage }) => {});
```

- Đánh số `01.`, `02.` để dễ theo dõi thứ tự
- Mô tả bằng tiếng Việt
- Có thể thêm tên method (`- clickRowAction()`) để dễ tìm
