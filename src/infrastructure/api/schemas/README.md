# 📋 Schemas - Xác thực dữ liệu API bằng Zod

## Folder này dùng để làm gì?

Folder `schemas/` chứa các **Zod schema** — công cụ xác thực cấu trúc dữ liệu từ API responses lúc runtime. Khi API trả về JSON, ta dùng schema để **kiểm tra xem dữ liệu có đúng format mong đợi không**.

## Tại sao cần Schemas?

| Vấn đề | Giải pháp với Schema |
|--------|---------------------|
| API trả về thiếu trường | Schema `.parse()` sẽ **throw lỗi ngay** — test fail rõ ràng |
| Trường sai kiểu (string thay vì number) | Zod phát hiện và báo lỗi cụ thể |
| API thay đổi response format | Test bắt được regression ngay lập tức |
| Không biết API trả về gì | Schema là **tài liệu sống** cho format API |

## Cấu trúc thư mục

```
schemas/
├── common/                          # Dùng chung cho mọi project
│   └── CommonErrorSchemas.ts        # Các mẫu lỗi phổ biến (FastAPI, RFC 7807, ...)
└── neko/                            # Riêng cho project Neko Coffee
    ├── ErrorSchemas.ts              # Lỗi validation, lỗi API của Neko
    └── ProductSchemas.ts            # Schema sản phẩm + Factory tạo dữ liệu test
```

## Cách sử dụng

### 1. Xác thực response API (Validation)

```typescript
import { ProductSchemas } from '@schemas/neko/ProductSchemas';

// ✅ parse() kiểm tra format → throw nếu sai
const product = ProductSchemas.Product.parse(await response.json());
expect(product.name).toBe('Cà phê Đà Lạt');

// ✅ safeParse() không throw, trả về { success, data, error }
const result = ProductSchemas.Product.safeParse(await response.json());
if (result.success) {
  console.log(result.data.name);
} else {
  console.log(result.error.issues); // Chi tiết lỗi
}
```

### 2. Tạo dữ liệu test (Factory Pattern)

```typescript
import { ProductSchemas } from '@schemas/neko/ProductSchemas';

// Tạo hạt cà phê với giá trị mặc định
const bean = ProductSchemas.createBean();
// → { name: 'Test Product 17...', type: 'bean', price_per_unit: 100000, unit_type: 'kg' }

// Ghi đè một số trường
const customBean = ProductSchemas.createBean({
  origin: 'Ethiopia',
  price_per_unit: 250000,
});
```

### 3. Xử lý lỗi API

```typescript
import { ErrorSchemas } from '@schemas/neko/ErrorSchemas';

const errorBody = await response.json();

// Kiểm tra loại lỗi
if (ErrorSchemas.isValidationError(errorBody)) {
  // Lỗi validation: thiếu/sai trường
  const messages = ErrorSchemas.getErrorMessages(errorBody);
  console.log(messages); // ['body.name: field required']
}
```

## Mối quan hệ: Interface vs Schema

```
Interface (*.interface.ts)     Schema (*.Schemas.ts)
─────────────────────────     ─────────────────────
Định nghĩa TYPE (compile)  →  Xác thực DATA (runtime)
Source of truth cho cấu trúc   z.ZodType<Interface>
Không chạy lúc runtime         .parse() kiểm tra thật sự
```

**Interface** = "shape" của dữ liệu (TypeScript kiểm tra lúc compile)
**Schema** = "validator" kiểm tra dữ liệu thật lúc runtime

## Mối liên hệ: Schema ↔ BaseService

Schemas không dùng đơn lẻ — chúng được **BaseService** gọi tự động:

```
┌──────────────────────────────────────────────────────────────────┐
│  Test spec                                                       │
│  const products = await productService.getProducts();            │
│                                          ↓                       │
│  ProductService (extends BaseService)                            │
│  return this.getAndValidate('/products', ProductSchemas.Product) │
│                                          ↓                       │
│  BaseService.getAndValidate(endpoint, schema)                    │
│  1. Gọi API: GET /products                                      │
│  2. Lấy JSON: const body = await response.json()                │
│  3. Validate: schema.parse(body)  ← Zod kiểm tra ở đây         │
│  4. Return typed data (hoặc throw ZodError nếu sai format)      │
└──────────────────────────────────────────────────────────────────┘
```

**BaseService** cung cấp các method validate sẵn:

| Method | Dùng cho |
|--------|----------|
| `getAndValidate(url, schema)` | GET + validate response thành công |
| `postAndValidate(url, data, schema)` | POST + validate response thành công |
| `postExpectError(url, data, status, errorSchema)` | POST + validate response lỗi (negative test) |
| `putAndValidate(url, data, schema)` | PUT + validate response thành công |

**Ví dụ thực tế trong ProductService:**

```typescript
// Positive test: tạo sản phẩm → validate response đúng format Product
async createProduct(data: ProductCreate): Promise<Product> {
  return this.postAndValidate('/products', data, ProductSchemas.Product);
}

// Negative test: gửi data sai → validate response đúng format lỗi
async createProduct_invalid(data: unknown): Promise<ValidationError> {
  return this.postExpectError('/products', data, 422, ErrorSchemas.ValidationError);
}
```

## Khi nào tạo Schema mới?

1. **Test API mới** → Tạo schema cho response format
2. **Test negative case** → Dùng ErrorSchemas
3. **Cần factory** → Thêm `.default()` vào schema + tạo helper methods
4. **Project mới** → Tạo folder `schemas/<project>/` riêng

