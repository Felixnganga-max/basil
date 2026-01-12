const express = require("express");
const router = express.Router();
const {
  // Category controllers
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,

  // Product controllers
  getAllProducts,
  getProductById,
  getLowStockProducts,
  createProduct,
  updateProduct,
  deleteProduct,

  // Restock controllers
  restockProduct,
  getRestockHistory,
  getRestockById,

  // Statistics
  getInventoryStats,
} = require("../controllers/inventory");

// ==================== CATEGORY ROUTES ====================
router.route("/categories").get(getAllCategories).post(createCategory);

router
  .route("/categories/:id")
  .get(getCategoryById)
  .put(updateCategory)
  .delete(deleteCategory);

// ==================== PRODUCT ROUTES ====================
router.route("/products").get(getAllProducts).post(createProduct);

router.route("/products/low-stock").get(getLowStockProducts);

router
  .route("/products/:id")
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

// ==================== RESTOCK ROUTES ====================
router.route("/products/:id/restock").post(restockProduct);

router.route("/restock-history").get(getRestockHistory);

router.route("/restock-history/:id").get(getRestockById);

// ==================== STATISTICS ROUTES ====================
router.route("/stats").get(getInventoryStats);

module.exports = router;
