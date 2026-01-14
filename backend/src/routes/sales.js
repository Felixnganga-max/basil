const express = require("express");
const router = express.Router();
const {
  getAllSales,
  getSaleById,
  createSale,
  returnSale,
  getSalesStats,
  getTodaySales,
  deleteSale,
} = require("../controllers/sales");

// ==================== SALES ROUTES ====================

/**
 * @route   GET /api/sales
 * @desc    Get all sales with filtering options
 * @access  Private
 * @query   startDate, endDate, status, paymentMethod, soldBy, customerName, search, isReturned, limit, page
 */
router.get("/", getAllSales);

/**
 * @route   GET /api/sales/stats
 * @desc    Get sales statistics and analytics
 * @access  Private
 * @query   startDate, endDate
 */
router.get("/stats", getSalesStats);

/**
 * @route   GET /api/sales/today
 * @desc    Get today's sales dashboard
 * @access  Private
 */
router.get("/today", getTodaySales);

/**
 * @route   GET /api/sales/:id
 * @desc    Get single sale by ID
 * @access  Private
 */
router.get("/:id", getSaleById);

/**
 * @route   POST /api/sales
 * @desc    Create new sale (process transaction)
 * @access  Private
 * @body    items, totalAmount, totalDiscount, finalAmount, totalCost, totalProfit,
 *          paymentMethod, paymentDetails, customerName, customerPhone, notes, soldBy, soldByName
 */
router.post("/", createSale);

/**
 * @route   PUT /api/sales/:id/return
 * @desc    Return/refund a sale
 * @access  Private
 * @body    returnedBy, returnedByName, returnNotes
 */
router.put("/:id/return", returnSale);

/**
 * @route   DELETE /api/sales/:id
 * @desc    Delete a sale (admin only - restores stock)
 * @access  Private/Admin
 */
router.delete("/:id", deleteSale);

module.exports = router;
