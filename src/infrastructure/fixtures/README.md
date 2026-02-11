# 🧩 Fixtures — Playwright Test Infrastructure

## Tổng Quan

Folder `fixtures/` chứa toàn bộ fixture infrastructure cho Playwright tests.
Fixtures cung cấp **dependency injection** cho tests — mỗi test chỉ cần khai báo fixture cần dùng,
framework tự động khởi tạo dependencies theo đúng thứ tự.

## Kiến Trúc 3 Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                          TEST FILES                                  │
│   import { test, expect } from '@fixtures/cms/ui/gatekeeper'         │
│   test('...', async ({ allProductsPage }) => { ... })                │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ sử dụng
┌──────────────────────────────▼───────────────────────────────────────┐
│                     PROJECT LAYER (cms/, neko/)                       │
│                                                                      │
│   ┌─────────────┐   ┌─────────────┐   ┌──────────────────┐          │
│   │ auth.fixture │──▶│ app.fixture │──▶│ gatekeeper.fixture│         │
│   │ (authedPage) │   │ (POMs)      │   │ (merge point)    │         │
│   └──────┬──────┘   └──────┬──────┘   └────────┬─────────┘         │
│          │                 │                    │                     │
│          │    ┌────────────┘                    │                     │
│          ▼    ▼                                 ▼                     │
│   ┌──────────────┐                    ┌─────────────────┐            │
│   │ AuthProvider  │                    │ unified.fixture │            │
│   │ (login logic) │                    │ (UI + API merge)│            │
│   └──────┬───────┘                    └─────────────────┘            │
│          │                                                           │
└──────────┼───────────────────────────────────────────────────────────┘
           │ extends
┌──────────▼───────────────────────────────────────────────────────────┐
│                      COMMON LAYER (common/)                          │
│                                                                      │
│   ┌──────────────────┐  ┌────────────┐  ┌──────────────────────┐     │
│   │ BaseAuthProvider │  │ auth.types  │  │ storage-state.utils  │     │
│   │ (abstract class) │  │ (contracts) │  │ (file I/O)           │     │
│   └──────────────────┘  └────────────┘  └──────────────────────┘     │
│   ┌──────────────────┐  ┌──────────────┐                             │
│   │ jwt.utils        │  │ ViewportType │                             │
│   │ (decode/validate)│  │ (shared type)│                             │
│   └──────────────────┘  └──────────────┘                             │
└──────────────────────────────────────────────────────────────────────┘
```

## Fixture Pipeline (Chuỗi phụ thuộc)

### UI Test Pipeline
```
playwright.config.ts
    │
    ├── setup project ──▶ auth.setup.ts ──▶ AuthProvider.loginViaUI()
    │                         │                    │
    │                         ▼                    ▼
    │                    storageState file    BaseAuthProvider (abstract)
    │                    (admin.json)              │
    │                         │               ┌────┴─────┐
    │                         ▼               ▼          ▼
    ├── test project     auth.fixture.ts   CMS Auth   Neko Auth
    │                    (authedPage)      (cookies)  (localStorage)
    │                         │
    │                         ▼
    │                    app.fixture.ts
    │                    (POMs: dashboardPage, allProductsPage, ...)
    │                         │
    │                         ▼
    └── test imports     gatekeeper.fixture.ts
                         (auth + app merged → export test, expect)
```

### API Test Pipeline (Neko only)
```
storageState file (admin.json)
    │
    ▼
auth.api.fixture.ts ──▶ Extract token từ localStorage
    │
    ▼
services.fixture.ts ──▶ Tạo APIRequestContext + inject token vào Services
    │
    ▼
gatekeeper.api.fixture.ts ──▶ Merge auth + services → export test, expect
```

## Connection Map

| File | Layer | Role | Depends On | Used By |
|------|-------|------|------------|---------|
| `auth.types.ts` | common | Shared interfaces | — | Tất cả AuthProviders |
| `jwt.utils.ts` | common | JWT decode/validate | auth.types | NekoAuthProvider |
| `storage-state.utils.ts` | common | File I/O cho storageState | auth.types | BaseAuthProvider |
| `BaseAuthProvider.ts` | common | Abstract auth class | storage-state.utils | CMS/Neko AuthProvider |
| `ViewportType.ts` | common | Shared type | — | auth.fixture (cả 2 project) |
| `role.fixture.ts` | common | Multi-role testing | ViewportType | unified.fixture (future) |
| `CMSAuthProvider.ts` | cms | Cookie-based auth | BaseAuthProvider | auth.setup.ts |
| `auth.setup.ts` | cms | Setup project | CMSAuthProvider, CMSLoginPage | playwright.config |
| `ui/auth.fixture.ts` | cms | authedPage + loginPage | ViewportType, CMSLoginPage | ui/app.fixture |
| `ui/app.fixture.ts` | cms | POM fixtures | auth.fixture (authedPage) | ui/gatekeeper |
| `ui/gatekeeper.fixture.ts` | cms | UI merge point | auth + app fixtures | Test files |
| `NekoAuthProvider.ts` | neko | localStorage + Zustand auth | BaseAuthProvider | neko.setup.ts |
| `neko.setup.ts` | neko | Setup project | NekoAuthProvider | playwright.config |
| `api/auth.api.fixture.ts` | neko | Extract token từ file | — | api/services.fixture |
| `api/services.fixture.ts` | neko | API service instances | auth.api.fixture | api/gatekeeper |
| `api/gatekeeper.api.fixture.ts` | neko | API merge point | auth + services | Test files |
| `neko/unified.fixture.ts` | neko | UI + API merge | ui/gatekeeper, api/gatekeeper | Test files, root unified |
| Root `unified.fixture.ts` | root | Cross-project merge | neko/unified, cms/unified | Cross-project tests |

## Import Guide — Dùng File Nào?

| Scenario | Import From |
|----------|-------------|
| CMS UI test | `@fixtures/cms/ui/gatekeeper.fixture` |
| Neko UI test | `@fixtures/neko/ui/gatekeeper.fixture` |
| Neko API test | `@fixtures/neko/api/gatekeeper.api.fixture` |
| Neko UI + API test | `@fixtures/neko/unified.fixture` |
| Cross-project test | Root `unified.fixture.ts` |
| CMS project barrel | `@fixtures/cms` (index.ts) |
| Neko project barrel | `@fixtures/neko` (index.ts) |

## Auth Flow — CMS vs Neko

| | CMS | Neko |
|---|-----|------|
| **Auth mechanism** | Cookie-based (session) | JWT + localStorage (Zustand) |
| **Login method** | `loginViaUI()` (browser) | `login()` (API call) |
| **StorageState format** | `cookies: [{ name: 'ecommerce_cms_session' }]` | `origins: [{ localStorage: [{ name: 'neko_auth' }] }]` |
| **Validation** | Check cookie `expires` | Check `expiresAt` in neko_auth JSON |
| **Setup file** | `auth.setup.ts` | `neko.setup.ts` |
| **AuthProvider** | `CMSAuthProvider` (singleton: `cmsAuth`) | `NekoAuthProvider` (singleton: `nekoAuth`) |

## Thêm Project Mới

1. Tạo folder `fixtures/{project}/` với cấu trúc:
   ```
   {project}/
   ├── {Project}AuthProvider.ts   ← extends BaseAuthProvider
   ├── {project}.setup.ts         ← setup project
   ├── unified.fixture.ts         ← project-level merge
   ├── index.ts                   ← barrel exports
   ├── ui/
   │   ├── auth.fixture.ts
   │   ├── app.fixture.ts
   │   └── gatekeeper.fixture.ts
   └── api/                       ← nếu có API tests
       ├── auth.api.fixture.ts
       ├── services.fixture.ts
       └── gatekeeper.api.fixture.ts
   ```

2. Override 5 abstract methods trong `BaseAuthProvider`
3. Thêm vào root `unified.fixture.ts` bằng `mergeTests()`
4. Thêm project config vào `playwright.config.ts`
