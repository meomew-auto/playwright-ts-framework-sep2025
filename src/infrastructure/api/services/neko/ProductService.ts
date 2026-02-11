/**
 * ============================================================================
 * PRODUCT SERVICE - Quản lý sản phẩm qua API
 * ============================================================================
 *
 * Kế thừa BaseService, cung cấp các phương thức CRUD cho sản phẩm:
 * - GET: Lấy danh sách (có phân trang) và chi tiết sản phẩm
 * - POST: Tạo sản phẩm mới
 * - PUT: Cập nhật toàn bộ sản phẩm
 * - PATCH: Cập nhật một phần sản phẩm
 * - DELETE: Xóa sản phẩm
 * - UPLOAD: Tải ảnh sản phẩm
 *
 * Tất cả phương thức đều tự động validate response bằng Zod schema.
 */

import { APIRequestContext } from '@playwright/test';
import { BaseService } from '../base/BaseService';
import { ProductSchemas } from '../../schemas/neko/ProductSchemas';
import { ErrorSchemas, AnyError } from '../../schemas/neko/ErrorSchemas';

import { 
  Product, 
  ProductCreate, 
  ProductUpdate,
  ProductPatch,
  PaginatedResponse,
  ImageUploadResponse
} from '@models/neko/product.interface';

export class ProductService extends BaseService {
  /** Đường dẫn gốc của API sản phẩm */
  private readonly basePath = '/api/products';

  constructor(request: APIRequestContext, authToken?: string) {
    super(request, authToken);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET - Lấy danh sách / chi tiết sản phẩm (có xác thực Zod)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách sản phẩm có phân trang
   *
   * @param params.page - Trang cần lấy (mặc định: 1)
   * @param params.limit - Số sản phẩm mỗi trang (mặc định: 10)
   * @param params.type - Lọc theo loại: 'bean' | 'equipment' | 'accessory'
   * @returns Danh sách sản phẩm + thông tin phân trang, đã validate
   */
  async getProducts(params?: { page?: number; limit?: number; type?: string }): Promise<PaginatedResponse<Product>> {
    const queryString = params 
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return this.getAndValidate(
      `${this.basePath}${queryString}`,
      ProductSchemas.PaginatedProducts
    );
  }

  /**
   * Lấy chi tiết một sản phẩm theo ID
   * @throws ZodError nếu response không khớp ProductSchema
   */
  async getProduct(id: number): Promise<Product> {
    return this.getAndValidate(
      `${this.basePath}/${id}`,
      ProductSchemas.Product
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST - Tạo sản phẩm mới (có xác thực Zod)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Tạo sản phẩm mới
   * @param data - Dữ liệu sản phẩm (ProductCreate)
   * @returns Sản phẩm đã tạo, validate bằng ProductSchema
   */
  async createProduct(data: ProductCreate): Promise<Product> {
    return this.postAndValidate(
      this.basePath,
      data,
      ProductSchemas.Product
    );
  }

  /**
   * Tạo sản phẩm RAW (không validate response)
   * Dùng cho edge cases khi cần kiểm tra response trực tiếp
   *
   * @param data - Dữ liệu bất kỳ (unknown - có thể data sai)
   * @returns APIResponse nguyên gốc từ Playwright
   *
   * @example
   * const response = await productService.createProductRaw({ price: -100 });
   * expect([201, 400, 422]).toContain(response.status());
   */
  async createProductRaw(data: unknown) {
    return this.post(this.basePath, data);
  }

  /**
   * Tạo sản phẩm MONG ĐỢI LỖI - dùng cho negative tests
   * Gửi data không hợp lệ → validate error response bằng Zod
   * Hỗ trợ cả 2 format: {detail:[...]} hoặc {status, code, message}
   *
   * @param data - Dữ liệu không hợp lệ (ví dụ: thiếu trường, sai kiểu)
   * @param expectedStatus - HTTP status mong đợi (mặc định: 400 hoặc 422)
   * @returns Lỗi đã validate (ValidationError hoặc ApiError)
   *
   * @example
   * const error = await productService.createProductExpectError({});
   * // Dùng helper để lấy messages bất kể format nào
   * const messages = ErrorSchemas.getErrorMessages(error);
   */
  async createProductExpectError(
    data: unknown,
    expectedStatus: number | number[] = [400, 422]
  ): Promise<AnyError> {
    return this.postExpectError(
      this.basePath,
      data,
      expectedStatus,
      ErrorSchemas.AnyError
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUT - Cập nhật TOÀN BỘ sản phẩm (thay thế hoàn toàn)
  // Phải gửi ĐẦY ĐỦ tất cả trường, trường nào không gửi sẽ bị xóa
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Cập nhật toàn bộ sản phẩm (PUT)
   * @param id - ID sản phẩm cần cập nhật
   * @param data - Dữ liệu đầy đủ (ProductUpdate)
   */
  async updateProduct(id: number, data: ProductUpdate): Promise<Product> {
    return this.putAndValidate(
      `${this.basePath}/${id}`,
      data,
      ProductSchemas.Product
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH - Cập nhật MỘT PHẦN sản phẩm (chỉ gửi trường cần thay đổi)
  // Các trường không gửi sẽ giữ nguyên giá trị cũ
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Cập nhật một phần sản phẩm (PATCH)
   * @param id - ID sản phẩm cần cập nhật
   * @param data - Chỉ các trường cần thay đổi (ProductPatch)
   */
  async patchProduct(id: number, data: ProductPatch): Promise<Product> {
    return this.patchAndValidate(
      `${this.basePath}/${id}`,
      data,
      ProductSchemas.Product
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE - Xóa sản phẩm
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Xóa sản phẩm theo ID
   * @param id - ID sản phẩm cần xóa
   */
  async deleteProduct(id: number): Promise<void> {
    await this.delete(`${this.basePath}/${id}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPLOAD IMAGE - Tải ảnh sản phẩm
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Tải ảnh lên cho sản phẩm
   *
   * @param productId - ID sản phẩm
   * @param imageFile - Thông tin file ảnh
   * @param imageFile.name - Tên file: 'product.jpg'
   * @param imageFile.mimeType - Loại file: 'image/jpeg'
   * @param imageFile.buffer - Nội dung file dạng Buffer
   */
  async uploadImage(
    productId: number, 
    imageFile: { name: string; mimeType: string; buffer: Buffer }
  ): Promise<ImageUploadResponse> {
    const response = await this.post(`${this.basePath}/${productId}/image`, {
      image: imageFile
    });
    return response.json();
  }
}
