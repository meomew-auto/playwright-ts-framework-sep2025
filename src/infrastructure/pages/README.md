# 📄 Pages — Page Object Models (POM)

## Cấu trúc

```
pages/
├── base/
│   └── BasePage.ts              ← Abstract base — tất cả POM extend từ đây
├── cms/                         ← CMS eCommerce (ActiveEcommerce)
│   ├── CMSLoginPage.ts          ← Form đăng nhập (/login)
│   ├── CMSDashboardPage.ts      ← Dashboard + sidebar navigation
│   ├── CMSAllProductsPage.ts    ← Bảng danh sách sản phẩm (782 lines)
│   └── CMSAddNewProductPage.ts  ← Form tạo product (1170+ lines)
├── neko-coffee/                 ← Neko Coffee (public storefront)
│   └── ProductsPage.ts          ← Grid sản phẩm cho khách hàng
└── crm/                         ← CRM (future — chưa có page)
```

## Dependencies — Helpers, Resolvers, Components

Pages sử dụng nhiều module hỗ trợ:

```
                              ┌──────────────────────────────┐
                              │         BasePage.ts          │
                              │  (locator getters, logging)  │
                              └──────────┬───────────────────┘
                                         │ extends
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
            CMS Pages              Neko Pages           CRM Pages
         (4 files)               (1 file)            (future)
                    │                    │
                    ▼                    ▼
        ┌───────────────────────────────────────────┐
        │        helpers/common/collection/          │
        │  CollectionHelper ← TableResolver (CMS)   │
        │                   ← GridResolver  (Neko)  │
        │                   ← FieldResolver (base)  │
        └───────────────────────────────────────────┘
```

### Chi tiết Dependencies

| Page | Dùng Resolver | Dùng Helper/Component | Mục đích |
|------|--------------|----------------------|----------|
| **CMSAllProductsPage** | `TableResolver` | `CollectionHelper`, `BootstrapSelectHelper` | Đọc table data theo column headers |
| **CMSAddNewProductPage** | — | `BootstrapSelectHelper` | Bootstrap select dropdowns |
| **CMSDashboardPage** | — | `CMSSidebarMenu` (component) | Sidebar navigation |
| **CMSLoginPage** | — | — | Form đơn giản |
| **ProductsPage** (Neko) | `GridResolver` | `CollectionHelper` | Đọc product cards (grid layout) |

### TableResolver vs GridResolver

| | TableResolver | GridResolver |
|---|---|---|
| **Dùng cho** | CMS (bảng HTML có `<th>`) | Neko (cards/grid layout) |
| **Auto-detect columns** | ✅ Đọc `<th>` headers | ❌ Cần FIELD_MAP manual |
| **Ví dụ** | `CMSAllProductsPage` | `ProductsPage` (Neko) |

### Helpers

```
helpers/
├── cms/
│   └── BootstrapSelectHelper.ts   ← Xử lý Bootstrap Select dropdowns
│                                     (BasePage inject sẵn → this.helpers)
└── common/
    ├── WaitHelpers.ts             ← waitForCondition, retries
    └── collection/                ← 📖 Có README.md riêng
        ├── CollectionHelper.ts    ← Orchestrator: getFieldValues, findRow, getTableData
        ├── FieldResolver.ts       ← Base interface + TextMatcher, FieldCleanerMap
        ├── TableResolver.ts       ← HTML table strategy (<th> → column mapping)
        └── GridResolver.ts        ← Grid/card strategy (CSS selectors → field mapping)
```

### Components

```
components/
└── cms/
    └── CMSSidebarMenu.ts          ← Reusable sidebar: clickMenuItem, clickSubMenuItem
                                      (dùng bởi CMSDashboardPage)
```

## Quy tắc khi tạo Page mới

1. **Extend `BasePage`** — bắt buộc
2. **Dùng `createLocatorGetter()`** cho locator access
3. **Dùng `createResponsiveLocatorGetter()`** nếu có responsive layout
4. **Chọn đúng Resolver:**
   - Có bảng HTML (`<table>`, `<th>`) → `TableResolver`
   - Có grid/cards → `GridResolver` + tự define FIELD_MAP
5. **Đặt tên file:** `CMS{PageName}Page.ts` (CMS) hoặc `{PageName}Page.ts` (Neko)
6. **Không cần barrel** (`index.ts`) — import trực tiếp bằng alias

## Import Patterns

```typescript
// Page import — luôn import trực tiếp
import { CMSAllProductsPage } from '@pages/cms/CMSAllProductsPage';
import { ProductsPage } from '@pages/neko-coffee/ProductsPage';

// Collection helpers — dùng @collection alias
import { TableResolver } from '@collection/TableResolver';
import { GridResolver } from '@collection/GridResolver';
import { CollectionHelper } from '@collection/CollectionHelper';
```
