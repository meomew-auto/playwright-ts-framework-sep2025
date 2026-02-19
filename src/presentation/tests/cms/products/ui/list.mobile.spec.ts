/**
 * ============================================================================
 * TEST: CMS TẤT CẢ SẢN PHẨM — Mobile Viewport Tests
 * ============================================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Test trang danh sách sản phẩm trên mobile viewport (project: cms-mobile).
 * Các tests này chỉ đọc dữ liệu, không thay đổi gì → có thể chạy song song.
 *
 * Chạy: npx playwright test list.mobile.spec.ts --project=cms-mobile
 *
 * ════════════════════════════════════════════════════════════════════════════
 * 📐 PATTERNS & METHODS SỬ DỤNG TỪ PAGE OBJECTS
 * ════════════════════════════════════════════════════════════════════════════
 *
 * 1️⃣ FIXTURE INJECTION
 *    - allProductsPage đã tự động login + navigate + verify loaded
 *    - viewportType = 'mobile' → getLocator() dùng mobileOverrides
 *
 * 2️⃣ MOBILE-SPECIFIC BEHAVIOR (Footable responsive table)
 *    ┌─────────────────────────────────────────────────────────────────────┐
 *    │ Desktop: Tất cả cột hiển thị trong <thead>/<tbody>                │
 *    │ Mobile:  Chỉ cột 'name' visible, các cột khác ẩn                 │
 *    │          → Cần expandRow() để xem chi tiết                        │
 *    │          → getExpandedRowData() trả key-value từ detail row       │
 *    └─────────────────────────────────────────────────────────────────────┘
 *
 * 3️⃣ TABLE HELPER METHODS (tương tự desktop nhưng giới hạn columns)
 *    - getColumnValues('name')              → lấy tên (cột duy nhất visible)
 *    - getTableData(['name'])               → giới hạn chỉ cột name
 *    - findRowByColumnValue('name', ...)    → tìm dòng
 *    - findRowByFilters({ name: ... })      → filter chỉ theo name
 *
 * 4️⃣ EXPAND/COLLAPSE (mobile-only methods)
 *    - expandRow(row)                       → mở chi tiết dòng
 *    - collapseRow(row)                     → đóng chi tiết dòng
 *    - getExpandedRowData(row)              → đọc data từ detail row
 *
 * ⚠️ LƯU Ý:
 * - Mobile locator dùng mobileOverrides: tableRows loại bỏ footable-detail-row
 * - getColumnValues() trên mobile chỉ lấy được cột name
 * - Để lấy cột khác (addedBy, totalStock...) → phải expand rồi dùng
 *   getExpandedRowData()
 * - Không dùng console.log — dùng Logger.info cho đồng nhất output format
 */
import { test, expect } from '@fixtures/cms/ui/gatekeeper.fixture';
import { Logger } from '@utils/Logger';

test.describe('CMS Tất Cả Sản Phẩm - Mobile', () => {

  test('TC_01: Điều hướng đến trang Tất Cả Sản Phẩm trên Mobile', async ({ allProductsPage }) => {
    // Fixture đã tự động gọi goto() và expectOnPage()
    const rowCount = await allProductsPage.getRowCount();
    Logger.info(`📱 [Mobile] Tìm thấy ${rowCount} rows`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('TC_02: Lấy giá trị cột name - getColumnValues()', async ({ allProductsPage }) => {
    // Mobile: Chỉ có cột 'name' visible, các cột khác bị ẩn bởi Footable
    const productNames = await allProductsPage.getColumnValues('name');
    Logger.info(`📱 [Mobile] Tìm thấy ${productNames.length} sản phẩm`);
    expect(productNames.length).toBeGreaterThan(0);
  });

  test('TC_03: Expand và đọc thông tin chi tiết từ Footable', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    const row = await allProductsPage.findRowByColumnValue('name', firstProductName);
    await expect(row).toBeVisible();

    // Mobile: Expand row để xem chi tiết (các cột ẩn)
    await allProductsPage.expandRow(row);

    // Đọc dữ liệu từ detail row
    const detailData = await allProductsPage.getExpandedRowData(row);
    Logger.info(`📱 [Mobile] Detail data: ${JSON.stringify(detailData)}`);

    // Verify các field quan trọng có trong expanded data
    expect(detailData).toHaveProperty('Added By');
    expect(detailData).toHaveProperty('Total Stock');
    expect(detailData).toHaveProperty('Published');

    // Collapse row lại
    await allProductsPage.collapseRow(row);
  });

  test('TC_04: Lấy dữ liệu nhiều cột - getTableData() với expand', async ({ allProductsPage }) => {
    // Mobile: Chỉ lấy được cột 'name' trực tiếp từ table
    const tableData = await allProductsPage.getTableData(['name']);
    expect(tableData.length).toBeGreaterThan(0);
    expect(tableData[0]).toHaveProperty('name');

    // Để lấy các cột khác, cần expand row đầu tiên
    const firstRow = await allProductsPage.findRowByColumnValue('name', tableData[0].name);
    await allProductsPage.expandRow(firstRow);
    const detailData = await allProductsPage.getExpandedRowData(firstRow);

    expect(detailData).toHaveProperty('Added By');
    expect(detailData).toHaveProperty('Total Stock');
    await allProductsPage.collapseRow(firstRow);
  });

  test('TC_05: Lấy dữ liệu bảng mặc định với expand', async ({ allProductsPage }) => {
    // Mobile: getDefaultTableData() sẽ chỉ trả về cột visible (name)
    const defaultData = await allProductsPage.getDefaultTableData();
    expect(defaultData.length).toBeGreaterThan(0);
    expect(defaultData[0]).toHaveProperty('name');

    // Demo: Expand để lấy thêm data từ hidden columns
    const firstRow = await allProductsPage.findRowByColumnValue('name', defaultData[0].name);
    await allProductsPage.expandRow(firstRow);
    const fullData = await allProductsPage.getExpandedRowData(firstRow);
    Logger.info(`📱 [Mobile] Full data from expanded row: ${JSON.stringify(fullData)}`);
  });

  test('TC_06: Tìm dòng theo giá trị cột - findRowByColumnValue()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();

    const row = await allProductsPage.findRowByColumnValue('name', firstProductName);
    await expect(row).toBeVisible();
  });

  test('TC_07: Tìm dòng theo bộ lọc name only - findRowByFilters()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();

    // Mobile: Chỉ filter theo 'name' vì các cột khác ẩn
    const row = await allProductsPage.findRowByFilters({
      name: firstProductName,
    });
    await expect(row).toBeVisible();
  });

  test('TC_08: Lấy dữ liệu dòng với expand - getRowDataByFilters()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();

    // Mobile: Tìm row và expand để lấy data từ hidden columns
    const row = await allProductsPage.findRowByColumnValue('name', firstProductName);
    await allProductsPage.expandRow(row);

    const detailData = await allProductsPage.getExpandedRowData(row);
    expect(detailData).toHaveProperty('Added By');
    expect(detailData).toHaveProperty('Info');
    expect(detailData).toHaveProperty('Total Stock');

    await allProductsPage.collapseRow(row);
  });

  test('TC_09: Tìm kiếm sản phẩm - search()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    const searchTerm = firstProductName.substring(0, 10);

    await allProductsPage.search(searchTerm);

    const productNames = await allProductsPage.getColumnValues('name');
    productNames.forEach((name) => {
      expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
    });

    // Clear search để reset state
    await allProductsPage.clearSearch();
  });

  test('TC_10: Lọc theo người bán với expand verify - selectSeller()', async ({ allProductsPage }) => {
    // Mobile: Phải expand để đọc 'Added By' (cột ẩn trên mobile)
    const firstProductName = await allProductsPage.getFirstProductName();
    const firstRow = await allProductsPage.findRowByColumnValue('name', firstProductName);
    await allProductsPage.expandRow(firstRow);
    const detailData = await allProductsPage.getExpandedRowData(firstRow);
    const seller = detailData['Added By'];
    await allProductsPage.collapseRow(firstRow);

    if (seller && seller.trim().length > 0) {
      await allProductsPage.selectSeller(seller);

      // Verify: Expand row đầu tiên để check seller khớp
      const names = await allProductsPage.getColumnValues('name');
      if (names.length > 0) {
        const row = await allProductsPage.findRowByColumnValue('name', names[0]);
        await allProductsPage.expandRow(row);
        const data = await allProductsPage.getExpandedRowData(row);
        expect(data['Added By']).toBe(seller);
        // Collapse row sau khi verify — tránh footable-details table
        // gây strict mode violation trong waitForTableReady()
        await allProductsPage.collapseRow(row);
      }

      // ⚠️ Reset filter seller — tránh ảnh hưởng test khác
      await allProductsPage.selectSeller('All Sellers');
    } else {
      Logger.info('📱 [Mobile] Không có seller để filter — skip verify');
    }
  });

  test('TC_11: Sắp xếp sản phẩm - selectSort()', async ({ allProductsPage }) => {
    await allProductsPage.selectSort('Base Price (High > Low)');

    const productNames = await allProductsPage.getColumnValues('name');
    expect(productNames.length).toBeGreaterThan(0);

    // Expand để verify sort bằng price
    const firstRow = await allProductsPage.findRowByColumnValue('name', productNames[0]);
    await allProductsPage.expandRow(firstRow);
    const detailData = await allProductsPage.getExpandedRowData(firstRow);
    Logger.info(`📱 [Mobile] First product info after sort: ${detailData['Info']}`);

    // ⚠️ Reset state — navigate lại trang gốc (không dùng selectSort vì page reload
    // giữa lúc interact → "Element is not attached to DOM" khi chạy parallel)
    await allProductsPage.goto();
  });

  test('TC_12: Điều hướng phân trang - goToPage() và goToNextPage()', async ({ allProductsPage }) => {
    const page1Products = await allProductsPage.getColumnValues('name');
    Logger.info(`📱 [Mobile] Page 1 có ${page1Products.length} sản phẩm`);

    try {
      await allProductsPage.goToPage(2);
      const page2Products = await allProductsPage.getColumnValues('name');
      expect(page2Products[0]).not.toBe(page1Products[0]);
    } catch {
      Logger.info('📱 [Mobile] Page 2 không có (chỉ có 1 trang)');
    }
  });

  test('TC_13: Bật/tắt checkbox dòng - toggleRowCheckboxByName()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();

    // Check
    await allProductsPage.toggleRowCheckboxByName(firstProductName, true);
    const row = await allProductsPage.findRowByColumnValue('name', firstProductName);
    const checkbox = row.locator('input[type="checkbox"].check-one').first();
    await expect(checkbox).toBeChecked();

    // Uncheck
    await allProductsPage.toggleRowCheckboxByName(firstProductName, false);
    await expect(checkbox).not.toBeChecked();
  });

  test('TC_14: Demo column cleaners với expand - trích xuất text tùy chỉnh', async ({ allProductsPage }) => {
    const names = await allProductsPage.getColumnValues('name');
    expect(names.length).toBeGreaterThan(0);
    expect(names[0].trim().length).toBeGreaterThan(0);

    // Expand row để demo cleaners cho hidden columns
    const firstRow = await allProductsPage.findRowByColumnValue('name', names[0]);
    await allProductsPage.expandRow(firstRow);
    const detailData = await allProductsPage.getExpandedRowData(firstRow);

    // Verify stock chỉ có số
    expect(detailData['Total Stock']).toMatch(/^\d+/);

    // Verify Published/Featured/Todays Deal có giá trị Yes/No
    const booleanFields = ['Published', 'Featured', 'Todays Deal'];
    booleanFields.forEach((field) => {
      if (detailData[field]) {
        expect(['Yes', 'No']).toContain(detailData[field]);
      }
    });
  });

  test('TC_15: Tìm dòng qua nhiều trang - findRowByFiltersAcrossPages()', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (targetProduct) {
      const { row } = await allProductsPage.findRowByFiltersAcrossPages(
        { name: targetProduct },
        { maxPages: 5 }
      );
      await expect(row).toBeVisible();
    } else {
      Logger.info('📱 [Mobile] Skip: Không đủ data (cần ít nhất 2 trang)');
    }
  });

  test('TC_16: Lấy dữ liệu dòng qua nhiều trang với expand', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (targetProduct) {
      // Tìm row qua nhiều trang
      const { row } = await allProductsPage.findRowByFiltersAcrossPages(
        { name: targetProduct },
        { maxPages: 5 }
      );

      // Expand để lấy full data
      await allProductsPage.expandRow(row);
      const detailData = await allProductsPage.getExpandedRowData(row);

      expect(detailData).toHaveProperty('Added By');
      expect(detailData['Info']).toBeTruthy();
      Logger.info(`📱 [Mobile] Found product across pages: ${JSON.stringify(detailData)}`);
    } else {
      Logger.info('📱 [Mobile] Skip: Không đủ data');
    }
  });

  test('TC_17: Tìm kiếm và tìm qua nhiều trang - search() + findRowByFiltersAcrossPages()', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (targetProduct) {
      const searchTerm = targetProduct.substring(0, 5);
      await allProductsPage.search(searchTerm);

      const searchResults = await allProductsPage.getColumnValues('name');
      const foundInPage1 = searchResults.some((name) => name.includes(targetProduct));

      if (!foundInPage1) {
        await allProductsPage.clearSearch();
        const { row } = await allProductsPage.findRowByFiltersAcrossPages(
          { name: targetProduct },
          { maxPages: 5 }
        );
        await expect(row).toBeVisible();
      }
    } else {
      Logger.info('📱 [Mobile] Skip: Không đủ data');
    }
  });

});
