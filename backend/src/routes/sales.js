const express = require("express");
const router = express.Router();
const controllers = require("./controllers");

// ==================== CATEGORY ROUTES ====================
router.get("/categories", controllers.getAllCategories);

// ==================== INVENTORY ROUTES ====================
router.get("/inventory", controllers.getAllInventory);

// ==================== SALES ROUTES ====================
router.get("/sales", controllers.getAllSales);
router.get("/sales/:id", controllers.getSaleById);
router.post("/sales", controllers.createSale);

// ==================== CREDIT ROUTES ====================
router.get("/credits", controllers.getAllCredits);
router.get("/credits/:id", controllers.getCreditById);
router.post("/credits/:id/payment", controllers.addCreditPayment);

// ==================== DASHBOARD ROUTES ====================
router.get("/dashboard/stats", controllers.getDashboardStats);

module.exports = router;
