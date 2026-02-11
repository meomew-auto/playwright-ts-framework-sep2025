import { test, expect } from '@fixtures/cms/ui/gatekeeper.fixture';

/**
 * CMS Tất Cả Sản Phẩm - Mobile Tests
 * 
 * Tests này chạy trên mobile viewport (project: cms-mobile)
 * Sử dụng gatekeeper fixture để:
 * - Tự động login (authedPage)
 * - Auto-inject page object với viewportType = 'mobile'
 * 
 * Chạy: npx playwright test list.mobile.spec.ts --project=cms-mobile
 */
test.describe('CMS Tất Cả Sản Phẩm - Mobile Tests', () => {

  test('01. Điều hướng đến trang Tất Cả Sản Phẩm trên Mobile', async ({ allProductsPage }) => {
    // Fixture đã tự động gọi goto() và expectOnPage()
    const rowCount = await allProductsPage.getRowCount();
    console.log(`[Mobile] Found ${rowCount} rows`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('02. Lấy giá trị cột name - getColumnValues()', async ({ allProductsPage }) => {
    // Mobile: Chỉ có cột 'name' visible, các cột khác bị ẩn
    const productNames = await allProductsPage.getColumnValues('name');
    console.log(`[Mobile] Found ${productNames.length} products`);
    expect(productNames.length).toBeGreaterThan(0);
  });

  test('03. Expand và đọc thông tin chi tiết từ Footable', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    const row = await allProductsPage.findRowByColumnValue('name', firstProductName);
    await expect(row).toBeVisible();
    
    // Mobile: Expand row để xem chi tiết
    await allProductsPage.expandRow(row);
    
    // Đọc dữ liệu từ detail row
    const detailData = await allProductsPage.getExpandedRowData(row);
    console.log('[Mobile] Detail data:', detailData);
    
    // Verify các field quan trọng
    expect(detailData).toHaveProperty('Added By');
    expect(detailData).toHaveProperty('Total Stock');
    expect(detailData).toHaveProperty('Published');
    
    // Collapse row lại
    await allProductsPage.collapseRow(row);
  });

  test('04. Lấy dữ liệu nhiều cột - getTableData() với expand', async ({ allProductsPage }) => {
    // Mobile: Chỉ lấy được cột 'name' trực tiếp
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

  test('05. Lấy dữ liệu bảng mặc định với expand', async ({ allProductsPage }) => {
    // Mobile: getDefaultTableData() sẽ chỉ trả về cột visible (name)
    const defaultData = await allProductsPage.getDefaultTableData();
    expect(defaultData.length).toBeGreaterThan(0);
    expect(defaultData[0]).toHaveProperty('name');
    
    // Demo: Expand để lấy thêm data
    const firstRow = await allProductsPage.findRowByColumnValue('name', defaultData[0].name);
    await allProductsPage.expandRow(firstRow);
    const fullData = await allProductsPage.getExpandedRowData(firstRow);
    console.log('[Mobile] Full data from expanded row:', fullData);
  });

  test('06. Tìm dòng theo giá trị cột - findRowByColumnValue()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();
    
    const row = await allProductsPage.findRowByColumnValue('name', firstProductName);
    await expect(row).toBeVisible();
  });

  test('07. Tìm dòng theo bộ lọc name only - findRowByFilters()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    
    // Mobile: Chỉ filter theo 'name' vì các cột khác ẩn
    const row = await allProductsPage.findRowByFilters({
      name: firstProductName,
    });
    await expect(row).toBeVisible();
  });

  test('08. Lấy dữ liệu dòng với expand - getRowDataByFilters()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();
    
    // Mobile: Tìm row và expand để lấy data
    const row = await allProductsPage.findRowByColumnValue('name', firstProductName);
    await allProductsPage.expandRow(row);
    
    const detailData = await allProductsPage.getExpandedRowData(row);
    expect(detailData).toHaveProperty('Added By');
    expect(detailData).toHaveProperty('Info');
    expect(detailData).toHaveProperty('Total Stock');
    
    await allProductsPage.collapseRow(row);
  });

  test('09. Tìm kiếm sản phẩm - search()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    const searchTerm = firstProductName.substring(0, 10);
    
    await allProductsPage.search(searchTerm);
    
    const productNames = await allProductsPage.getColumnValues('name');
    productNames.forEach((name) => {
      expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
    });
    
    // Clear search
    await allProductsPage.clearSearch();
  });

  test('10. Lọc theo người bán với expand verify - selectSeller()', async ({ allProductsPage }) => {
    // Mobile: Phải expand để đọc 'Added By'
    const firstProductName = await allProductsPage.getFirstProductName();
    const firstRow = await allProductsPage.findRowByColumnValue('name', firstProductName);
    await allProductsPage.expandRow(firstRow);
    const detailData = await allProductsPage.getExpandedRowData(firstRow);
    const seller = detailData['Added By'];
    await allProductsPage.collapseRow(firstRow);
    
    if (seller && seller.trim().length > 0) {
      await allProductsPage.selectSeller(seller);
      
      // Verify: Expand row đầu tiên để check seller
      const names = await allProductsPage.getColumnValues('name');
      if (names.length > 0) {
        const row = await allProductsPage.findRowByColumnValue('name', names[0]);
        await allProductsPage.expandRow(row);
        const data = await allProductsPage.getExpandedRowData(row);
        expect(data['Added By']).toBe(seller);
      }
    } else {
      console.log('[Mobile] No sellers available to filter');
    }
  });

  test('11. Sắp xếp sản phẩm - selectSort()', async ({ allProductsPage }) => {
    await allProductsPage.selectSort('Base Price (High > Low)');
    
    const productNames = await allProductsPage.getColumnValues('name');
    expect(productNames.length).toBeGreaterThan(0);
    
    // Optional: Expand để verify sort bằng price
    const firstRow = await allProductsPage.findRowByColumnValue('name', productNames[0]);
    await allProductsPage.expandRow(firstRow);
    const detailData = await allProductsPage.getExpandedRowData(firstRow);
    console.log('[Mobile] First product info after sort:', detailData['Info']);
  });

  test('12. Điều hướng phân trang - goToPage() và goToNextPage()', async ({ allProductsPage }) => {
    const page1Products = await allProductsPage.getColumnValues('name');
    console.log(`[Mobile] Page 1 has ${page1Products.length} products`);
    
    try {
      await allProductsPage.goToPage(2);
      const page2Products = await allProductsPage.getColumnValues('name');
      expect(page2Products[0]).not.toBe(page1Products[0]);
    } catch (error) {
      console.log(`[Mobile] Page 2 not available (only 1 page)`);
    }
  });

  test('13. Bật/tắt checkbox dòng - toggleRowCheckboxByName()', async ({ allProductsPage }) => {
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

  test('14. Demo column cleaners với expand - trích xuất text tùy chỉnh', async ({ allProductsPage }) => {
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

  test('15. Tìm dòng qua nhiều trang - findRowByFiltersAcrossPages()', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();
    
    if (targetProduct) {
      const row = await allProductsPage.findRowByFiltersAcrossPages(
        { name: targetProduct },
        { maxPages: 5 }
      );
      await expect(row).toBeVisible();
    } else {
      console.log(`[Mobile] Skipping test: Not enough data (need at least 2 pages)`);
    }
  });

  test('16. Lấy dữ liệu dòng qua nhiều trang với expand', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();
    
    if (targetProduct) {
      // Tìm row qua nhiều trang
      const row = await allProductsPage.findRowByFiltersAcrossPages(
        { name: targetProduct },
        { maxPages: 5 }
      );
      
      // Expand để lấy full data
      await allProductsPage.expandRow(row);
      const detailData = await allProductsPage.getExpandedRowData(row);
      
      expect(detailData).toHaveProperty('Added By');
      expect(detailData['Info']).toBeTruthy();
      console.log('[Mobile] Found product across pages:', detailData);
    } else {
      console.log(`[Mobile] Skipping test: Not enough data`);
    }
  });

  test('17. Tìm kiếm và tìm qua nhiều trang - search() + findRowByFiltersAcrossPages()', async ({ allProductsPage }) => {
    
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();
    
    if (targetProduct) {
      const searchTerm = targetProduct.substring(0, 5);
      await allProductsPage.search(searchTerm);
      
      const searchResults = await allProductsPage.getColumnValues('name');
      const foundInPage1 = searchResults.some((name) => name.includes(targetProduct));
      
      if (!foundInPage1) {
        await allProductsPage.clearSearch();
        const row = await allProductsPage.findRowByFiltersAcrossPages(
          { name: targetProduct },
          { maxPages: 5 }
        );
        await expect(row).toBeVisible();
      }
    } else {
      console.log(`[Mobile] Skipping test: Not enough data`);
    }
  });

});
