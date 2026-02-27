/**
 * ============================================================================
 * NEKO ORDER INTERFACE — Type definitions cho Neko Coffee Orders
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Định nghĩa TypeScript types cho order-related data.
 * Copy từ PW_TS[2] — adapt cho project hiện tại.
 *
 * 📚 ORDER STATUS FLOW:
 * pending → confirmed → processing → ready → shipped → delivered
 *                                                    → cancelled (bất kỳ lúc nào)
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: api/services/neko/OrderService.ts
 * - Dùng bởi: orders-table.spec.ts (combined UI+API test)
 *
 * Dựa trên API: https://api-neko-coffee.autoneko.com/api/orders
 */

// ─────────────────────────────────────────────────────────────────────────
// ENUMS / TYPES
// ─────────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'       // Chờ xử lý
  | 'confirmed'     // Đã xác nhận
  | 'processing'    // Đang chuẩn bị
  | 'ready'         // Sẵn sàng giao
  | 'shipped'       // Đang giao hàng
  | 'delivered'     // Đã giao hàng
  | 'cancelled';    // Đã hủy

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type PaymentMethod = 'cash' | 'vnpay' | 'momo' | 'bank_transfer';

export type OrderType = 'b2c' | 'b2b';

// ─────────────────────────────────────────────────────────────────────────
// ORDER (READ)
// ─────────────────────────────────────────────────────────────────────────

export interface Order {
  id: number;
  order_number: string;
  order_type: OrderType;
  customer_id: number;
  status: OrderStatus;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes: string | null;
  approved_by: number | null;
  approved_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  email: string;
  phone: string;
  shipping_name: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────────

export interface OrderPagination {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface OrderPaginationResponse {
  data: Order[];
  pagination: OrderPagination;
}

// ─────────────────────────────────────────────────────────────────────────
// FILTER PARAMS
// ─────────────────────────────────────────────────────────────────────────

export interface OrderFilterParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  order_type?: OrderType;
  payment_status?: PaymentStatus;
  search?: string;
}
