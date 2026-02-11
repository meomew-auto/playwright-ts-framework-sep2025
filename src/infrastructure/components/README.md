# 🧩 Components - Thành phần UI tái sử dụng

## Folder này dùng để làm gì?

Folder `components/` chứa các **UI component classes** — các thành phần giao diện tái sử dụng được dùng chung giữa nhiều page objects.

Khác với **Page Objects** (đại diện cho 1 trang hoàn chỉnh), Components đại diện cho **một phần** của trang mà xuất hiện ở nhiều nơi.

## Khi nào tạo Component thay vì Page Object?

| Tiêu chí | Page Object | Component |
|----------|-------------|-----------|
| Đại diện cho | Một trang hoàn chỉnh | Một phần UI lặp lại |
| Có URL riêng? | ✅ Có | ❌ Không |
| Xuất hiện ở | 1 URL duy nhất | Nhiều trang khác nhau |
| Ví dụ | `CMSDashboardPage` | `CMSSidebarMenu` |

## Cấu trúc thư mục (multi-project)

```text
components/
├── cms/
│   └── CMSSidebarMenu.ts     # Sidebar của CMS (Active eCommerce)
└── neko/
    └── SidebarMenu.ts        # Sidebar của Neko Coffee
```

Theo pattern tương tự như `pages/`, `helpers/`, `models/` — **chia theo project**.

## Cách sử dụng trong Page Object

Component được tạo bên trong Page Object, không inject qua fixture:

```typescript
// pages/cms/CMSDashboardPage.ts
import { CMSSidebarMenu } from '../../components/cms/CMSSidebarMenu';
// hoặc dùng alias:
import { CMSSidebarMenu } from '@components/cms/CMSSidebarMenu';

export class CMSDashboardPage extends BasePage {
  // Tạo component instance
  get sidebarMenu() { return new CMSSidebarMenu(this.page); }

  // Dùng component trong method
  async navigateToMenu(menuText: string) {
    await this.sidebarMenu.clickMenuItem(menuText);
  }
}
```

## Path Aliases

```json
// tsconfig.json
"@components/cms/*": ["src/infrastructure/components/cms/*"],
"@components/neko/*": ["src/infrastructure/components/neko/*"]
```

## Tạo Component mới

```typescript
// components/{project}/ModalDialog.ts
import { Locator, Page } from '@playwright/test';

export class ModalDialog {
  private readonly modal: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('.modal.show');
  }

  async clickConfirm(): Promise<void> {
    await this.modal.locator('.btn-primary').click();
  }

  async clickCancel(): Promise<void> {
    await this.modal.locator('.btn-secondary').click();
  }
}
```

## Mối liên hệ với Page Objects

```text
Page Object (CMSDashboardPage)
  │
  ├── Locators (pageLocators) → Các element riêng của trang
  │
  └── Components → Các thành phần UI dùng chung
      └── CMSSidebarMenu → Sidebar navigation
      └── ModalDialog    → Dialog xác nhận
```

Component KHÔNG kế thừa `BasePage` — nó chỉ nhận `Page` qua constructor và cung cấp các method tương tác với phần UI cụ thể.
