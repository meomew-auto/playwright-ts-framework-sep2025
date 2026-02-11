/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO COFFEE — DANH SÁCH SẢN PHẨM (UI TESTS)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tính năng: Trang danh sách sản phẩm công khai
 * URL: https://coffee.autoneko.com/products
 * Loại: Chỉ đọc (read-only) — không thay đổi dữ liệu
 */

import { test, expect } from '@fixtures/neko/unified.fixture';

test.describe('Danh sách sản phẩm @read @smoke', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.expectOnPage();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 📍 KIỂM TRA TẢI TRANG
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC_01: Hiển thị tiêu đề trang khi tải xong', async ({ productsPage }) => {
    await expect(productsPage.element('pageTitle')).toBeVisible();
    await expect(productsPage.element('pageTitle')).toHaveText('Cửa hàng');
  });

  test('TC_02: Hiển thị thẻ sản phẩm khi tải trang', async ({ productsPage }) => {
    const productCount = await productsPage.getProductCount();
    expect(productCount).toBeGreaterThan(0);
  });

  test('TC_03: Hiển thị text đếm số sản phẩm', async ({ productsPage }) => {
    const countText = await productsPage.getProductCountText();
    expect(countText).toMatch(/Hiển thị \d+ sản phẩm/);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 📍 KIỂM TRA THANH ĐIỀU HƯỚNG
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC_04: Hiển thị các mục menu điều hướng', async ({ productsPage }) => {
    await expect(productsPage.element('navHome')).toBeVisible();
    await expect(productsPage.element('navShop')).toBeVisible();
    await expect(productsPage.element('navAbout')).toBeVisible();
    await expect(productsPage.element('navOrderTracking')).toBeVisible();
  });

  test('TC_05: Hiển thị logo trong header', async ({ productsPage }) => {
    await expect(productsPage.element('logo')).toBeVisible();
  });

  test('TC_06: Điều hướng về trang chủ khi click nav home', async ({ productsPage, page }) => {
    await productsPage.clickNavHome();
    await expect(page).toHaveURL('/');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 📍 KIỂM TRA THẺ SẢN PHẨM
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC_07: Hiển thị tên sản phẩm', async ({ productsPage }) => {
    const names = await productsPage.getProductNames();
    expect(names.length).toBeGreaterThan(0);
    names.forEach((name) => {
      expect(name.trim()).not.toBe('');
    });
  });

  test('TC_08: Điều hướng tới chi tiết sản phẩm khi click thẻ', async ({
    productsPage,
    page,
  }) => {
    await productsPage.clickProductByIndex(0);
    await expect(page).toHaveURL(/\/products\/.+/);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 📍 KIỂM TRA FOOTER
  // ═══════════════════════════════════════════════════════════════════════════

  test('TC_09: Hiển thị footer', async ({ productsPage }) => {
    await expect(productsPage.element('footer')).toBeVisible();
  });

  test('TC_10: Hiển thị bản quyền trong footer', async ({ productsPage }) => {
    await expect(productsPage.element('footerCopyright')).toBeVisible();
  });
});

test.describe('Phân trang sản phẩm @read', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.expectOnPage();
  });

  test('TC_11: Kiểm tra phân trang có tồn tại không', async ({ productsPage }) => {
    const hasPagination = await productsPage.hasPagination();
    // Phân trang có thể có hoặc không tùy số lượng sản phẩm
    expect(typeof hasPagination).toBe('boolean');
  });

  test('TC_12: Chuyển trang tiếp theo khi có phân trang', async ({ productsPage, page }) => {
    const hasPagination = await productsPage.hasPagination();
    test.skip(!hasPagination, 'Trang này không có phân trang');
    const initialProducts = await productsPage.getProductNames();
    await productsPage.goToNextPage();

    // Chờ trang cập nhật
    await page.waitForTimeout(500);

    const newProducts = await productsPage.getProductNames();
    // Sản phẩm phải khác sau khi chuyển trang
    expect(newProducts).not.toEqual(initialProducts);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 📍 KIỂM TRA COLLECTION HELPER — Test các method của GridResolver
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Phương thức CollectionHelper cho sản phẩm @read', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.expectOnPage();
  });

  test('TC_13: Lấy giá sản phẩm bằng CollectionHelper', async ({ productsPage }) => {
    const prices = await productsPage.getProductPrices();
    expect(prices.length).toBeGreaterThan(0);
    prices.forEach((price) => {
      // Giá phải có dạng "100.000đ" hoặc chứa số
      expect(price).toMatch(/\d/);
    });
  });

  test('TC_14: Tìm sản phẩm theo tên bằng CollectionHelper', async ({ productsPage }) => {
    // Lấy tất cả tên sản phẩm trước
    const names = await productsPage.getProductNames();
    expect(names.length).toBeGreaterThan(0);

    // Tìm sản phẩm đầu tiên theo tên
    const firstProductName = names[0];
    const productCard = await productsPage.findProductByName(firstProductName);

    await expect(productCard).toBeVisible();
  });

  test('TC_15: Lấy dữ liệu sản phẩm cụ thể', async ({ productsPage }) => {
    // Lấy tên sản phẩm đầu tiên
    const names = await productsPage.getProductNames();
    expect(names.length).toBeGreaterThan(0);

    // Lấy data của sản phẩm đó
    const productData = await productsPage.getProductData(names[0]);

    // Phải có trường name khớp
    expect(productData.name).toBe(names[0]);
    // Phải có trường price
    expect(productData).toHaveProperty('price');
  });

  test('TC_16: Lấy toàn bộ dữ liệu sản phẩm dạng mảng', async ({ productsPage }) => {
    const allData = await productsPage.getAllProductsData();

    expect(allData.length).toBeGreaterThan(0);
    allData.forEach((product) => {
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product.name.trim()).not.toBe('');
    });
  });

  test('TC_17: Tìm sản phẩm bằng regex matcher', async ({ productsPage }) => {
    // Tìm sản phẩm có tên chứa pattern bất kỳ
    const names = await productsPage.getProductNames();
    expect(names.length).toBeGreaterThan(0);

    // Tìm bằng partial match (3 ký tự đầu)
    const searchPattern = names[0].substring(0, 3);
    const productCard = await productsPage.findProductByName(new RegExp(searchPattern));

    await expect(productCard).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 📍 KIỂM TRA TÌM KIẾM XUYÊN TRANG — Test tìm sản phẩm qua nhiều trang
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Tìm kiếm sản phẩm xuyên trang @read', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.expectOnPage();
  });

  test('TC_18: Lấy tổng số trang', async ({ productsPage }) => {
    const totalPages = await productsPage.getTotalPages();
    console.log(`Tổng số trang: ${totalPages}`);
    expect(totalPages).toBeGreaterThanOrEqual(1);
  });

  test('TC_19: Tìm sản phẩm ở trang đầu tiên', async ({ productsPage }) => {
    // Lấy tên sản phẩm từ trang đầu
    const names = await productsPage.getProductNames();
    test.skip(names.length === 0, 'Không có sản phẩm ở trang đầu');

    // Tìm bằng tìm kiếm xuyên trang (phải tìm thấy ở trang 1)
    const { item, pageNumber } = await productsPage.findProductByNameAcrossPages(names[0]);

    await expect(item).toBeVisible();
    expect(pageNumber).toBe(1);
  });

  test('TC_20: Tìm sản phẩm xuyên nhiều trang', async ({ productsPage }) => {
    const hasPagination = await productsPage.hasPagination();
    test.skip(!hasPagination, 'Không có phân trang để test');

    // Lấy tổng số trang và đi tới trang cuối
    const totalPages = await productsPage.getTotalPages();
    test.skip(totalPages < 2, 'Cần ít nhất 2 trang để test');

    // Đi tới trang cuối và lấy tên sản phẩm
    await productsPage.goToPage(totalPages);
    const lastPageProducts = await productsPage.getProductNames();
    test.skip(lastPageProducts.length === 0, 'Không có sản phẩm ở trang cuối');

    const productToFind = lastPageProducts[0];

    // Quay về trang đầu
    await productsPage.goToFirstPage();

    // Tìm sản phẩm — phải duyệt qua tất cả các trang
    const { item, pageNumber } = await productsPage.findProductByNameAcrossPages(productToFind);

    await expect(item).toBeVisible();
    expect(pageNumber).toBe(totalPages);
    console.log(`Tìm thấy "${productToFind}" ở trang ${pageNumber}`);
  });

  test('TC_21: Tìm sản phẩm xuyên trang với auto-detection', async ({ productsPage }) => {
    // Method tự xử lý: về trang đầu, detect tổng trang, tìm qua tất cả
    const { item, pageNumber } = await productsPage.findProductByNameAcrossPages('Kalita Wave 185 Dripper');

    await expect(item).toBeVisible();
    console.log(`✅ Tìm thấy sản phẩm ở trang ${pageNumber}`);
    await item.click();
  });
});
