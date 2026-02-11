# 📄 Models — TypeScript Type Definitions

## Cấu trúc

```
models/
├── cms/
│   └── Product.ts              ← ProductInfo interface (CMS eCommerce)
├── crm/
│   └── Customer.ts             ← CustomerInfo interface (future)
├── common/                     ← Shared models (hiện tại trống)
└── neko/
    ├── product.interface.ts    ← Product, ProductCreate, ProductUpdate, ProductPatch
    └── auth.interface.ts       ← LoginPayload, AuthResponse, TokenInfo, UserInfo
```

> **Không có barrel** (`index.ts`) — import trực tiếp bằng alias.

## Data Flow — Models → Schemas → Services

```
                    ┌─────────────────────────────────────┐
                    │           models/neko/               │
                    │  product.interface.ts (TypeScript)   │
                    │  auth.interface.ts    (TypeScript)   │
                    └───────────┬─────────────────────────┘
                                │ import types
                                ▼
                    ┌─────────────────────────────────────┐
                    │        schemas/neko/                  │
                    │  ProductSchemas.ts (Zod validation)   │
                    │  ErrorSchemas.ts   (Zod + z.infer)   │
                    └───────────┬─────────────────────────┘
                                │ import schemas
                                ▼
                    ┌─────────────────────────────────────┐
                    │        services/neko/                 │
                    │  ProductService.ts (API calls)        │
                    │    extends BaseService                │
                    └─────────────────────────────────────┘
```

### Chi tiết từng layer

| Layer | File | Vai trò | Ví dụ |
|-------|------|---------|-------|
| **Models** | `product.interface.ts` | Định nghĩa **shape** của data (TypeScript types) | `Product`, `ProductCreate` |
| **Schemas** | `ProductSchemas.ts` | **Validate** response API bằng Zod runtime | `ProductSchema.parse(response)` |
| **Services** | `ProductService.ts` | Gọi API + validate response bằng schema | `getAll()`, `create()`, `update()` |

### Tại sao cần cả Models LẪN Schemas?

```
Models (compile-time)     Schemas (runtime)
┌────────────────┐       ┌────────────────────┐
│ interface Product {     │ const ProductSchema = z.object({
│   id: number;           │   id: z.number(),
│   name: string;         │   name: z.string(),
│ }                       │ })
└────────────────┘       └────────────────────┘
        │                          │
        ▼                          ▼
  TypeScript check          API response validate
  (build time)              (runtime — catch lỗi API)
```

- **Models** → TypeScript biết type → **autocomplete + compiler check**
- **Schemas** → Zod validate runtime → **bắt lỗi API trả sai format**

> ⚠️ **Error types** là ngoại lệ: `ErrorSchemas.ts` dùng `z.infer` để suy ra types
> từ Zod schemas (không cần interface riêng). Đây là pattern "Zod-first".

## Mối quan hệ giữa các Projects

### Neko Coffee — Full stack (Models + Schemas + Services)

```
models/neko/product.interface.ts
    ↓ import types
schemas/neko/ProductSchemas.ts
    ↓ import schemas
services/neko/ProductService.ts ← extends services/base/BaseService.ts
    ↓ dùng bởi
fixtures/neko/api/            (API test fixtures)
data/ (test data factories)
```

```
models/neko/auth.interface.ts
    ↓ import types
fixtures/neko/NekoAuthProvider.ts  (login flow, JWT tokens)
```

### CMS — Chỉ có Models (chưa có API layer)

```
models/cms/Product.ts (ProductInfo)
    ↓ import by
data/cms/ProductDataFactory.ts    (test data cho UI form)
pages/cms/CMSAddNewProductPage.ts (form automation)
```

> CMS chưa có schemas hay services vì test CMS hiện tại chỉ qua UI,
> không gọi API trực tiếp.

### Error Handling — Shared pattern

```
schemas/common/CommonErrorSchemas.ts    ← Shared error patterns (reusable)
    ↓ dùng bởi
schemas/neko/ErrorSchemas.ts            ← Neko-specific error types
    ↓ import AnyError type
services/neko/ProductService.ts         ← Handle errors trong API calls
```

### CRM — Future (chỉ có model stub)

```
models/crm/Customer.ts (CustomerInfo)  ← Placeholder cho CRM project
```

## Import Patterns

```typescript
// Models — import trực tiếp (không có barrel)
import { Product, ProductCreate } from '@models/neko/product.interface';
import { LoginPayload, AuthResponse } from '@models/neko/auth.interface';
import { ProductInfo } from '@models/cms/Product';
import { CustomerInfo } from '@models/crm/Customer';

// Schemas — validate API responses
import { ProductSchema, PaginatedProductsSchema } from '@schemas/neko/ProductSchemas';
import { AnyError } from '@schemas/neko/ErrorSchemas';

// Services — gọi API
import { ProductService } from '@services/neko/ProductService';
```

## Quy tắc

1. **Models = TypeScript interfaces** — chỉ define shape, không có logic
2. **Schemas = Zod objects** — validate runtime, có thể dùng `z.infer` thay interface
3. **Không dùng barrel** — import trực tiếp bằng alias path
4. **File naming:**
   - Neko: `*.interface.ts` (nhiều types/file, nhóm theo domain)
   - CMS: `{EntityName}.ts` (1 interface/file)
5. **CRUD variants** (Neko): `Product` (read) / `ProductCreate` / `ProductUpdate` / `ProductPatch`
