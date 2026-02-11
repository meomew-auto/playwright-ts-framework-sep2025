# 🔌 Services - Gọi API từ test

## Folder này dùng để làm gì?

Folder `services/` chứa các **API service class** — lớp trung gian giữa test và API. Thay vì gọi API trực tiếp trong test (dài dòng, lặp code), ta gọi qua service để có:

- **Code ngắn gọn** — `productService.getProducts()` thay vì tự viết fetch + headers + parse
- **Tự động validate** — response được kiểm tra bằng Zod schema trước khi trả về
- **Log tự động** — mọi request/response đều được ghi log
- **Type-safe** — return type chính xác, IDE gợi ý đầy đủ

## Cấu trúc thư mục

```text
services/
├── base/
│   └── BaseService.ts        # Lớp cơ sở — KHÔNG dùng trực tiếp
└── neko/
    └── ProductService.ts     # Service cho sản phẩm Neko Coffee
```

## Luồng hoạt động

```text
┌─────────────────────────────────────────────────────────────────┐
│  Test spec                                                      │
│  const product = await productService.createProduct(data);      │
│                                        ↓                        │
│  ProductService.createProduct(data)                             │
│  return this.postAndValidate('/products', data, ProductSchema)  │
│                              ↓                                  │
│  BaseService.postAndValidate(endpoint, data, schema)            │
│  1. Thêm headers: Content-Type + Authorization                  │
│  2. Gọi API: POST /api/products                                │
│  3. Log: 📡 POST /api/products 201 (45ms)                      │
│  4. Lấy JSON body                                               │
│  5. Validate: schema.parse(body) ← Zod kiểm tra                │
│  6. Return typed data (Product) hoặc throw Error                │
└─────────────────────────────────────────────────────────────────┘
```

## BaseService — Lớp cơ sở

`BaseService` là lớp abstract, cung cấp 3 nhóm phương thức:

### Nhóm 1: HTTP cơ bản (trả về APIResponse nguyên gốc)

| Phương thức | Dùng cho |
|-------------|----------|
| `get(endpoint)` | Lấy dữ liệu |
| `post(endpoint, data)` | Tạo mới |
| `put(endpoint, data)` | Cập nhật toàn bộ |
| `patch(endpoint, data)` | Cập nhật một phần |
| `delete(endpoint)` | Xóa |

### Nhóm 2: HTTP + Zod validate (positive test)

| Phương thức | Dùng cho |
|-------------|----------|
| `getAndValidate(endpoint, schema)` | GET + validate response |
| `postAndValidate(endpoint, data, schema)` | POST + validate response |
| `putAndValidate(endpoint, data, schema)` | PUT + validate response |
| `patchAndValidate(endpoint, data, schema)` | PATCH + validate response |

Nếu response không khớp schema → **ZodError** → test fail với thông báo rõ ràng.

### Nhóm 3: Expect Error (negative test)

| Phương thức | Dùng cho |
|-------------|----------|
| `postExpectError(endpoint, data, status, errorSchema)` | POST mong đợi lỗi |
| `putExpectError(endpoint, data, status, errorSchema)` | PUT mong đợi lỗi |

Gửi data sai → kiểm tra API trả status lỗi đúng + error body đúng format.

## Cách sử dụng trong test

### Positive test (mong đợi thành công)

```typescript
test('Tạo sản phẩm mới', async ({ productService }) => {
  const data = ProductSchemas.createBean({ origin: 'Ethiopia' });
  
  // createProduct() tự động validate response bằng ProductSchema
  const product = await productService.createProduct(data);
  
  // product có type Product, IDE gợi ý đầy đủ
  expect(product.id).toBeGreaterThan(0);
  expect(product.name).toBe(data.name);
});
```

### Negative test (mong đợi lỗi)

```typescript
test('Từ chối body rỗng', async ({ productService }) => {
  // createProductExpectError() tự validate error response
  const error = await productService.createProductExpectError({});
  
  const messages = ErrorSchemas.getErrorMessages(error);
  expect(messages.length).toBeGreaterThan(0);
});
```

### Edge case (kiểm tra response thủ công)

```typescript
test('Giá âm có thể trả 201 hoặc 400', async ({ productService }) => {
  // createProductRaw() không validate, trả APIResponse nguyên gốc
  const response = await productService.createProductRaw({ price: -100 });
  expect([201, 400, 422]).toContain(response.status());
});
```

## Mối liên hệ với Schemas

Service **KHÔNG** tự validate — nó **truyền Zod schema vào BaseService** để validate tự động.

### Schemas nào dùng ở đâu?

```text
src/infrastructure/api/
├── schemas/                         ← Định nghĩa "format đúng"
│   ├── common/
│   │   └── CommonErrorSchemas.ts    → Mẫu lỗi dùng chung mọi project
│   └── neko/
│       ├── ProductSchemas.ts        → Schema sản phẩm + Factory
│       └── ErrorSchemas.ts          → Schema lỗi riêng Neko
│
├── services/                        ← Gọi API + truyền schema
│   ├── base/
│   │   └── BaseService.ts           → *AndValidate() nhận schema
│   └── neko/
│       └── ProductService.ts        → Import schemas, truyền vào Base
│
└── models/                          ← Interface = nguồn sự thật
    └── neko/
        └── product.interface.ts     → Type cho cả Schema + Service
```

### Mapping cụ thể trong ProductService

| Method trong Service | Schema được truyền | Kết quả nếu response sai |
|----------------------|--------------------|--------------------------|
| `getProducts()` | `ProductSchemas.PaginatedProducts` | ZodError: thiếu `pagination` |
| `getProduct(id)` | `ProductSchemas.Product` | ZodError: thiếu `id`, `name`... |
| `createProduct(data)` | `ProductSchemas.Product` | ZodError hoặc API Error |
| `updateProduct(id, data)` | `ProductSchemas.Product` | ZodError |
| `patchProduct(id, data)` | `ProductSchemas.Product` | ZodError |
| `createProductExpectError(data)` | `ErrorSchemas.AnyError` | ZodError: lỗi sai format |

### Ví dụ code mapping

```typescript
// ProductService.ts — import schemas
import { ProductSchemas } from '../../schemas/neko/ProductSchemas';  // ← Schema sản phẩm
import { ErrorSchemas, AnyError } from '../../schemas/neko/ErrorSchemas'; // ← Schema lỗi

// Positive test: truyền ProductSchemas.Product vào postAndValidate
async createProduct(data: ProductCreate): Promise<Product> {
  return this.postAndValidate(this.basePath, data, ProductSchemas.Product);
  //                                               ^^^^^^^^^^^^^^^^^^^^
  //                                               Schema này validate response
}

// Negative test: truyền ErrorSchemas.AnyError vào postExpectError
async createProductExpectError(data: unknown): Promise<AnyError> {
  return this.postExpectError(this.basePath, data, [400, 422], ErrorSchemas.AnyError);
  //                                                          ^^^^^^^^^^^^^^^^^^^^
  //                                                          Schema này validate error
}
```

### Tóm tắt quan hệ 3 lớp

```text
Interface (compile-time)  →  Schema (runtime)  →  Service (gọi API)
product.interface.ts         ProductSchemas.ts      ProductService.ts
Định nghĩa type              z.ZodType<Product>     truyền schema vào
                              + factory methods      *AndValidate()
```

## Mối liên hệ với Fixtures

```text
Test spec
  ↓  dùng fixture: productService
Fixture (services.fixture.ts)
  ↓  tạo: new ProductService(request, token)
ProductService (extends BaseService)
  ↓  gọi: this.postAndValidate(url, data, schema)
BaseService
  ↓  validate: schema.parse(json)
Schemas (Zod)
```


## Tạo Service mới

Khi có API resource mới (ví dụ: Orders), tạo service theo pattern:

```typescript
// services/{project}/OrderService.ts
import { BaseService } from '../base/BaseService';
import { OrderSchemas, Order, OrderCreate } from '@schemas/{project}/OrderSchemas';

export class OrderService extends BaseService {
  private readonly basePath = '/api/orders';

  constructor(request: APIRequestContext, authToken?: string) {
    super(request, authToken);
  }

  // GET - lấy danh sách
  async getOrders(): Promise<Order[]> {
    return this.getAndValidate(this.basePath, z.array(OrderSchemas.Order));
  }

  // POST - tạo mới + validate
  async createOrder(data: OrderCreate): Promise<Order> {
    return this.postAndValidate(this.basePath, data, OrderSchemas.Order);
  }

  // POST - negative test
  async createOrderExpectError(data: unknown): Promise<AnyError> {
    return this.postExpectError(this.basePath, data, [400, 422], ErrorSchemas.AnyError);
  }

  // DELETE
  async deleteOrder(id: number): Promise<void> {
    await this.delete(`${this.basePath}/${id}`);
  }
}
```

Sau đó đăng ký vào fixture để inject vào test:

```typescript
// fixtures/{project}/api/services.fixture.ts
myOrderService: async ({ apiRequest, authToken }, use) => {
  await use(new OrderService(apiRequest, authToken));
},
```
