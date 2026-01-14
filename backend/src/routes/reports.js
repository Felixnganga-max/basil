// ==================== SALES REPORTS ROUTES ====================
// File: routes/salesReports.js

const express = require("express");
const router = express.Router();
const {
  getSalesReport,
  getDailySalesComparison,
  getTopSellingProducts,
  getSalesByPaymentMethod,
  exportSalesReport,
} = require("../controllers/reports");

/**
 * @route   GET /api/reports/sales
 * @desc    Get sales report by date range (daily/weekly/monthly)
 * @access  Private
 * @query   reportType (daily/weekly/monthly), selectedDate
 */
router.get("/sales", getSalesReport);

/**
 * @route   GET /api/reports/daily-comparison
 * @desc    Get daily sales comparison for charts
 * @access  Private
 * @query   startDate, endDate
 */
router.get("/daily-comparison", getDailySalesComparison);

/**
 * @route   GET /api/reports/top-products
 * @desc    Get top selling products
 * @access  Private
 * @query   startDate, endDate, limit
 */
router.get("/top-products", getTopSellingProducts);

/**
 * @route   GET /api/reports/payment-methods
 * @desc    Get sales by payment method
 * @access  Private
 * @query   startDate, endDate
 */
router.get("/payment-methods", getSalesByPaymentMethod);

/**
 * @route   GET /api/reports/export
 * @desc    Export sales report data for CSV/Excel
 * @access  Private
 * @query   reportType, selectedDate
 */
router.get("/export", exportSalesReport);

module.exports = router;
