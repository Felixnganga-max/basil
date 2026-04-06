// routes/credits.js
const express = require("express");
const router = express.Router();
const {
  getAllCredits,
  getCreditById,
  recordPayment,
  getCreditStats,
} = require("../controllers/credits");

// ==================== CREDIT ROUTES ====================

/**
 * @route   GET /api/credits
 * @desc    Get all credits with filtering
 * @access  Private
 * @query   status, customerName, search, startDate, endDate, limit, page
 */
router.get("/", getAllCredits);

/**
 * @route   GET /api/credits/stats
 * @desc    Get credit statistics (totals, by status)
 * @access  Private
 */
router.get("/stats", getCreditStats);

/**
 * @route   GET /api/credits/:id
 * @desc    Get single credit with full payment history
 * @access  Private
 */
router.get("/:id", getCreditById);

/**
 * @route   POST /api/credits/:id/payment
 * @desc    Record a payment against a credit
 * @access  Private
 * @body    amount, paymentMethod, receivedBy, receivedByName, notes
 */
router.post("/:id/payment", recordPayment);

module.exports = router;
