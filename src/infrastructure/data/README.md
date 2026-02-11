# 📦 Data - Test Data cho Project

## Folder này dùng để làm gì?

Folder `data/` chứa **test data** — dữ liệu dùng trong test, bao gồm:

1. **JSON test data** — Dữ liệu tĩnh, xác định trước (parameterized testing)
2. **Faker factories** — Dữ liệu động, tạo ngẫu nhiên bằng Faker.js

## Cấu trúc thư mục (multi-project)

```text
data/
├── common/
│   └── TestDataRepository.ts       ← Catalog engine (dùng chung mọi project)
├── cms/
│   ├── ProductDataFactory.ts       ← Faker factory cho CMS products
│   └── json/                       ← JSON test data cho CMS
│       ├── login.json              ← Parameterized login test cases
│       ├── products.json           ← Product test data (prod)
│       └── products-dev.json       ← Product test data (dev)
└── neko/                           ← (placeholder cho tương lai)
    └── json/
```

## 2 loại Test Data

### 1. JSON Catalog (dữ liệu tĩnh)

Dùng cho **parameterized testing** — chạy cùng 1 test với nhiều dataset khác nhau.

```typescript
import { getTestData } from '@data/common/TestDataRepository';

// Lấy test data theo namespace + key
const minimal = getTestData('products', 'minimal');
const negatives = getTestData('login', 'negativeTestCases');

// Với overrides
const custom = getTestData('products', 'minimal', {
  overrides: { name: 'Custom Name' }
});
```

**Khi nào dùng:** Dữ liệu cố định, nhiều test cases, parameterized testing.

### 2. Faker Factory (dữ liệu động)

Dùng khi cần dữ liệu **ngẫu nhiên, unique** mỗi lần chạy test.

```typescript
import { createMinimalProductInfo, createFullProductInfo } from '@data/cms/ProductDataFactory';

// Tạo product với tên unique (có timestamp)
const product = createMinimalProductInfo();
// → { name: "Auto PW Incredible Granite Table 14:30:25", ... }

// Tạo product với overrides
const custom = createFullProductInfo({ featured: true, discount: 20 });
```

**Khi nào dùng:** Cần tên unique, tránh conflict data, random testing.

## So sánh 2 cách

| Tiêu chí | JSON Catalog | Faker Factory |
|----------|-------------|---------------|
| Dữ liệu | Cố định, xác định trước | Ngẫu nhiên mỗi lần |
| Tên product | Luôn giống nhau | Unique (có timestamp) |
| Parameterized | ✅ Tốt | ❌ Không phù hợp |
| Tránh conflict | ❌ Có thể trùng | ✅ Unique |
| Debug dễ | ✅ Biết chính xác data | ⚠️ Khó reproduce |

## Path Aliases

```json
"@data/common/*": ["src/infrastructure/data/common/*"],
"@data/cms/*": ["src/infrastructure/data/cms/*"],
"@data/neko/*": ["src/infrastructure/data/neko/*"]
```

## Thêm Test Data mới

### Thêm JSON data mới

1. Tạo file JSON trong `data/{project}/json/`
2. Import và đăng ký vào `TestDataRepository.ts`

### Thêm Faker Factory mới

1. Tạo file `{Entity}DataFactory.ts` trong `data/{project}/`
2. Import interface từ `models/{project}/`
3. Export các factory functions

## Mối liên hệ với các lớp khác

```text
Test spec
  ├── dùng Faker Factory (data động)
  │   └── data/cms/ProductDataFactory.ts
  │       └── models/cms/Product.ts (interface)
  │
  └── dùng JSON Catalog (data tĩnh)
      └── data/common/TestDataRepository.ts
          └── data/cms/json/*.json (JSON files)
```

> **Lưu ý:** `data/` chứa test data cho UI tests.
> Để tạo test data cho **API tests**, dùng **Zod Schema factories** trong `api/schemas/`.
