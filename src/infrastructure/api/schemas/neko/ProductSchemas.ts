/**
 * ============================================================================
 * PRODUCT SCHEMAS - Xác thực bằng Zod + Factory tạo dữ liệu test
 * ============================================================================
 *
 * Sử dụng interfaces từ product.interface.ts làm nguồn sự thật duy nhất.
 * Zod schemas được dùng cho:
 * 1. Xác thực response API lúc runtime (parse & validate)
 * 2. Cung cấp giá trị mặc định để tạo dữ liệu test (factory pattern)
 *
 * @example
 * // Tạo dữ liệu test với giá trị mặc định
 * const data = ProductSchemas.createBean({ origin: 'Ethiopia' });
 *
 * // Xác thực response API
 * const validated = ProductSchemas.Product.parse(apiResponse);
 */

import { z } from 'zod';
import {
  Product,
  ProductCreate,
  ProductType,
  UnitType,
  RoastLevel,
  FlavorProfile,
  BeanSpecifications,
  EquipmentSpecifications,
  PaginatedResponse,
  Pagination,
} from '@models/neko/product.interface';

// ─────────────────────────────────────────────────────────────────────────────
// ENUM SCHEMAS (khớp với kiểu trong interface)
// ─────────────────────────────────────────────────────────────────────────────

/** Loại sản phẩm: hạt cà phê, thiết bị, phụ kiện */
const ProductTypeSchema = z.enum(['bean', 'equipment', 'accessory']);

/** Đơn vị tính: kg, cái, hộp */
const UnitTypeSchema = z.enum(['kg', 'piece', 'box']);

/** Mức độ rang: Nhẹ, Trung bình, Đậm */
const RoastLevelSchema = z.enum(['Light', 'Medium', 'Dark']);

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA LỒNG NHAU (khớp với cấu trúc interface)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hồ sơ hương vị cà phê
 * Các chỉ số từ 0-10 đánh giá đặc tính hương vị
 */
const FlavorProfileSchema: z.ZodType<FlavorProfile> = z.object({
  acidity: z.number(),    // Độ chua
  bitterness: z.number(), // Độ đắng
  sweetness: z.number(),  // Độ ngọt
  floral: z.number(),     // Hương hoa
  notes: z.array(z.string()), // Ghi chú hương vị: ['Chocolate', 'Nutty']
});

/**
 * Thông số kỹ thuật cho hạt cà phê
 */
const BeanSpecificationsSchema: z.ZodType<BeanSpecifications> = z.object({
  region: z.string(),       // Vùng trồng: 'Đà Lạt', 'Ethiopia'
  altitude: z.string(),     // Độ cao: '1500m'
  processing: z.string(),   // Phương pháp chế biến: 'Washed', 'Natural'
  grade: z.string().optional(), // Phân loại chất lượng
  flavor_profile: FlavorProfileSchema.optional(), // Hồ sơ hương vị
  grind_options: z.array(z.string()).optional(),   // Tùy chọn xay: ['whole', 'filter']
  weight_options: z.array(z.number()).optional(),  // Tùy chọn trọng lượng (gram): [100, 250, 500]
  brewing_guide: z.object({
    temperature: z.string(), // Nhiệt độ pha: '92-96°C'
    ratio: z.string(),       // Tỷ lệ: '1:15'
    time: z.string(),        // Thời gian: '3-4 phút'
    method: z.string(),      // Phương pháp: 'Pour Over'
  }).optional(),
  story: z.string().optional(), // Câu chuyện sản phẩm
});

/**
 * Thông số kỹ thuật cho thiết bị
 */
const EquipmentSpecificationsSchema: z.ZodType<EquipmentSpecifications> = z.object({
  brand: z.string(),                              // Thương hiệu
  model: z.string(),                              // Model
  power: z.string().optional(),                   // Công suất: '1200W'
  voltage: z.string().optional(),                 // Điện áp: '220V'
  capacity: z.string().optional(),                // Dung tích: '1.8L'
  pressure: z.string().optional(),                // Áp suất: '15 bar'
  dimensions: z.string().optional(),              // Kích thước: '30x20x40cm'
  weight: z.string().optional(),                  // Trọng lượng: '5kg'
  features: z.array(z.string()).optional(),       // Tính năng đặc biệt
  includes: z.array(z.string()).optional(),       // Phụ kiện đi kèm
  color_options: z.array(z.string()).optional(),  // Màu sắc có sẵn
});

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA TẠO SẢN PHẨM (có giá trị mặc định cho factory)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schema để tạo sản phẩm mới
 * Các trường có .default() sẽ tự điền khi không truyền giá trị
 */
const ProductCreateSchema: z.ZodType<ProductCreate> = z.object({
  name: z.string().default(() => `Test Product ${Date.now()}`), // Tên mặc định có timestamp
  type: ProductTypeSchema.default('bean'),                      // Mặc định: hạt cà phê
  price_per_unit: z.number().default(100000),                   // Giá mặc định: 100,000 VNĐ
  unit_type: UnitTypeSchema.optional(),                         // Đơn vị (tùy chọn)
  origin: z.string().optional(),                                // Xuất xứ (tùy chọn)
  description: z.string().optional(),                           // Mô tả (tùy chọn)
  roast_level: RoastLevelSchema.optional(),                     // Mức rang (tùy chọn)
  warranty_months: z.number().optional(),                       // Bảo hành (tháng, tùy chọn)
  specifications: z.union([BeanSpecificationsSchema, EquipmentSpecificationsSchema]).optional(),
}) as z.ZodType<ProductCreate>;

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA RESPONSE SẢN PHẨM (dùng để xác thực response API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schema đầy đủ cho sản phẩm trả về từ API
 * Bao gồm cả các trường do server tự tạo (id, created_at, ...)
 */
const ProductSchema: z.ZodType<Product> = z.object({
  id: z.number(),                     // ID sản phẩm (server tạo)
  name: z.string(),                   // Tên sản phẩm
  type: ProductTypeSchema,            // Loại: bean | equipment | accessory
  unit_type: UnitTypeSchema.optional(),
  origin: z.string().nullable().optional(),       // Xuất xứ
  description: z.string().nullable().optional(),  // Mô tả
  roast_level: RoastLevelSchema.nullable().optional(), // Mức rang
  price_per_unit: z.number(),                          // Giá
  warranty_months: z.number().nullable().optional(),   // Bảo hành
  image_url: z.string().nullable().optional(),         // Ảnh chính
  gallery: z.array(z.string()).nullable().optional(),  // Bộ sưu tập ảnh
  specifications: z.union([BeanSpecificationsSchema, EquipmentSpecificationsSchema]).nullable().optional(),
  is_active: z.boolean(),              // Đang bán hay không
  created_at: z.string().optional(),   // Ngày tạo (ISO string)
  updated_at: z.string().optional(),   // Ngày cập nhật (ISO string)
}) as z.ZodType<Product>;

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA PHÂN TRANG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thông tin phân trang
 */
const PaginationSchema: z.ZodType<Pagination> = z.object({
  page: z.number(),         // Trang hiện tại
  limit: z.number(),        // Số item mỗi trang
  total_items: z.number(),  // Tổng số item
  total_pages: z.number(),  // Tổng số trang
  has_next: z.boolean().optional(),  // Có trang tiếp không
  has_prev: z.boolean().optional(),  // Có trang trước không
});

/**
 * Response có phân trang chứa danh sách sản phẩm
 */
const PaginatedProductsSchema: z.ZodType<PaginatedResponse<Product>> = z.object({
  data: z.array(ProductSchema),       // Mảng sản phẩm
  pagination: PaginationSchema,       // Thông tin phân trang
});

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY - Tạo dữ liệu test với giá trị mặc định
// ─────────────────────────────────────────────────────────────────────────────

export const ProductSchemas = {
  // Schemas dùng để xác thực
  Product: ProductSchema,
  ProductCreate: ProductCreateSchema,
  PaginatedProducts: PaginatedProductsSchema,

  /**
   * Tạo dữ liệu sản phẩm hạt cà phê với giá trị mặc định
   * @example ProductSchemas.createBean({ origin: 'Ethiopia' })
   */
  createBean: (overrides?: Partial<ProductCreate>): ProductCreate => {
    return ProductCreateSchema.parse({
      type: 'bean',
      unit_type: 'kg',
      ...overrides,
    });
  },

  /**
   * Tạo dữ liệu sản phẩm thiết bị với giá trị mặc định
   * @example ProductSchemas.createEquipment({ warranty_months: 24 })
   */
  createEquipment: (overrides?: Partial<ProductCreate>): ProductCreate => {
    return ProductCreateSchema.parse({
      type: 'equipment',
      unit_type: 'piece',
      warranty_months: 12,
      ...overrides,
    });
  },

  /**
   * Tạo dữ liệu sản phẩm phụ kiện với giá trị mặc định
   */
  createAccessory: (overrides?: Partial<ProductCreate>): ProductCreate => {
    return ProductCreateSchema.parse({
      type: 'accessory',
      unit_type: 'piece',
      ...overrides,
    });
  },

  /**
   * Tạo dữ liệu hạt cà phê đầy đủ (kèm specifications chi tiết)
   * Phù hợp cho test case cần dữ liệu hoàn chỉnh
   */
  createFullBean: (overrides?: Partial<ProductCreate>): ProductCreate => {
    return ProductCreateSchema.parse({
      type: 'bean',
      unit_type: 'kg',
      origin: 'Vietnam',
      roast_level: 'Medium',
      specifications: {
        region: 'Đà Lạt',
        altitude: '1500m',
        processing: 'Washed',
        flavor_profile: {
          acidity: 6.0,
          bitterness: 5.0,
          sweetness: 7.0,
          floral: 4.0,
          notes: ['Chocolate', 'Nutty'],
        },
        grind_options: ['whole', 'filter'],
        weight_options: [100, 250, 500],
      },
      ...overrides,
    });
  },
};

// Xuất lại types từ interface (nguồn sự thật duy nhất)
export type { Product, ProductCreate, ProductType, UnitType, RoastLevel };
