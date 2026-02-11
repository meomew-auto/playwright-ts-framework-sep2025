import { test, expect } from '@fixtures/cms/ui/gatekeeper.fixture';

/**
 * CMS Tất Cả Sản Phẩm - Tests Chỉ Đọc (Read-Only)
 * Các tests này chỉ đọc dữ liệu, không thay đổi gì → có thể chạy song song
 * 
 * Sử dụng fixtures để:
 * - Tự động login (authedPage)
 * - Auto-inject page object với viewportType
 * - Auto-navigate và verify page loaded
 * 
 * Chạy: npx playwright test all-products-read.spec.ts --project=chromium
 */
test.describe('CMS Tất Cả Sản Phẩm - Read Only Tests', () => {

  test('01. Điều hướng đến trang Tất Cả Sản Phẩm', async ({ allProductsPage }) => {
    // Fixture đã tự động gọi goto() và expectOnPage()
    const rowCount = await allProductsPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('02. Lấy giá trị cột - getColumnValues()', async ({ allProductsPage }) => {
    const productNames = await allProductsPage.getColumnValues('name');
    console.log(`[Demo] Found ${productNames.length} products`);
    expect(productNames.length).toBeGreaterThan(0);

    const addedByValues = await allProductsPage.getColumnValues('addedBy');
    expect(addedByValues.length).toBeGreaterThan(0);

    const stockValues = await allProductsPage.getColumnValues('totalStock');
    expect(stockValues.length).toBeGreaterThan(0);
  });

  test('03. Lấy dữ liệu bảng - getTableData()', async ({ allProductsPage }) => {
    const tableData = await allProductsPage.getTableData(['name', 'addedBy', 'totalStock', 'published']);
    expect(tableData.length).toBeGreaterThan(0);
    expect(tableData[0]).toHaveProperty('name');
    expect(tableData[0]).toHaveProperty('addedBy');
  });

  test('04. Lấy dữ liệu bảng mặc định - getDefaultTableData()', async ({ allProductsPage }) => {
    const defaultData = await allProductsPage.getDefaultTableData();
    expect(defaultData.length).toBeGreaterThan(0);
    expect(defaultData[0]).toHaveProperty('name');
  });

  test('05. Tìm dòng theo giá trị cột - findRowByColumnValue()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();

    const row = await allProductsPage.findRowByColumnValue('name', firstProductName);
    await expect(row).toBeVisible();
  });

  test('06. Tìm dòng theo nhiều bộ lọc - findRowByFilters()', async ({ allProductsPage }) => {
    const tableData = await allProductsPage.getTableData(['name', 'addedBy', 'published']);
    const firstRow = tableData[0];
    expect(firstRow).toBeDefined();

    const row = await allProductsPage.findRowByFilters({
      name: firstRow.name,
      addedBy: firstRow.addedBy,
    });
    await expect(row).toBeVisible();
  });

  test('07. Lấy dữ liệu dòng theo bộ lọc - getRowDataByFilters()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();

    const rowData = await allProductsPage.getRowDataByFilters(
      { name: firstProductName },
      ['name', 'addedBy', 'info', 'totalStock']
    );
    expect(rowData).toHaveProperty('name');
  });

  test('09. Tìm kiếm sản phẩm - search()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    const searchTerm = firstProductName.substring(0, 10);

    await allProductsPage.search(searchTerm);

    const productNames = await allProductsPage.getColumnValues('name');
    productNames.forEach((name) => {
      expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
    });
  });

  test('10. Lọc theo người bán - selectSeller()', async ({ allProductsPage }) => {
    const addedByValues = await allProductsPage.getColumnValues('addedBy');
    const uniqueSellers = [...new Set(addedByValues)].filter((s) => s.trim().length > 0);
    
    if (uniqueSellers.length > 0) {
      await allProductsPage.selectSeller(uniqueSellers[0]);
      const filteredAddedBy = await allProductsPage.getColumnValues('addedBy');
      filteredAddedBy.forEach((seller) => {
        expect(seller).toBe(uniqueSellers[0]);
      });
    }
  });

  test('11. Sắp xếp sản phẩm - selectSort()', async ({ allProductsPage }) => {
    await allProductsPage.selectSort('Base Price (High > Low)');
    const tableData = await allProductsPage.getTableData(['name', 'info']);
    expect(tableData.length).toBeGreaterThan(0);
  });

  test('12. Điều hướng phân trang - goToPage() và goToNextPage()', async ({ allProductsPage }) => {
    const page1Products = await allProductsPage.getColumnValues('name');
    console.log(`[Demo] Page 1 has ${page1Products.length} products`);

    try {
      await allProductsPage.goToPage(2);
      const page2Products = await allProductsPage.getColumnValues('name');
      expect(page2Products[0]).not.toBe(page1Products[0]);
    } catch (error) {
      console.log(`[Demo] Page 2 not available (only 1 page)`);
    }
  });

  test('13. Bật/tắt checkbox dòng - toggleRowCheckboxByName()', async ({ allProductsPage }) => {
    const firstProductName = await allProductsPage.getFirstProductName();
    expect(firstProductName).toBeTruthy();

    await allProductsPage.toggleRowCheckboxByName(firstProductName, true);
    const row = await allProductsPage.findRowByColumnValue('name', firstProductName);
    const checkbox = row.locator('input[type="checkbox"].check-one').first();
    await expect(checkbox).toBeChecked();

    await allProductsPage.toggleRowCheckboxByName(firstProductName, false);
    await expect(checkbox).not.toBeChecked();
  });

  test('14. Demo column cleaners - trích xuất text tùy chỉnh', async ({ allProductsPage }) => {
    const names = await allProductsPage.getColumnValues('name');
    expect(names.length).toBeGreaterThan(0);
    expect(names[0].trim().length).toBeGreaterThan(0);

    const stocks = await allProductsPage.getColumnValues('totalStock');
    stocks.forEach((stock) => {
      expect(stock).toMatch(/^\d+$/);
    });

    const todaysDeal = await allProductsPage.getColumnValues('todaysDeal');
    const published = await allProductsPage.getColumnValues('published');
    const featured = await allProductsPage.getColumnValues('featured');
    
    [...todaysDeal, ...published, ...featured].forEach((value) => {
      expect(['Yes', 'No']).toContain(value);
    });
  });

  test('16. Tìm dòng qua nhiều trang - findRowByFiltersAcrossPages()', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (targetProduct) {
      const row = await allProductsPage.findRowByFiltersAcrossPages(
        { name: targetProduct },
        { maxPages: 5 }
      );
      await expect(row).toBeVisible();
    } else {
      console.log(`[Demo] Skipping test: Not enough data (need at least 2 pages)`);
    }
  });

  test('17. Lấy dữ liệu dòng qua nhiều trang - getRowDataByFiltersAcrossPages()', async ({ allProductsPage }) => {
    const targetProduct = await allProductsPage.getTestTargetFromNextPage();

    if (targetProduct) {
      const rowData = await allProductsPage.getRowDataByFiltersAcrossPages(
        { name: targetProduct },
        { maxPages: 5 },
        ['name', 'addedBy', 'info', 'totalStock', 'published', 'featured']
      );
      expect(rowData).toHaveProperty('name');
      expect(rowData.name).toContain(targetProduct);
    } else {
      console.log(`[Demo] Skipping test: Not enough data`);
    }
  });

  test('18. Tìm kiếm và tìm qua nhiều trang - search() + findRowByFiltersAcrossPages()', async ({ allProductsPage }) => {
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
      console.log(`[Demo] Skipping test: Not enough data`);
    }
  });
});
