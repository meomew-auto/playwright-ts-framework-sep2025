/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEKO COFFEE — ORDERS TABLE (COMBINED UI + API TESTS)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Test trang quản lý đơn hàng — kết hợp UI và API.
 * Copy từ PW_TS[2] — adapt cho kiến trúc project hiện tại.
 *
 * URL: https://coffee.autoneko.com/admin/orders
 * API: GET /api/orders
 *
 * 📌 CẤU TRÚC:
 * - Table Helper Tests (TC_01 → TC_05): Verify helper methods hoạt động
 * - Filter Tests (TC_06 → TC_10): Lọc theo trạng thái, tìm kiếm
 * - API-UI Comparison (TC_11 → TC_14): So sánh dữ liệu UI vs API
 */

import { test, expect } from '@fixtures/neko/unified.fixture';
import { OrdersPage } from '@pages/neko/OrdersPage';
import { Logger } from '@utils/Logger';

// ═══════════════════════════════════════════════════════════════════════════
// 📊 TABLE HELPER TEST CASES (TC_01 → TC_05)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Orders Page with Table Helper', () => {
  test.beforeEach(async ({ ordersPage }) => {
    await ordersPage.goto();
  });

  test('TC_01: Verify table có đủ các cột mặc định', async ({ ordersPage }) => {
    // Dùng getTableData() thay vì getColumnMap() — giống pattern CMS tests
    const tableData = await ordersPage.getTableData([
      'mã đơn', 'khách hàng', 'ngày đặt', 'tổng tiền', 'trạng thái',
    ]);
    Logger.info(`📋 First row: ${JSON.stringify(tableData[0])}`);

    // Verify table có data và đủ các cột
    expect(tableData.length).toBeGreaterThan(0);
    expect(tableData[0]['mã đơn']).toBeTruthy();
    expect(tableData[0]['khách hàng']).toBeTruthy();
    expect(tableData[0]['ngày đặt']).toBeTruthy();
    expect(tableData[0]['tổng tiền']).toBeTruthy();
    expect(tableData[0]['trạng thái']).toBeTruthy();
  });

  test('TC_02: Lấy tất cả mã đơn hàng', async ({ ordersPage }) => {
    const orderIds = await ordersPage.getColumnValues('mã đơn');
    Logger.info(`📋 Order IDs: ${JSON.stringify(orderIds)}`);

    expect(orderIds.length).toBeGreaterThan(0);
    // Mỗi mã đơn phải có format #B2C-xxx
    orderIds.forEach((id) => {
      expect(id).toMatch(/#B2C/);
    });
  });

  test('TC_03: Lấy dữ liệu nhiều cột', async ({ ordersPage }) => {
    const tableData = await ordersPage.getTableData(['mã đơn', 'khách hàng', 'tổng tiền', 'trạng thái']);
    Logger.info(`📊 Table data (${tableData.length} rows): ${JSON.stringify(tableData)}`);

    expect(tableData.length).toBeGreaterThan(0);
    // Mỗi row phải có đủ 4 cột
    tableData.forEach((row) => {
      expect(row['mã đơn']).toBeDefined();
      expect(row['khách hàng']).toBeDefined();
      expect(row['tổng tiền']).toBeDefined();
      expect(row['trạng thái']).toBeDefined();
    });
  });

  test('TC_04: Tìm order theo mã đơn', async ({ ordersPage }) => {
    // Lấy mã đơn đầu tiên
    const orderIds = await ordersPage.getColumnValues('mã đơn');
    const firstOrderId = orderIds[0];

    // Dùng getRowDataByFilters để lấy data đã clean
    const rowData = await ordersPage.getRowDataByFilters(
      { 'mã đơn': firstOrderId },
      ['mã đơn', 'khách hàng', 'tổng tiền', 'trạng thái']
    );

    Logger.info(`🎯 Found row: ${JSON.stringify(rowData)}`);
    expect(rowData['mã đơn']).toBe(firstOrderId);
  });

  test('TC_05: Đếm số lượng orders', async ({ ordersPage }) => {
    const count = await ordersPage.getOrderCount();
    Logger.info(`📊 Total orders: ${count}`);

    expect(count).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 FILTER TEST CASES (TC_06 → TC_10)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Orders Page - Filter Tests', () => {
  test.beforeEach(async ({ ordersPage }) => {
    await ordersPage.goto();
  });

  test('TC_06: Lọc theo trạng thái "Đã hủy"', async ({ ordersPage }) => {
    await ordersPage.filterByStatus(OrdersPage.STATUS_OPTIONS.CANCELLED);

    const statuses = await ordersPage.getAllStatuses();
    Logger.info(`🔍 Statuses after filter: ${JSON.stringify(statuses)}`);

    statuses.forEach((status) => {
      expect(status).toBe('Đã hủy');
    });
  });

  test('TC_07: Lọc theo trạng thái "Đã xác nhận"', async ({ ordersPage }) => {
    await ordersPage.filterByStatus(OrdersPage.STATUS_OPTIONS.CONFIRMED);

    const statuses = await ordersPage.getAllStatuses();
    Logger.info(`🔍 Statuses after filter: ${JSON.stringify(statuses)}`);

    statuses.forEach((status) => {
      expect(status).toBe('Đã xác nhận');
    });
  });

  test('TC_08: Lọc theo trạng thái "Đã giao hàng"', async ({ ordersPage }) => {
    await ordersPage.filterByStatus(OrdersPage.STATUS_OPTIONS.DELIVERED);

    const statuses = await ordersPage.getAllStatuses();
    Logger.info(`🔍 Statuses after filter: ${JSON.stringify(statuses)}`);

    statuses.forEach((status) => {
      expect(status).toBe('Đã giao hàng');
    });
  });

  test('TC_09: Reset filter về "Tất cả trạng thái"', async ({ ordersPage }) => {
    // Đầu tiên lọc 1 status
    await ordersPage.filterByStatus(OrdersPage.STATUS_OPTIONS.CANCELLED);
    const beforeReset = await ordersPage.getOrderCount();

    // Reset filter
    await ordersPage.resetFilters();
    const afterReset = await ordersPage.getOrderCount();

    Logger.info(`🔄 Before reset: ${beforeReset} | After reset: ${afterReset}`);

    // Sau khi reset, số lượng orders phải >= trước đó
    expect(afterReset).toBeGreaterThanOrEqual(beforeReset);
  });

  test('TC_10: Tìm kiếm theo mã đơn', async ({ ordersPage }) => {
    // Lấy mã đơn đầu tiên
    const orderIds = await ordersPage.getColumnValues('mã đơn');
    const targetOrderId = orderIds[0];

    // Tìm kiếm theo mã đơn
    await ordersPage.searchOrder(targetOrderId);

    // Verify kết quả
    const results = await ordersPage.getColumnValues('mã đơn');
    Logger.info(`🔍 Search results: ${JSON.stringify(results)}`);

    expect(results).toContain(targetOrderId);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 API-UI COMBO TEST — So sánh dữ liệu UI vs API (TC_11 → TC_14)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Orders Page - API-UI Comparison', () => {
  test.beforeEach(async ({ ordersPage }) => {
    await ordersPage.goto();
  });

  test('TC_11: So sánh danh sách mã đơn UI với API', async ({ ordersPage, orderService }) => {
    // 1. UI: Lấy tất cả mã đơn từ table
    const uiOrderIds = await ordersPage.getColumnValues('mã đơn');
    Logger.info(`📋 UI Order IDs: ${JSON.stringify(uiOrderIds.slice(0, 5))}`);

    // 2. API: Lấy orders với cùng số lượng
    const apiResponse = await orderService.getOrders({ page: 1, limit: uiOrderIds.length });
    const apiOrderNumbers = apiResponse.data.map((order) => '#' + order.order_number);
    Logger.info(`📋 API Order Numbers: ${JSON.stringify(apiOrderNumbers.slice(0, 5))}`);

    // 3. So sánh: Mỗi mã đơn trong UI phải có trong API
    uiOrderIds.forEach((uiId) => {
      expect(apiOrderNumbers).toContain(uiId);
    });
  });

  test('TC_12: So sánh tổng tiền UI với API', async ({ ordersPage, orderService }) => {
    // 1. UI: Lấy dữ liệu từ table
    const uiData = await ordersPage.getTableData(['mã đơn', 'tổng tiền']);

    // 2. API: Lấy orders
    const apiResponse = await orderService.getOrders({ page: 1, limit: uiData.length });

    // 3. So sánh từng order (5 đầu tiên)
    for (let i = 0; i < Math.min(5, uiData.length); i++) {
      const uiOrder = uiData[i];
      const apiOrder = apiResponse.data[i];

      Logger.info(`📊 Order ${i + 1}: UI={id: ${uiOrder['mã đơn']}, total: ${uiOrder['tổng tiền']}} | API={id: ${apiOrder.order_number}, total: ${apiOrder.total_amount}}`);

      // Tổng tiền UI (đã clean) phải = tổng tiền API
      expect(uiOrder['tổng tiền']).toBe(apiOrder.total_amount.toString());
    }
  });

  test('TC_13: Filter UI cancelled và verify với API', async ({ ordersPage, orderService }) => {
    // 1. UI: Filter theo "Đã hủy"
    await ordersPage.filterByStatus(OrdersPage.STATUS_OPTIONS.CANCELLED);
    const uiOrderIds = await ordersPage.getColumnValues('mã đơn');
    const uiStatuses = await ordersPage.getAllStatuses();

    // 2. API: Lấy orders cancelled
    const apiResponse = await orderService.getOrders({ status: 'cancelled', limit: uiOrderIds.length });
    const apiOrderNumbers = apiResponse.data.map((o) => '#' + o.order_number);
    const apiStatuses = apiResponse.data.map((o) => o.status);

    // 3. In ra so sánh UI vs API
    Logger.info('=== SO SÁNH UI vs API ===');
    Logger.info(`📋 UI Order IDs: ${JSON.stringify(uiOrderIds)}`);
    Logger.info(`📋 API Order Numbers: ${JSON.stringify(apiOrderNumbers)}`);
    Logger.info(`🔍 UI Statuses: ${JSON.stringify(uiStatuses)}`);
    Logger.info(`🔍 API Statuses: ${JSON.stringify(apiStatuses)}`);
    Logger.info(`📊 UI Count: ${uiOrderIds.length} | API Count: ${apiResponse.data.length}`);

    // 4. Verify: Số lượng khớp
    expect(uiOrderIds.length).toBe(apiResponse.data.length);

    // 5. Verify: Tất cả API orders đều có status cancelled
    apiResponse.data.forEach((order) => {
      expect(order.status).toBe('cancelled');
    });

    // 6. Verify: Mã đơn khớp
    uiOrderIds.forEach((uiId, index) => {
      expect(uiId).toBe(apiOrderNumbers[index]);
    });
  });

  test('TC_14: Verify customer name UI khớp với API', async ({ ordersPage, orderService }) => {
    // 1. API: Lấy order đầu tiên
    const apiOrders = await orderService.getOrders({ limit: 1 });
    const apiOrder = apiOrders.data[0];

    // 2. UI: Tìm order này
    const uiData = await ordersPage.getRowDataByFilters(
      { 'mã đơn': '#' + apiOrder.order_number },
      ['mã đơn', 'khách hàng', 'tổng tiền', 'trạng thái']
    );

    // 3. In ra so sánh UI vs API
    Logger.info('=== SO SÁNH UI vs API ===');
    Logger.info(`📋 API Order: {order_number: ${apiOrder.order_number}, shipping_name: ${apiOrder.shipping_name}, total_amount: ${apiOrder.total_amount}, status: ${apiOrder.status}}`);
    Logger.info(`📋 UI Order: ${JSON.stringify(uiData)}`);
    Logger.info(`Khớp tên: ${uiData['khách hàng'] === apiOrder.shipping_name ? '✅' : '❌'}`);
    Logger.info(`Khớp tiền: ${uiData['tổng tiền'] === apiOrder.total_amount.toString() ? '✅' : '❌'}`);

    // 4. Verify: Tên khách hàng khớp
    expect(uiData['khách hàng']).toBe(apiOrder.shipping_name);
    expect(uiData['tổng tiền']).toBe(apiOrder.total_amount.toString());
  });
});
