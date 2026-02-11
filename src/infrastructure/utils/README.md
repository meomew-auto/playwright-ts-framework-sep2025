# 📄 Utils — Shared Utilities

## Cấu trúc

```
utils/
├── EnvManager.ts    ← Typed access cho environment variables
└── Logger.ts        ← Centralized logging với Winston
```

## EnvManager — Environment Variables

Cung cấp typed getters thay vì dùng `process.env` trực tiếp:

```typescript
// ❌ Không an toàn — có thể undefined, luôn là string
const url = process.env.NEKO_BASE_URL;

// ✅ Type-safe — throw error nếu thiếu, trả đúng kiểu
const url = EnvManager.get('NEKO_BASE_URL');
const port = EnvManager.getNumber('PORT', 3000);
const debug = EnvManager.getBoolean('DEBUG', false);
```

### Dotenv-flow Priority

```
Cao nhất → 1. process.env (CLI, system)
           2. .env.local          (local overrides, git-ignored)
           3. .env.development    (theo NODE_ENV)
Thấp nhất → 4. .env               (defaults)
```

### Ai dùng?

```
EnvManager
├── BaseAuthProvider.ts     ← credentials (USERNAME, PASSWORD)
├── NekoAuthProvider.ts     ← NEKO_BASE_URL, NEKO_USERNAME, ...
├── CMSAuthProvider.ts      ← CMS_BASE_URL, CMS_USERNAME, ...
├── BaseService.ts          ← base URL cho API calls
├── services.fixture.ts     ← API token config
└── auth.api.fixture.ts     ← auth API config
```

---

## Logger — Centralized Logging

Winston-based logger với context icons và level colors:

```
2026-02-01 21:27:31.123 INFO  📡 [API] Creating product
2026-02-01 21:27:31.456 ERROR 🖥️ [UI] Button not found
```

### Log Levels

| Level | Khi nào | CI mode |
|-------|---------|---------|
| `error` | Lỗi nghiêm trọng | ✅ Luôn hiện |
| `warn` | Cảnh báo | ❌ Ẩn |
| `info` | Thông tin chung (default) | ❌ Ẩn |
| `debug` | Chi tiết debugging | ❌ Ẩn |

### Context Icons

| Context | Icon | Dùng bởi |
|---------|------|----------|
| `api` | 📡 | BaseService, ProductService |
| `ui` | 🖥️ | BasePage (clickWithLog, fillWithLog), CollectionHelper |
| `fixture` | ⚙️ | Auth fixtures (login flow) |
| `test` | 🧪 | Test specs |
| `setup` | 🔧 | Setup files (auth.setup.ts) |
| `cleanup` | 🗑️ | Cleanup/teardown |

### API Styles

```typescript
// Level-first (standard)
Logger.info('Creating product');
Logger.error('Failed', { context: 'api', error });
Logger.debug('Response', { data: response });

// Convenience methods (pre-set context)
Logger.api('POST /products 201');      // context: 'api'
Logger.ui('Click "Submit" button');     // context: 'ui'
Logger.fixture('Login as admin');       // context: 'fixture'
Logger.test('Verify product count');    // context: 'test'
```

### Ai dùng?

```
Logger
├── BasePage.ts              ← clickWithLog, fillWithLog (context: 'ui')
├── CollectionHelper.ts      ← search/pagination logging (context: 'ui')
├── BaseService.ts           ← API request/response (context: 'api')
├── auth fixtures            ← login flow (context: 'fixture')
├── setup files              ← setup/teardown (context: 'setup')
└── test specs               ← test steps (context: 'test')
```

### Environment Variables

| Variable | Giá trị | Mặc định |
|----------|---------|----------|
| `CI` | `true` → chỉ hiện errors | — |
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` | `info` (local), `error` (CI) |

## Mối quan hệ với các modules khác

```
┌──────────────┐     ┌──────────────┐
│  EnvManager  │     │    Logger    │
│  (.env vars) │     │  (Winston)   │
└──────┬───────┘     └──────┬───────┘
       │                     │
       ▼                     ▼
┌──────────────┐     ┌──────────────┐
│ AuthProviders│     │   BasePage   │ ← clickWithLog, fillWithLog
│ (credentials)│     │  (UI logging)│
└──────┬───────┘     └──────────────┘
       │                     │
       ▼                     ▼
┌──────────────┐     ┌──────────────────┐
│ BaseService  │◄────│ CollectionHelper  │
│ (API calls + │     │ (search logging)  │
│  env + log)  │     └──────────────────┘
└──────────────┘
```
