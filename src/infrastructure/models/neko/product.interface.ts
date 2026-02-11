/**
 * ============================================================================
 * NEKO PRODUCT INTERFACE — Type definitions cho Neko Coffee Products
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Định nghĩa TypeScript types cho tất cả product-related data.
 * Đây là "nguồn sự thật" cho product types — Zod schemas dùng để validate runtime.
 *
 * 📌 POLYMORPHIC SPECIFICATIONS:
 * Neko có nhiều loại sản phẩm (bean, equipment, accessory).
 * Mỗi loại có specifications riêng:
 * - Bean: region, altitude, flavor_profile, brewing_guide
 * - Equipment: brand, model, power, capacity
 * - Accessory: không có specs riêng
 *
 * 📚 CRUD VARIANTS:
 * - Product:       READ — có id, created_at, is_active (server generate)
 * - ProductCreate: CREATE — chỉ có fields client gửi lên
 * - ProductUpdate: UPDATE — giống Create (PUT — thay toàn bộ)
 * - ProductPatch:  PATCH — tất cả optional (chỉ update field cần)
 *
 * 🔗 LIÊN KẾT:
 * - Dùng bởi: schemas/neko/ProductSchemas.ts (Zod validation)
 * - Dùng bởi: api/services/neko/ProductService.ts
 * - Dùng bởi: data/factories/ (test data)
 *
 * Dựa trên API: http://localhost:8080/openapi.json
 */

// ─────────────────────────────────────────────────────────────────────────
// ENUMS / TYPES
// ─────────────────────────────────────────────────────────────────────────

export type ProductType = 'bean' | 'equipment' | 'accessory';
export type UnitType = 'kg' | 'piece' | 'box';
export type RoastLevel = 'Light' | 'Medium' | 'Dark';

// ─────────────────────────────────────────────────────────────────────────
// SPECIFICATIONS (nested objects)
// ─────────────────────────────────────────────────────────────────────────

export interface FlavorProfile {
  acidity: number;
  bitterness: number;
  sweetness: number;
  floral: number;
  notes: string[];
}

export interface BrewingGuide {
  temperature: string;
  ratio: string;
  time: string;
  method: string;
}

export interface BeanSpecifications {
  region: string;             // ✅ REQUIRED - Vùng trồng
  altitude: string;           // ✅ REQUIRED - Độ cao
  processing: string;         // ✅ REQUIRED - Phương pháp sơ chế
  grade?: string;
  flavor_profile?: FlavorProfile;
  grind_options?: string[];
  weight_options?: number[];
  brewing_guide?: BrewingGuide;
  story?: string;
}

export interface EquipmentSpecifications {
  brand: string;              // ✅ REQUIRED - Thương hiệu
  model: string;              // ✅ REQUIRED - Model
  power?: string;
  voltage?: string;
  capacity?: string;
  pressure?: string;
  dimensions?: string;
  weight?: string;
  features?: string[];
  includes?: string[];
  color_options?: string[];
}

// ─────────────────────────────────────────────────────────────────────────
// PRODUCT
// ─────────────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  type: ProductType;
  unit_type?: UnitType;
  origin?: string;                    // Xuất xứ (bean only)
  description?: string;
  roast_level?: RoastLevel;           // Độ rang (bean only)
  price_per_unit: number;
  warranty_months?: number;           // Bảo hành (equipment only)
  image_url?: string;                 // Ảnh bìa
  gallery?: string[];                 // Ảnh chi tiết (max 5)
  specifications?: BeanSpecifications | EquipmentSpecifications;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// PRODUCT CREATE / UPDATE
// ─────────────────────────────────────────────────────────────────────────

export interface ProductCreate {
  name: string;
  type: ProductType;
  price_per_unit: number;
  unit_type?: UnitType;
  origin?: string;
  description?: string;
  roast_level?: RoastLevel;
  warranty_months?: number;
  specifications?: BeanSpecifications | EquipmentSpecifications;
}

export interface ProductUpdate extends ProductCreate {}

export interface ProductPatch {
  name?: string;
  type?: ProductType;
  price_per_unit?: number;
  unit_type?: UnitType;
  origin?: string;
  description?: string;
  roast_level?: RoastLevel;
  warranty_months?: number;
  specifications?: BeanSpecifications | EquipmentSpecifications;
  is_active?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// PAGINATED RESPONSE
// ─────────────────────────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_next?: boolean;
  has_prev?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ─────────────────────────────────────────────────────────────────────────
// IMAGE UPLOAD RESPONSE
// ─────────────────────────────────────────────────────────────────────────

export interface ImageUploadResponse {
  image_url: string;
  thumbnail_url?: string;
  message?: string;
}
