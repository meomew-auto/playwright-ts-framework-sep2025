/**
 * ============================================================================
 * NEKO ERROR SCHEMAS — Zod runtime validation cho error responses
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Validate error responses từ Neko Coffee API trong negative test cases.
 * File này là "nguồn sự thật duy nhất" cho cả schema lẫn TypeScript types.
 *
 * 📌 ZOD LÀ SINGLE SOURCE OF TRUTH:
 * - Zod schema → dùng để validate runtime (parse/safeParse)
 * - z.infer<> → suy ra TypeScript type tự động
 * - KHÔNG cần file interface riêng (đã xóa error.interface.ts)
 *
 * 📚 NEKO API TRẢ VỀ 2 LOẠI ERROR:
 * 1. Standard error (401, 403, 404, 500): { status, code, message }
 * 2. Validation error (400, 422 - FastAPI): { detail: [...] | string }
 *
 * 🔗 LIÊN KẾT:
 * - KHÔNG liên kết với CommonErrorSchemas.ts (hệ thống error riêng biệt)
 * - Dùng bởi: presentation/tests/neko/ (negative tests)
 *
 * @example
 * const error = ErrorSchemas.ValidationError.parse(await response.json());
 * expect(error.detail).toBeDefined();
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// LỖI VALIDATION ĐƠN LẺ (lỗi của một trường cụ thể)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Một mục lỗi validation đơn lẻ từ FastAPI
 *
 * - loc: Vị trí trường bị lỗi, ví dụ ['body', 'name']
 * - msg: Thông báo lỗi, ví dụ 'field required'
 * - type: Loại lỗi, ví dụ 'value_error.missing'
 */
const ValidationErrorItemSchema = z.object({
  loc: z.array(z.union([z.string(), z.number()])),
  msg: z.string(),
  type: z.string(),
});

// ─────────────────────────────────────────────────────────────────────────────
// LỖI VALIDATION (400/422 - thiếu hoặc sai trường)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Response lỗi validation từ FastAPI
 * detail có thể là:
 * - Mảng các ValidationErrorItem (lỗi chi tiết từng trường)
 * - Chuỗi đơn giản (lỗi tổng quát, ví dụ "Not authenticated")
 */
const ValidationErrorSchema = z.object({
  detail: z.union([
    z.array(ValidationErrorItemSchema),
    z.string(),
  ]),
});

// ─────────────────────────────────────────────────────────────────────────────
// LỖI API CHUẨN (401, 403, 404, 500, v.v.)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lỗi API thông thường — format cố định { status, code, message }
 */
const ApiErrorSchema = z.object({
  status: z.number(),
  code: z.string(),
  message: z.string(),
});

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA TỔNG HỢP (chấp nhận cả hai định dạng lỗi)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Union schema — dùng khi không biết API trả về format lỗi nào
 */
const AnyErrorSchema = z.union([ValidationErrorSchema, ApiErrorSchema]);

// ─────────────────────────────────────────────────────────────────────────────
// XUẤT SCHEMAS + HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const ErrorSchemas = {
  // Schemas đơn lẻ
  ApiError: ApiErrorSchema,
  ValidationError: ValidationErrorSchema,
  ValidationErrorItem: ValidationErrorItemSchema,

  // Schema tổng hợp
  AnyError: AnyErrorSchema,

  /** Kiểm tra lỗi có phải validation error không */
  isValidationError: (error: unknown): error is ValidationError => {
    return ValidationErrorSchema.safeParse(error).success;
  },

  /** Kiểm tra lỗi có phải API error chuẩn không */
  isApiError: (error: unknown): error is ApiError => {
    return ApiErrorSchema.safeParse(error).success;
  },

  /**
   * Trích xuất thông báo lỗi từ bất kỳ format nào
   * - ValidationError → mảng "loc: msg"
   * - ApiError → mảng chứa message
   * - Không nhận diện → ['Unknown error format']
   */
  getErrorMessages: (error: unknown): string[] => {
    const validationResult = ValidationErrorSchema.safeParse(error);
    if (validationResult.success) {
      const { detail } = validationResult.data;
      if (typeof detail === 'string') return [detail];
      return detail.map(item => `${item.loc.join('.')}: ${item.msg}`);
    }

    const apiResult = ApiErrorSchema.safeParse(error);
    if (apiResult.success) {
      return [apiResult.data.message];
    }

    return ['Unknown error format'];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — suy ra từ Zod schemas (z.infer)
// ─────────────────────────────────────────────────────────────────────────────

/** Lỗi validation đơn lẻ: { loc, msg, type } */
export type ValidationErrorItem = z.infer<typeof ValidationErrorItemSchema>;

/** Lỗi validation: { detail: ValidationErrorItem[] | string } */
export type ValidationError = z.infer<typeof ValidationErrorSchema>;

/** Lỗi API chuẩn: { status, code, message } */
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Union tất cả loại lỗi */
export type ApiErrorResponse = ApiError | ValidationError;

/** Alias — dùng bởi ProductService */
export type AnyError = ApiErrorResponse;
