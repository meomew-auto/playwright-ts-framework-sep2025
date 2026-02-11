/**
 * ============================================================================
 * COMMON ERROR SCHEMAS - Các mẫu lỗi API dùng chung
 * ============================================================================
 *
 * Cung cấp các định dạng lỗi phổ biến dùng được cho nhiều project/API:
 * - FastAPI validation errors (framework Python)
 * - RFC 7807 Problem Details (chuẩn quốc tế)
 * - Simple message errors (lỗi đơn giản)
 *
 * Mỗi project có thể:
 * 1. Dùng trực tiếp các schema này
 * 2. Mở rộng thêm trường riêng của project
 * 3. Tạo schema hoàn toàn mới
 *
 * @example
 * import { CommonErrors } from '@schemas/common/CommonErrorSchemas';
 *
 * // Dùng trực tiếp mẫu FastAPI
 * const error = CommonErrors.FastAPIValidation.parse(response);
 *
 * // Hoặc mở rộng thêm trường trong project
 * const MyError = CommonErrors.FastAPIValidation.extend({
 *   extra_field: z.string(),
 * });
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// LỖI VALIDATION TỪ FASTAPI (Python FastAPI, Pydantic)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Một mục lỗi validation đơn lẻ từ FastAPI
 *
 * - loc: Vị trí trường bị lỗi, ví dụ ['body', 'name']
 * - msg: Thông báo lỗi, ví dụ 'field required'
 * - type: Loại lỗi, ví dụ 'value_error.missing'
 */
export const FastAPIValidationItem = z.object({
  loc: z.array(z.union([z.string(), z.number()])), // Vị trí lỗi: ['body', 'name']
  msg: z.string(),                                  // Thông báo lỗi
  type: z.string(),                                 // Loại lỗi: 'value_error.missing'
});

/**
 * Response lỗi validation từ FastAPI (HTTP 422 Unprocessable Entity)
 * Chứa mảng các mục lỗi chi tiết cho từng trường
 */
export const FastAPIValidation = z.object({
  detail: z.array(FastAPIValidationItem),
});

// ─────────────────────────────────────────────────────────────────────────────
// RFC 7807 PROBLEM DETAILS (Chuẩn quốc tế cho lỗi HTTP API)
// Tham khảo: https://www.rfc-editor.org/rfc/rfc7807
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Định dạng lỗi theo chuẩn RFC 7807
 *
 * - type:     URI định danh loại lỗi
 * - title:    Tóm tắt ngắn gọn (dễ đọc)
 * - status:   Mã HTTP status
 * - detail:   Giải thích chi tiết (dễ đọc)
 * - instance: URI của lần xảy ra lỗi cụ thể
 */
export const ProblemDetails = z.object({
  type: z.string().optional(),      // URI định danh loại lỗi
  title: z.string(),                // Tóm tắt ngắn gọn
  status: z.number(),               // Mã HTTP status
  detail: z.string().optional(),    // Giải thích chi tiết
  instance: z.string().optional(),  // URI xảy ra lỗi
});

// ─────────────────────────────────────────────────────────────────────────────
// LỖI ĐƠN GIẢN (Mẫu phổ biến: { message, code })
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Định dạng lỗi đơn giản nhất, chỉ có message và code
 */
export const SimpleError = z.object({
  message: z.string(),
  code: z.string().optional(),
  status: z.number().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// LỖI DẠNG CHUỖI (detail là string đơn giản)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Định dạng lỗi chỉ chứa trường detail dạng chuỗi
 */
export const DetailStringError = z.object({
  detail: z.string(),
});

// ─────────────────────────────────────────────────────────────────────────────
// XUẤT CHUNG (gom tất cả schemas vào một object)
// ─────────────────────────────────────────────────────────────────────────────

export const CommonErrors = {
  // FastAPI/Pydantic
  FastAPIValidation,
  FastAPIValidationItem,

  // Chuẩn RFC 7807
  ProblemDetails,

  // Mẫu đơn giản
  SimpleError,
  DetailStringError,

  /**
   * Union tất cả các kiểu lỗi phổ biến
   * Dùng khi không biết API trả về định dạng nào
   */
  AnyCommonError: z.union([
    FastAPIValidation,
    ProblemDetails,
    SimpleError,
    DetailStringError,
  ]),
};

// ─────────────────────────────────────────────────────────────────────────────
// XUẤT KIỂU (suy ra từ Zod schema → TypeScript type)
// ─────────────────────────────────────────────────────────────────────────────

export type FastAPIValidationItem = z.infer<typeof FastAPIValidationItem>;
export type FastAPIValidation = z.infer<typeof FastAPIValidation>;
export type ProblemDetails = z.infer<typeof ProblemDetails>;
export type SimpleError = z.infer<typeof SimpleError>;
export type DetailStringError = z.infer<typeof DetailStringError>;
