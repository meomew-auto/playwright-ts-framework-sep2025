# CollectionHelper - Unified API cho Tables & Grids

Một helper linh hoạt để tương tác với collections (tables, grids, cards) trong tests.

---

## 🎯 Design Pattern: Strategy Pattern

### Vấn đề

Chúng ta cần làm việc với 2 loại collection khác nhau:

```html
<!-- GRID: Product cards - dùng CSS selectors -->
<div class="product-card">
  <h3>Arabica</h3>              <!-- field 'name' → selector 'h3' -->
  <p class="price">100.000₫</p>  <!-- field 'price' → selector '.price' -->
</div>

<!-- TABLE: Data table - dùng column index -->
<table>
  <tr><th>Name</th><th>Price</th></tr>
  <tr>
    <td>Arabica</td>     <!-- field 'name' → td:nth-child(1) -->
    <td>100.000₫</td>    <!-- field 'price' → td:nth-child(2) -->
  </tr>
</table>
```

**Cùng câu hỏi "lấy giá trị của field 'name'"** nhưng cách tìm hoàn toàn khác!

### Giải pháp: Strategy Pattern

**Ý tưởng:** Tách thuật toán (cách tìm field) ra khỏi logic chính (lấy text, tìm item).

```
┌─────────────────────────────────────────────────────────────┐
│                    CollectionHelper                         │
│   - getFieldValue()                                         │
│   - findItem()                                              │
│   - getCollectionData()                                     │
│                                                             │
│   ⚠️ KHÔNG biết cách tìm field!                             │
│   → Dùng resolver.resolve(item, 'name') để hỏi             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ ❓ "Tìm field 'name' ở đâu?"
                          ▼
              ┌───────────────────────┐
              │   FieldResolver       │  ← Interface (contract)
              │   resolve(item,field) │
              └───────────┬───────────┘
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
┌─────────────────┐              ┌─────────────────┐
│  GridResolver   │              │  TableResolver  │
│                 │              │                 │
│ "name" → 'h3'   │              │ "name" → 1st col│
│ "price" → '.p'  │              │ "price" → 2nd   │
└─────────────────┘              └─────────────────┘
```

### Code thực tế

**1. FieldResolver interface - Contract chung:**

```typescript
interface FieldResolver {
  resolve(item: Locator, field: string): Locator;
}
```

**2. GridResolver - Strategy cho cards/grids:**

```typescript
class GridResolver implements FieldResolver {
  constructor(private fieldMap: Record<string, string>) {}
  
  resolve(item: Locator, field: string): Locator {
    const selector = this.fieldMap[field];  // 'name' → 'h3'
    return item.locator(selector);          // card.locator('h3')
  }
}
```

**3. TableResolver - Strategy cho tables:**

```typescript
class TableResolver implements FieldResolver {
  private columnMap: Record<string, number>;  // 'name' → 0, 'price' → 1
  
  resolve(row: Locator, field: string): Locator {
    const index = this.columnMap[field];     // 'name' → 0
    return row.locator(`td:nth-child(${index + 1})`);  // row.locator('td:nth-child(1)')
  }
}
```

**4. CollectionHelper - Sử dụng bất kỳ resolver nào:**

```typescript
class CollectionHelper {
  constructor(private resolver: FieldResolver) {}  // Nhận resolver bất kỳ
  
  async getFieldValue(item: Locator, field: string) {
    const locator = this.resolver.resolve(item, field);  // Gọi strategy
    return locator.textContent();
  }
  
  async findItem(items: Locator, field: string, value: string) {
    for (let i = 0; i < await items.count(); i++) {
      const item = items.nth(i);
      const text = await this.getFieldValue(item, field);  // Dùng strategy
      if (text === value) return item;
    }
  }
}
```

### Kết quả: Cùng API, khác strategy

```typescript
// Với GRID
const gridResolver = new GridResolver({ name: 'h3', price: '.price' });
const gridHelper = new CollectionHelper(gridResolver);
await gridHelper.findItem(cards, 'name', 'Arabica');  // Dùng CSS selector

// Với TABLE
const tableResolver = await TableResolver.create(headers);
const tableHelper = new CollectionHelper(tableResolver);
await tableHelper.findItem(rows, 'name', 'Arabica');  // Dùng column index

// ↑ CÙNG API: findItem(items, 'name', 'Arabica')
// ↓ KHÁC STRATEGY: cách tìm field bên trong khác nhau
```

### Tóm tắt Strategy Pattern

| Thành phần | Vai trò | Trong code |
|------------|---------|------------|
| **Context** | Sử dụng strategy | `CollectionHelper` |
| **Strategy Interface** | Contract chung | `FieldResolver` |
| **Concrete Strategies** | Các cách implement khác nhau | `GridResolver`, `TableResolver` |

**Lợi ích:**
- ✅ Thêm collection type mới dễ dàng (chỉ cần tạo resolver mới)
- ✅ CollectionHelper không cần sửa khi thêm resolver
- ✅ Test dễ (có thể mock resolver)

---

## Import với @collection alias

```typescript
// Ngắn gọn với alias
import { GridResolver } from '@collection/GridResolver';
import { CollectionHelper } from '@collection/CollectionHelper';
import { TableResolver } from '@collection/TableResolver';
```

---

## 1. GridResolver - Cho Grids/Cards

Dùng khi mỗi item có **cấu trúc HTML cố định** với các CSS selectors.

### Setup

```typescript
import { GridResolver } from '@collection/GridResolver';
import { CollectionHelper } from '@collection/CollectionHelper';

const FIELD_MAP = {
  name: 'h3',
  price: 'p.text-primary.text-xl',
  category: 'p.text-category'
};

const resolver = new GridResolver(FIELD_MAP);
const helper = new CollectionHelper(resolver);
```

### Usage

```typescript
const items = page.locator('[data-testid^="product-card-"]');

// Lấy tất cả tên
const names = await helper.getFieldValues(items, 'name');

// Tìm item theo field
const item = await helper.findItem(items, 'name', 'Arabica');
await item.click();
```

---

## 2. TableResolver - Cho HTML Tables

Dùng cho `<table>` với headers - tự động map column index từ header text.

### Setup

```typescript
import { TableResolver } from '@collection/TableResolver';
import { CollectionHelper } from '@collection/CollectionHelper';

// Factory method tự động init
const resolver = await TableResolver.create(page.locator('thead th'));
const helper = new CollectionHelper(resolver);
```

### Usage

```typescript
const rows = page.locator('tbody tr');

// Lấy tất cả names
const names = await helper.getFieldValues(rows, 'Name');

// Tìm row theo column
const row = await helper.findItem(rows, 'Status', 'Active');
```

---

## 3. Pagination Support

```typescript
const { item, pageNumber } = await helper.findItemWithNextPage(
  () => page.locator('.product-card'),
  'name',
  'Indonesia Java Estate',
  {
    getTotalPages: async () => 6,
    goToNextPage: async () => nextButton.click(),
  }
);
```

---

## TextMatcher Types

```typescript
// Exact string
await helper.findItem(items, 'name', 'Arabica');

// Regex
await helper.findItem(items, 'name', /arabica/i);

// Function
await helper.findItem(items, 'price', (val) => parseInt(val) > 100000);
```

---

## API Reference

| Method | Description |
|--------|-------------|
| `getFieldValue(item, field)` | Lấy text của 1 field |
| `getFieldValues(items, field)` | Lấy text của field từ tất cả items |
| `getItemData(item, fields)` | Lấy object với nhiều fields |
| `findItem(items, field, matcher)` | Tìm item match điều kiện |
| `findItemByFilters(items, filters)` | Tìm với nhiều điều kiện |
| `findItemWithNextPage(...)` | Tìm qua nhiều pages |
