/**
 * ============================================================================
 * BASE PAGE — Abstract base class cho tất cả Page Object Models
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Cung cấp các utility methods và patterns chung cho mọi page object.
 * Mọi POM (CMS, Neko, CRM) đều PHẢI extend từ class này.
 *
 * 📌 CORE FEATURES:
 * 1. createLocatorGetter()          — Type-safe locator access với autocomplete
 * 2. createResponsiveLocatorGetter() — Viewport-aware locators (desktop/mobile)
 * 3. clickWithLog() / fillWithLog()  — Auto-logging cho debug
 * 4. navigateTo()                    — URL navigation với EnvManager
 *
 * 📚 POM PATTERN:
 * ```typescript
 * export class MyPage extends BasePage {
 *   private readonly locators = { button: '#btn' } as const;
 *   public element = this.createLocatorGetter(this.locators);
 *
 *   async clickButton() {
 *     await this.clickWithLog(this.element('button'));
 *   }
 * }
 * ```
 *
 * 🔗 LIÊN KẾT:
 * - Extend bởi: mọi POM trong pages/cms/, pages/neko-coffee/
 * - Dùng: ViewportType (responsive), Logger (debug), BootstrapSelectHelper (CMS)
 */
import { Locator, Page, expect } from '@playwright/test';
import { BootstrapSelectHelper } from '../../helpers/cms/BootstrapSelectHelper';
import { ViewportType } from '../../fixtures/common/ViewportType';
import { Logger } from '../../utils/Logger';

export abstract class BasePage {
  // Bootstrap Select helper (CMS-specific, but commonly used)
  protected helpers: BootstrapSelectHelper;
  
  // Viewport type for responsive locators
  protected viewportType: ViewportType;

  // Label for parallel test identification (e.g. "TC_02")
  public testLabel: string = '';

  constructor(public readonly page: Page, viewportType: ViewportType = 'desktop') {
    this.helpers = new BootstrapSelectHelper(page);
    this.viewportType = viewportType;
  }

  /** Prefix cho log messages — e.g. `[TC_02] [📱 Mobile] ` hoặc `[TC_02] [🖥️ Desktop] ` */
  protected get logPrefix(): string {
    const label = this.testLabel ? `[${this.testLabel}] ` : '';
    const viewport = this.viewportType === 'mobile' ? '[📱 Mobile] ' : '[🖥️ Desktop] ';
    return `${label}${viewport}`;
  }


  // ========== DEBUG METHODS ==========

  /**
   * Pause test để debug (chỉ dùng khi debug, không dùng trong production tests)
   * Sử dụng: await allProductsPage.pause();
   */
  async pause() {
    await this.page.pause();
  }

  // ========== Locator Helpers ==========

  /**
   * Helper method để tạo locators - giúp giảm code duplication
   * 
   * Cách sử dụng trong Page Objects:
   * ```typescript
   * private get companyInput() { return this.locator('#company'); }
   * private get vatInput() { return this.locator('#vat'); }
   * ```
   * 
   * Ưu điểm:
   * - Ngắn gọn hơn: `this.locator('#id')` thay vì `this.page.locator('#id')`
   * - Có thể thêm logic chung (logging, caching, etc.) nếu cần
   * - Consistent pattern cho tất cả pages
   * 
   * @param selector - CSS selector, XPath, hoặc Playwright locator string
   * @returns Locator instance
   */
  protected locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Locator Map Pattern - Factory method để lấy locator từ map
   * 
   * Locator Map Pattern (Mở rộng):
   * - Support cả simple selectors (string) và complex locators (function)
   * - Simple: `'#company'` → `this.locator('#company')`
   * - Complex: `(page) => page.locator('div.form-group', { hasText: 'Currency' }).locator('button[data-id="default_currency"]')`
   * 
   * @param locatorMap - Object chứa locator definitions (string hoặc function)
   * @param locatorName - Tên locator cần lấy
   * @returns Locator instance
   * 
   * @example
   * ```typescript
   * // Simple selector (string)
   * private readonly pageLocators = {
   *   company: '#company',
   *   vat: '#vat',
   * } as const;
   * 
   * // Complex locator (function) - container + filter + child
   * private readonly pageLocators = {
   *   currencyButton: (page) => 
   *     page.locator('div.form-group', { hasText: 'Currency' })
   *       .locator('button[data-id="default_currency"]'),
   * } as const;
   * 
   * // Sử dụng:
   * await this.get(this.pageLocators, 'company').fill('Test');
   * await this.get(this.pageLocators, 'currencyButton').click();
   * ```
   */
  /**
   * DEPRECATED: Method này được giữ lại để backward compatibility.
   * Khuyến nghị sử dụng pattern `createLocatorGetter` mới để có type safety và autocompletion tốt hơn.
   */
  protected get<T extends Record<string, string | ((page: Page) => Locator)>>(
    locatorMap: T,
    locatorName: keyof T
  ): Locator {
    const locatorDef = locatorMap[locatorName];

    if (typeof locatorDef === 'function') {
      return locatorDef(this.page);
    }

    return this.locator(locatorDef);
  }

  /**
   * Tạo type-safe locator getter function cho một locator map.
   * Đây là cách được khuyến nghị để truy cập locators với autocompletion và type safety tốt nhất.
   *
   * Hỗ trợ nhiều function signatures:
   * - Simple: `string` → Locator
   * - Function 1 param: `(page: Page) => Locator` → Locator
   * - Function 2 params: `(page: Page, label: string) => Locator` → `(label: string) => Locator`
   * - Function 3 params: `(page: Page, label: string, dataId: string) => Locator` → `(label: string, dataId: string) => Locator`
   * - Curried: `(page: Page) => (...args) => Locator` → `(...args) => Locator`
   *
   * @param locatorMap - Object chứa locator definitions
   * @returns Function nhận key và trả về Locator hoặc function
   *
   * @example
   * ```typescript
   * // Trong Page Object class:
   * private readonly pageLocators = {
   *   company: '#company',
   *   formGroup: (page: Page, label: string) =>
   *     page.locator('div.form-group', { hasText: label }),
   *   bootstrapSelectButton: (page: Page, label: string, dataId: string) =>
   *     page.locator('div.form-group', { hasText: label }).locator(`button[data-id="${dataId}"]`),
   * } as const;
   * public element = this.createLocatorGetter(this.pageLocators);
   *
   * // Sử dụng:
   * await this.element('company').fill('ACME Corp');
   * const container = this.element('formGroup')('Currency'); // Returns Locator
   * const button = this.element('bootstrapSelectButton')('Currency', 'default_currency'); // Returns Locator
   * ```
   */
  protected createLocatorGetter<
    T extends Record<
      string,
      | string
      | ((page: Page) => any)
      | ((page: Page, ...args: any[]) => any)
    >
  >(locatorMap: T) {
    /**
     * Type helper: Xác định kiểu trả về dựa trên định nghĩa locator
     * 
     * TẠI SAO CẦN `infer`?
     * - `infer ReturnType`: TypeScript tự động extract return type từ function
     *   Ví dụ: `(page: Page) => Locator` → ReturnType = Locator
     *   Ví dụ: `(page: Page) => (label: string) => Locator` → ReturnType = (label: string) => Locator
     * 
     * - `infer Args`: TypeScript tự động extract các tham số còn lại (sau `page`)
     *   Ví dụ: `(page: Page, label: string) => Locator` → Args = [label: string]
     *   Ví dụ: `(page: Page, label: string, dataId: string) => Locator` → Args = [label: string, dataId: string]
     * 
     * Nếu không có `infer`: Phải hardcode types hoặc dùng `any` → mất type safety
     * Với `infer`: TypeScript tự động biết chính xác types → type-safe và autocomplete hoàn hảo
     */
    type GetLocatorType<K extends keyof T> = 
      // Case 1: Nếu là string selector → trả về Locator
      T[K] extends string
        ? Locator
        // Case 2: Nếu là function 1 tham số → gọi luôn, trả về kết quả
        // infer ReturnType: Tự động biết return type là Locator hay function khác
        : T[K] extends (page: Page) => infer ReturnType
        ? ReturnType
        // Case 3: Nếu là function nhiều tham số → trả về function nhận các tham số còn lại
        // infer Args: Tự động biết các tham số còn lại là gì (label: string, hoặc label: string, dataId: string, ...)
        // infer ReturnType: Tự động biết return type cuối cùng là Locator
        : T[K] extends (page: Page, ...args: infer Args) => infer ReturnType
        ? (...args: Args) => ReturnType
        : Locator;

    return <K extends keyof T>(locatorName: K): GetLocatorType<K> => {
      const locatorDef = locatorMap[locatorName];

      // Xử lý string selector: '#company' → Locator
      if (typeof locatorDef === 'string') {
        return this.locator(locatorDef) as GetLocatorType<K>;
      }

      // Xử lý function selector
      if (typeof locatorDef === 'function') {
        // Detect số lượng tham số của function
        const paramCount = locatorDef.length;

        // Nếu function có 1 tham số (page) → gọi luôn với page
        if (paramCount === 1) {
          return locatorDef(this.page) as GetLocatorType<K>;
        }

        // Nếu function có nhiều tham số → return function wrapper
        // Wrapper này sẽ nhận các tham số còn lại và gọi function gốc với page + args
        return ((...args: any[]) => {
          return locatorDef(this.page, ...args);
        }) as GetLocatorType<K>;
      }

      // Fallback: luôn trả về Locator để giữ type safety
      return this.locator(String(locatorDef)) as GetLocatorType<K>;
    };
  }

  /**
   * Tạo type-safe responsive locator getter với viewport-aware overrides.
   * 
   * Cách hoạt động:
   * 1. Nếu có override cho viewport hiện tại → dùng override
   * 2. Nếu không → fallback về base locator
   * 
   * @param baseLocators - Locator map cơ bản (dùng cho tất cả viewports)
   * @param overrides - Object chứa overrides theo viewport
   * @returns Function nhận key và trả về Locator (đã merge override nếu có)
   * 
   * @example
   * ```typescript
   * private readonly pageLocators = {
   *   pageTitle: '.page-title',
   *   tableRows: '.table tbody tr',
   * } as const;
   * 
   * private readonly mobileOverrides = {
   *   tableRows: '.table tbody tr:not(.expanded-row)',
   * } as const;
   * 
   * private readonly getLocator = this.createResponsiveLocatorGetter(
   *   this.pageLocators,
   *   { mobile: this.mobileOverrides }
   * );
   * 
   * // Sử dụng:
   * this.getLocator('tableRows'); // Tự động chọn đúng locator theo viewport
   * ```
   */
  protected createResponsiveLocatorGetter<
    TBase extends Record<string, string | ((page: Page) => any) | ((page: Page, ...args: any[]) => any)>,
    TOverrideMap extends Partial<Record<keyof TBase, string | ((page: Page) => any) | ((page: Page, ...args: any[]) => any)>>
  >(baseLocators: TBase, overrides?: Partial<Record<ViewportType, TOverrideMap>>) {
    // Helper type để xác định return type
    type GetLocatorType<K extends keyof TBase> = 
      TBase[K] extends string
        ? Locator
        : TBase[K] extends (page: Page) => infer ReturnType
        ? ReturnType
        : TBase[K] extends (page: Page, ...args: infer Args) => infer ReturnType
        ? (...args: Args) => ReturnType
        : Locator;

    return <K extends keyof TBase>(locatorName: K): GetLocatorType<K> => {
      // Kiểm tra có override cho viewport hiện tại không
      const viewportOverrides = overrides?.[this.viewportType];
      const locatorDef = (viewportOverrides?.[locatorName] ?? baseLocators[locatorName]) as TBase[K];

      // Xử lý string selector
      if (typeof locatorDef === 'string') {
        return this.locator(locatorDef) as GetLocatorType<K>;
      }

      // Xử lý function selector
      if (typeof locatorDef === 'function') {
        const paramCount = locatorDef.length;
        
        if (paramCount === 1) {
          return locatorDef(this.page) as GetLocatorType<K>;
        }

        return ((...args: any[]) => {
          return locatorDef(this.page, ...args);
        }) as GetLocatorType<K>;
      }

      return this.locator(String(locatorDef)) as GetLocatorType<K>;
    };
  }

  // ========== Logging Helpers (Manual) ==========
  /**
   * Log click action để debug
   * Nên gọi TRƯỚC khi click để log element info
   * 
   * @param locator - Locator cần click
   * 
   * @example
   * ```typescript
   * await this.logClick(button);
   * await button.click();
   * ```
   */
  protected async logClick(locator: Locator) {
    const elementInfo = await this.getElementInfo(locator);
    Logger.ui(`${this.logPrefix}👆 Click ${elementInfo}`);
  }

  /**
   * Log fill action để debug
   * Nên gọi TRƯỚC khi fill để log element info
   * 
   * @param locator - Locator cần fill
   * @param value - Giá trị sẽ fill (optional)
   * 
   * @example
   * ```typescript
   * await this.logFill(input, 'value');
   * await input.fill('value');
   * ```
   */
  protected async logFill(locator: Locator, value?: string) {
    const elementInfo = await this.getElementInfo(locator);
    const valueInfo = value ? ` ← "${value}"` : '';
    Logger.ui(`${this.logPrefix}✏️ Fill ${elementInfo}${valueInfo}`);
  }

  // ========== Wrapper Methods (Auto-log) ==========
  /**
   * Click với auto-logging
   * 
   * Ưu điểm:
   * - Tự động log, không quên
   * - Code ngắn gọn hơn (1 dòng thay vì 2)
   * - Đảm bảo consistency
   * 
   * Nhược điểm:
   * - Mất đi tính linh hoạt (không thể chọn log hay không)
   * - Không thể customize log message
   * 
   * @param locator - Locator cần click
   * @param options - Playwright click options (optional)
   * 
   * @example
   * ```typescript
   * // Thay vì:
   * await this.logClick(button);
   * await button.click();
   * 
   * // Dùng:
   * await this.clickWithLog(button);
   * ```
   */
  protected async clickWithLog(locator: Locator, options?: Parameters<Locator['click']>[0]) {
    await this.logClick(locator);
    await locator.click(options);
  }

  /**
   * Fill với auto-logging
   * 
   * Ưu điểm:
   * - Tự động log, không quên
   * - Code ngắn gọn hơn (1 dòng thay vì 2)
   * - Đảm bảo consistency
   * - Explicit control: Developer có thể chỉ định `isSensitive`
   * - Auto-detect fallback: Tự động detect nếu không chỉ định
   * 
   * Strategy:
   * 1. Nếu `options.isSensitive` được set → dùng giá trị đó (explicit control)
   * 2. Nếu không → auto-detect từ selector (fast, no await)
   * 
   * @param locator - Locator cần fill
   * @param value - Giá trị cần fill
   * @param options - Options object:
   *   - `isSensitive?: boolean` - Explicit flag để mask sensitive data (override auto-detect)
   *   - `fillOptions?: FillOptions` - Playwright fill options (timeout, force, etc.)
   * 
   * @example
   * ```typescript
   * // Explicit control (khuyến nghị cho password fields)
   * await this.fillWithLog(this.passwordInput, password, { isSensitive: true });
   * 
   * // Auto-detect (fallback, check selector string)
   * await this.fillWithLog(this.emailInput, email); // Tự động detect từ selector
   * 
   * // Với Playwright fill options
   * await this.fillWithLog(this.input, 'value', {
   *   isSensitive: false,
   *   fillOptions: { timeout: 5000 }
   * });
   * ```
   */
  protected async fillWithLog(
    locator: Locator,
    value: string,
    options?: {
      isSensitive?: boolean;
      fillOptions?: Parameters<Locator['fill']>[1];
    }
  ) {
    // Explicit control: Nếu developer chỉ định isSensitive → dùng luôn
    let isSensitive = options?.isSensitive;
    // Mask sensitive data
    const logValue = isSensitive ? '***' : value;
    await this.logFill(locator, logValue);
    
    // Fill với Playwright options (nếu có)
    await locator.fill(value, options?.fillOptions);
  }

  /**
   * Lấy element info để logging (tag name + text)
   * 
   * Strategy:
   * 1. Thử lấy `innerText()` (visible text, tự động trim whitespace)
   * 2. Fallback: `textContent()` (bao gồm cả hidden text)
   * 3. Fallback: Lấy tag name
   * 4. Fallback: Locator string representation
   * 
   * @param locator - Locator cần lấy info
   * @returns String mô tả element (tag name + text)
   */
  private async getElementInfo(locator: Locator): Promise<string> {
    try {
      // Thử lấy tag name
      const tagName = await locator.evaluate((el) => el.tagName.toLowerCase()).catch(() => 'element');
      
      // Thử lấy text (ưu tiên innerText vì nó chỉ lấy visible text)
      let text = '';
      try {
        text = await locator.innerText();
        text = text.trim();
      } catch {
        try {
          const textContent = await locator.textContent();
          text = textContent?.trim() || '';
        } catch {
          // Nếu không lấy được text, thử lấy value (cho input)
          try {
            const value = await locator.inputValue().catch(() => '');
            if (value) text = `value="${value}"`;
          } catch {
            // Ignore
          }
        }
      }
      
      // Format: <tag> text hoặc <tag> (no text)
      if (text) {
        return `<${tagName}> "${text}"`;
      }
      return `<${tagName}> (no text)`;
    } catch (error) {
      // Fallback: return locator string
      return locator.toString();
    }
  }


  // ========== Navigation Helpers ==========

  /**
   * Navigate đến một URL path (relative hoặc absolute)
   * 
   * Nếu baseURL được config trong playwright.config.ts, có thể dùng relative path.
   * Nếu không có baseURL, phải dùng full URL.
   * 
   * @param path - URL path (relative hoặc absolute)
   * @param options - Playwright goto options (optional)
   * 
   * @example
   * ```typescript
   * // Với baseURL = 'https://cms.anhtester.com'
   * await this.navigateTo('/login'); // → https://cms.anhtester.com/login
   * await this.navigateTo('/dashboard'); // → https://cms.anhtester.com/dashboard
   * 
   * // Absolute URL (override baseURL)
   * await this.navigateTo('https://example.com/page');
   * ```
   */
  protected async navigateTo(path: string, options?: Parameters<Page['goto']>[1]) {
    Logger.ui(`${this.logPrefix}📍 Navigate to ${path}`);
    await this.page.goto(path, options);
  }

  /**
   * Expect element to be visible với auto-logging khi fail
   * Tạo custom error với message rõ ràng để dễ debug
   * 
   * @param locator - Locator cần expect
   * @param context - Context string để log (method name, step description)
   * @param timeout - Timeout (default: 5000ms)
   * 
   * @example
   * ```typescript
   * await this.expectVisible(button, '[selectColors] Colors select button');
   * ```
   */
  protected async expectVisible(
    locator: Locator,
    context?: string,
    timeout: number = 5000
  ): Promise<void> {
    const elementInfo = await this.getElementInfo(locator).catch(() => locator.toString());
    Logger.ui(`${this.logPrefix}⏳ Wait for ${elementInfo} to be visible`);
    try {
      await expect(locator).toBeVisible({ timeout });
    } catch (error) {
      const contextMsg = context ? `${context}: ` : '';
      const originalError = error instanceof Error ? error : new Error(String(error));
      const errorMsg = originalError.message;
      
      // Tạo error mới với message rõ ràng hơn, giữ nguyên stack trace
      const enhancedError = new Error(
        `${contextMsg}Element không visible: ${elementInfo}\n` +
        `  Original error: ${errorMsg}`
      );
      enhancedError.name = originalError.name;
      enhancedError.stack = originalError.stack;
      
      Logger.error(`[Expect Failed] ${contextMsg}${elementInfo}`, { error: originalError });
      throw enhancedError;
    }
  }

  /**
   * Expect element to be hidden với auto-logging khi fail
   * 
   * @param locator - Locator cần expect
   * @param context - Context string để log
   * @param timeout - Timeout (default: 5000ms)
   */
  protected async expectHidden(
    locator: Locator,
    context?: string,
    timeout: number = 5000
  ): Promise<void> {
    const elementInfo = await this.getElementInfo(locator).catch(() => locator.toString());
    Logger.ui(`${this.logPrefix}⏳ Wait for ${elementInfo} to be hidden`);
    try {
      await expect(locator).toBeHidden({ timeout });
    } catch (error) {
      const contextMsg = context ? `${context}: ` : '';
      const originalError = error instanceof Error ? error : new Error(String(error));
      const errorMsg = originalError.message;
      
      // Tạo error mới với message rõ ràng hơn, giữ nguyên stack trace
      const enhancedError = new Error(
        `${contextMsg}Element không hidden: ${elementInfo}\n` +
        `  Original error: ${errorMsg}`
      );
      enhancedError.name = originalError.name;
      enhancedError.stack = originalError.stack;
      
      Logger.error(`[Expect Failed] ${contextMsg}${elementInfo}`, { error: originalError });
      throw enhancedError;
    }
  }

  /**
   * Wrapper cho async operations với auto-logging
   * Tự động log start, success, và error
   * Giữ nguyên stack trace để dễ debug
   * 
   * @param operation - Async function cần execute
   * @param context - Context string để log (method name, step description)
   * 
   * @example
   * ```typescript
   * await this.executeWithLog(
   *   async () => {
   *     await button.click();
   *     await dropdown.waitFor({ state: 'visible' });
   *   },
   *   '[selectColors] Click button and wait dropdown'
   * );
   * ```
   */
  protected async executeWithLog<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    const contextMsg = context ? `${context}: ` : '';
    try {
      if (context) Logger.ui(`${this.logPrefix}Starting: ${context}`);
      const result = await operation();
      if (context) Logger.ui(`${this.logPrefix}✓ Completed: ${context}`);
      return result;
    } catch (error) {
      const originalError = error instanceof Error ? error : new Error(String(error));
      const errorMsg = originalError.message;
      
      // Tạo error mới với context, nhưng giữ nguyên stack trace
      const enhancedError = new Error(
        `${contextMsg}${errorMsg}`
      );
      enhancedError.name = originalError.name;
      enhancedError.stack = originalError.stack; // Giữ nguyên stack trace gốc để biết fail ở đâu
      
      Logger.error(`❌ Failed: ${context}`, { error: originalError });
      throw enhancedError;
    }
  }

  // ========== FIELD VERIFICATION ==========

  /**
   * Verify nhiều field values cùng lúc, auto-detect type:
   *   boolean → toBeChecked / not.toBeChecked
   *   RegExp  → toHaveValue(regex)
   *   string  → toHaveValue(string)
   *   number  → toHaveValue(String(number))
   *
   * @param fields - Array of { locator, expected } pairs
   *
   * @example
   * ```typescript
   * // Gọi trực tiếp
   * await this.verifyFieldValues([
   *   { locator: this.element('productNameInput'), expected: 'iPhone 15' },
   *   { locator: this.element('unitPriceInput'),   expected: 100 },
   *   { locator: this.element('featuredCheckbox'),  expected: true },
   * ]);
   *
   * // Trong section verify() — auto-filter undefined
   * const fields = [
   *   data.name     !== undefined && { locator: self.element('productNameInput'), expected: data.name },
   *   data.minQty   !== undefined && { locator: self.element('minQtyInput'),      expected: data.minQty },
   * ].filter(Boolean);
   * await self.verifyFieldValues(fields);
   * ```
   */
  async verifyFieldValues(
    fields: Array<{ locator: Locator; expected: string | number | RegExp | boolean }>
  ): Promise<void> {
    for (const { locator, expected } of fields) {
      if (typeof expected === 'boolean') {
        if (expected) {
          await expect(locator).toBeChecked();
        } else {
          await expect(locator).not.toBeChecked();
        }
      } else if (expected instanceof RegExp) {
        await expect(locator).toHaveValue(expected);
      } else {
        await expect(locator).toHaveValue(String(expected));
      }
    }
  }

  /**
   * Verify text content nhiều elements cùng lúc.
   * Auto: toBeVisible() → toHaveText() cho mỗi field.
   *
   * Khác `verifyFieldValues()`:
   *   - `verifyFieldValues()` → `toHaveValue()` — cho `<input>`, `<select>` (form)
   *   - `verifyTextValues()`  → `toHaveText()`  — cho `<h1>`, `<span>`, `<p>` (display)
   *
   * @param fields - Array of { locator, expected } pairs
   *
   * @example
   * ```typescript
   * // Gọi trực tiếp
   * await this.verifyTextValues([
   *   { locator: this.element('pageTitle'), expected: 'Cửa hàng' },
   *   { locator: this.element('copyright'), expected: /© \d{4} Neko/ },
   * ]);
   *
   * // Trong Page Object verify section
   * readonly verify = {
   *   pageTitle: async (text: string | RegExp = 'Cửa hàng') => {
   *     await this.verifyTextValues([
   *       { locator: this.element('pageTitle'), expected: text },
   *     ]);
   *   },
   * };
   * ```
   */
  async verifyTextValues(
    fields: Array<{ locator: Locator; expected: string | RegExp }>
  ): Promise<void> {
    for (const { locator, expected } of fields) {
      await expect(locator).toBeVisible();
      await expect(locator).toHaveText(expected);
    }
  }

  /**
   * Abstract method - mỗi page phải implement để verify page đã load đúng
   * 
   * @returns Promise<void>
   */
  abstract expectOnPage(): Promise<void>;
}
