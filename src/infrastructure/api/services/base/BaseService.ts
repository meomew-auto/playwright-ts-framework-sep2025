/**
 * ============================================================================
 * BASE API SERVICE - Lớp cơ sở cho tất cả API service
 * ============================================================================
 *
 * Lớp abstract (trừu tượng) cung cấp các chức năng chung:
 * - Quản lý headers xác thực (Bearer token)
 * - Các phương thức HTTP cơ bản (GET, POST, PUT, DELETE, PATCH)
 * - Các phương thức HTTP có xác thực Zod (getAndValidate, postAndValidate, ...)
 * - Ghi log tự động cho mọi request/response
 * - Hỗ trợ test tiêu cực (postExpectError, putExpectError)
 *
 * Mỗi project tạo service riêng kế thừa từ lớp này.
 *
 * @example
 * ```typescript
 * export class ProductService extends BaseService {
 *   async getProducts(): Promise<Product[]> {
 *     return this.getAndValidate('/products', ProductSchema);
 *   }
 * }
 * ```
 */

import { APIRequestContext, APIResponse } from '@playwright/test';
import { z } from 'zod';
import { Logger } from '@utils/Logger';

export abstract class BaseService {
  constructor(
    protected request: APIRequestContext, // Context API từ Playwright
    protected authToken?: string          // Token xác thực (tùy chọn)
  ) {}

  /**
   * Tạo headers mặc định cho mọi API request
   * Tự động thêm Authorization header nếu có token
   */
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁC PHƯƠNG THỨC HTTP CƠ BẢN (trả về APIResponse nguyên gốc)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Ghi log thông tin request/response
   * Response body chỉ hiện khi LOG_LEVEL=debug
   */
  private logApiCall(
    method: string,
    endpoint: string,
    status: number,
    durationMs: number,
    responseBody?: unknown
  ): void {
    Logger.info(`${method} ${endpoint} ${status} (${durationMs}ms)`, { context: 'api' });
    
    // Chỉ log response body khi ở mức DEBUG
    if (Logger.isLevelEnabled('debug') && responseBody !== undefined) {
      Logger.debug(`Response body:`, { context: 'api', data: responseBody });
    }
  }

  /**
   * Gửi GET request có ghi log tự động
   * Dùng cho: lấy danh sách, lấy chi tiết resource
   */
  protected async get(endpoint: string): Promise<APIResponse> {
    const start = Date.now();
    const response = await this.request.get(endpoint, {
      headers: this.getHeaders(),
    });
    this.logApiCall('GET', endpoint, response.status(), Date.now() - start);
    return response;
  }

  /**
   * Gửi POST request có ghi log tự động
   * Dùng cho: tạo mới resource
   */
  protected async post(endpoint: string, data?: unknown): Promise<APIResponse> {
    Logger.debug('Request payload:', { context: 'api', data });
    const start = Date.now();
    const response = await this.request.post(endpoint, {
      headers: this.getHeaders(),
      data,
    });
    this.logApiCall('POST', endpoint, response.status(), Date.now() - start);
    return response;
  }

  /**
   * Gửi PUT request có ghi log tự động
   * Dùng cho: cập nhật TOÀN BỘ resource (thay thế hoàn toàn)
   */
  protected async put(endpoint: string, data?: unknown): Promise<APIResponse> {
    Logger.debug('Request payload:', { context: 'api', data });
    const start = Date.now();
    const response = await this.request.put(endpoint, {
      headers: this.getHeaders(),
      data,
    });
    this.logApiCall('PUT', endpoint, response.status(), Date.now() - start);
    return response;
  }

  /**
   * Gửi DELETE request có ghi log tự động
   * Dùng cho: xóa resource
   */
  protected async delete(endpoint: string): Promise<APIResponse> {
    const start = Date.now();
    const response = await this.request.delete(endpoint, {
      headers: this.getHeaders(),
    });
    this.logApiCall('DELETE', endpoint, response.status(), Date.now() - start);
    return response;
  }

  /**
   * Gửi PATCH request có ghi log tự động
   * Dùng cho: cập nhật MỘT PHẦN resource (chỉ trường cần thay đổi)
   */
  protected async patch(endpoint: string, data?: unknown): Promise<APIResponse> {
    Logger.debug('Request payload:', { context: 'api', data });
    const start = Date.now();
    const response = await this.request.patch(endpoint, {
      headers: this.getHeaders(),
      data,
    });
    this.logApiCall('PATCH', endpoint, response.status(), Date.now() - start);
    return response;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHƯƠNG THỨC HTTP CÓ XÁC THỰC ZOD (tự động validate response)
  // Dùng cho positive tests - khi mong đợi response thành công
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * GET + xác thực response bằng Zod schema
   *
   * Flow: gọi GET → lấy JSON → schema.parse(json) → trả về typed data
   * @throws ZodError nếu response không khớp schema
   */
  protected async getAndValidate<T>(endpoint: string, schema: z.ZodSchema<T>): Promise<T> {
    const response = await this.get(endpoint);
    const data = await response.json();
    Logger.debug('Response body:', { context: 'api', data });
    return schema.parse(data);
  }

  /**
   * POST + xác thực response bằng Zod schema
   *
   * Flow: gọi POST → kiểm tra status OK → lấy JSON → schema.parse(json)
   * @throws Error nếu API trả về status lỗi (4xx, 5xx)
   * @throws ZodError nếu response không khớp schema
   */
  protected async postAndValidate<T>(
    endpoint: string,
    requestData: unknown,
    responseSchema: z.ZodSchema<T>
  ): Promise<T> {
    const response = await this.post(endpoint, requestData);
    const data = await response.json();
    Logger.debug('Response body:', { context: 'api', data });
    
    // Kiểm tra nếu API trả về lỗi
    if (!response.ok()) {
      throw new Error(`API Error ${response.status()}: ${JSON.stringify(data)}`);
    }
    
    return responseSchema.parse(data);
  }

  /**
   * PUT + xác thực response bằng Zod schema
   * @throws ZodError nếu response không khớp schema
   */
  protected async putAndValidate<T>(
    endpoint: string,
    requestData: unknown,
    responseSchema: z.ZodSchema<T>
  ): Promise<T> {
    const response = await this.put(endpoint, requestData);
    const data = await response.json();
    Logger.debug('Response body:', { context: 'api', data });
    return responseSchema.parse(data);
  }

  /**
   * PATCH + xác thực response bằng Zod schema
   * @throws ZodError nếu response không khớp schema
   */
  protected async patchAndValidate<T>(
    endpoint: string,
    requestData: unknown,
    responseSchema: z.ZodSchema<T>
  ): Promise<T> {
    const response = await this.patch(endpoint, requestData);
    const data = await response.json();
    Logger.debug('Response body:', { context: 'api', data });
    return responseSchema.parse(data);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HỖ TRỢ TEST TIÊU CỰC (Negative Test - gửi data SAI, mong đợi lỗi)
  // Dùng cho: kiểm tra API xử lý lỗi đúng cách
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * POST mong đợi response LỖI - validate lỗi bằng Zod schema
   * Dùng cho negative API tests (gửi data không hợp lệ)
   *
   * Flow:
   * 1. Gửi POST với data (thường là data sai)
   * 2. Kiểm tra HTTP status có đúng mong đợi (ví dụ 400, 422)
   * 3. Parse response body bằng error schema
   * 4. Trả về typed error object
   *
   * @param endpoint - Đường dẫn API
   * @param data - Body request (thường là data không hợp lệ)
   * @param expectedStatus - HTTP status mong đợi (một số hoặc mảng)
   * @param errorSchema - Zod schema để validate response lỗi
   * @returns Response lỗi đã được validate
   * @throws Error nếu status không khớp mong đợi
   * @throws ZodError nếu response lỗi không khớp schema
   *
   * @example
   * // Trong ProductService
   * async createProductExpectError(data: unknown): Promise<ValidationError> {
   *   return this.postExpectError(this.basePath, data, [400, 422], ErrorSchemas.ValidationError);
   * }
   */
  protected async postExpectError<E>(
    endpoint: string,
    data: unknown,
    expectedStatus: number | number[],
    errorSchema: z.ZodSchema<E>
  ): Promise<E> {
    const response = await this.post(endpoint, data);
    const statuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

    if (!statuses.includes(response.status())) {
      const body = await response.text();
      throw new Error(
        `Expected status ${statuses.join('|')}, got ${response.status()}. Body: ${body}`
      );
    }

    const json = await response.json();
    Logger.debug('Response body:', { context: 'api', data: json });
    return errorSchema.parse(json);
  }

  /**
   * PUT mong đợi response LỖI
   * Tương tự postExpectError nhưng dùng phương thức PUT
   */
  protected async putExpectError<E>(
    endpoint: string,
    data: unknown,
    expectedStatus: number | number[],
    errorSchema: z.ZodSchema<E>
  ): Promise<E> {
    const response = await this.put(endpoint, data);
    const statuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

    if (!statuses.includes(response.status())) {
      const body = await response.text();
      throw new Error(
        `Expected status ${statuses.join('|')}, got ${response.status()}. Body: ${body}`
      );
    }

    const json = await response.json();
    return errorSchema.parse(json);
  }
}
