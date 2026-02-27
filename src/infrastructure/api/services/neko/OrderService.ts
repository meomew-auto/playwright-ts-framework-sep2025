/**
 * ============================================================================
 * ORDER SERVICE — Quản lý đơn hàng qua API
 * ============================================================================
 *
 * Kế thừa BaseService, cung cấp các phương thức cho Orders:
 * - GET: Lấy danh sách (có phân trang + filter) và chi tiết đơn hàng
 * - FILTER: Lọc theo trạng thái, đếm số lượng
 *
 * Copy từ PW_TS[2] — adapt cho project hiện tại.
 *
 * 📌 CHƯA DÙNG ZOD:
 * Sử dụng BaseService.get() (trả response.json()) thay vì getAndValidate()
 * vì chưa có Zod schema cho Order. Có thể thêm OrderSchemas.ts sau.
 */

import { APIRequestContext } from '@playwright/test';
import { BaseService } from '../base/BaseService';
import {
  Order,
  OrderFilterParams,
  OrderPaginationResponse,
} from '@models/neko/order.interface';

export class OrderService extends BaseService {
  /** Đường dẫn gốc của API đơn hàng */
  private readonly basePath = '/api/orders';

  constructor(request: APIRequestContext, authToken?: string) {
    super(request, authToken);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GET - Lấy danh sách / chi tiết đơn hàng
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách orders với pagination và filter
   *
   * @param params.page - Trang cần lấy (mặc định: 1)
   * @param params.limit - Số orders mỗi trang (mặc định: 10)
   * @param params.status - Lọc theo trạng thái: 'pending' | 'confirmed' | ...
   * @param params.order_type - Lọc theo loại: 'b2c' | 'b2b'
   * @param params.search - Tìm kiếm theo keyword
   * @returns Danh sách orders + thông tin phân trang
   */
  async getOrders(params?: OrderFilterParams): Promise<OrderPaginationResponse> {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )
        ).toString()
      : '';
    const response = await this.get(`${this.basePath}${queryString}`);
    return response.json();
  }

  /**
   * Lấy chi tiết một đơn hàng theo ID
   */
  async getOrder(id: number): Promise<Order> {
    const response = await this.get(`${this.basePath}/${id}`);
    return response.json();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FILTER Helper Methods
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Lấy orders theo trạng thái
   * @param status - Trạng thái cần lọc: 'pending', 'cancelled', ...
   */
  async getOrdersByStatus(status: OrderFilterParams['status']): Promise<OrderPaginationResponse> {
    return this.getOrders({ status });
  }

  /**
   * Đếm số lượng orders theo status
   * @param status - Trạng thái cần đếm
   * @returns Số lượng orders
   */
  async countOrdersByStatus(status: OrderFilterParams['status']): Promise<number> {
    const result = await this.getOrders({ status, limit: 1 });
    return result.pagination.total_items;
  }
}
