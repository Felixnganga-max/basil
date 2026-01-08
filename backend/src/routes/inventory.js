const express = require("express");
const router = express.Router();
const controllers = require("../controllers/inventory");

// ==================== CATEGORY ROUTES ====================
router.get("/categories", controllers.getAllCategories);
router.get("/categories/:id", controllers.getCategoryById);
router.post("/categories", controllers.createCategory);
router.put("/categories/:id", controllers.updateCategory);
router.delete("/categories/:id", controllers.deleteCategory);

// ==================== INVENTORY ROUTES ====================
// ⚠️ IMPORTANT: Specific routes MUST come BEFORE dynamic :id routes
router.get("/inventory/low-stock", controllers.getLowStockItems); // ✅ Must be first
router.get("/inventory", controllers.getAllInventory);
router.get("/inventory/:id", controllers.getInventoryById); // ✅ Dynamic route comes after
router.post("/inventory", controllers.createInventory);
router.put("/inventory/:id", controllers.updateInventory);
router.delete("/inventory/:id", controllers.deleteInventory);

// ==================== RESTOCK ROUTES ====================
router.get("/restock-history", controllers.getAllRestockHistory);
router.post("/restock", controllers.restockProduct);

// ==================== USER ROUTES ====================
// ⚠️ IMPORTANT: Specific routes MUST come BEFORE dynamic :id routes
router.get("/users/current", controllers.getCurrentUser); // ✅ Must be first
router.get("/users", controllers.getAllUsers);
router.post("/users", controllers.createUser);

module.exports = router;
