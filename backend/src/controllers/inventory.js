const { Category, Product, RestockHistory } = require("../models/inventory");

// ==================== CATEGORY CONTROLLERS ====================

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// Get single category
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching category",
      error: error.message,
    });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const category = await Category.create({
      name,
      subcategories: subcategories || [],
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating category",
      error: error.message,
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, subcategories, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating category",
      error: error.message,
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if there are products using this category
    const productsCount = await Product.countDocuments({
      category: req.params.id,
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete category with existing products. Please reassign or delete products first.",
        productsCount,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error.message,
    });
  }
};

// ==================== PRODUCT CONTROLLERS ====================

// Get all products with filtering
exports.getAllProducts = async (req, res) => {
  try {
    const { category, subcategory, lowStockOnly, search } = req.query;

    let query = {};

    // Filter by category
    if (category && category !== "all") {
      query.category = category;
    }

    // Filter by subcategory
    if (subcategory && subcategory !== "all") {
      query.subcategory = subcategory;
    }

    // Filter by low stock
    if (lowStockOnly === "true") {
      query.$expr = { $lte: ["$quantity", "$minQuantity"] };
    }

    // Search by name or SKU
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query)
      .populate("category", "name subcategories")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name subcategories"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ["$quantity", "$minQuantity"] },
    }).populate("category", "name");

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching low stock products",
      error: error.message,
    });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      price,
      costPrice,
      quantity,
      minQuantity,
      sku,
    } = req.body;

    // Get category name
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const product = await Product.create({
      name,
      description,
      category,
      categoryName: categoryDoc.name,
      subcategory,
      price,
      costPrice,
      quantity,
      minQuantity: minQuantity || 5,
      sku,
      lastRestocked: Date.now(),
    });

    const populatedProduct = await Product.findById(product._id).populate(
      "category",
      "name subcategories"
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: populatedProduct,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      price,
      costPrice,
      minQuantity,
      sku,
    } = req.body;

    // Get category name if category is being updated
    let updateData = {
      name,
      description,
      subcategory,
      price,
      costPrice,
      minQuantity,
      sku,
      updatedAt: Date.now(),
    };

    if (category) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      updateData.category = category;
      updateData.categoryName = categoryDoc.name;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("category", "name subcategories");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// ==================== RESTOCK CONTROLLERS ====================

// Restock product
exports.restockProduct = async (req, res) => {
  try {
    const {
      quantityToAdd,
      costPrice,
      supplier,
      notes,
      restockedBy,
      restockedByName,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity + quantityToAdd;
    const totalCost = quantityToAdd * costPrice;

    // Update product
    product.quantity = newQuantity;
    product.costPrice = costPrice;
    product.lastRestocked = Date.now();
    product.updatedAt = Date.now();
    await product.save();

    // Create restock history record
    const restockRecord = await RestockHistory.create({
      product: product._id,
      productName: product.name,
      quantityAdded,
      previousQuantity,
      newQuantity,
      costPrice,
      totalCost,
      restockedBy: restockedBy || "Admin",
      restockedByName: restockedByName || "Admin User",
      supplier: supplier || "",
      notes: notes || "",
    });

    const populatedProduct = await Product.findById(product._id).populate(
      "category",
      "name subcategories"
    );

    res.status(200).json({
      success: true,
      message: "Product restocked successfully",
      data: {
        product: populatedProduct,
        restockRecord,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error restocking product",
      error: error.message,
    });
  }
};

// Get restock history
exports.getRestockHistory = async (req, res) => {
  try {
    const { productId } = req.query;

    let query = {};
    if (productId) {
      query.product = productId;
    }

    const history = await RestockHistory.find(query)
      .populate("product", "name sku")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching restock history",
      error: error.message,
    });
  }
};

// Get single restock record
exports.getRestockById = async (req, res) => {
  try {
    const restock = await RestockHistory.findById(req.params.id).populate(
      "product",
      "name sku"
    );

    if (!restock) {
      return res.status(404).json({
        success: false,
        message: "Restock record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: restock,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching restock record",
      error: error.message,
    });
  }
};

// ==================== STATISTICS CONTROLLERS ====================

// Get inventory statistics
exports.getInventoryStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();

    const totalStock = await Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$quantity" },
        },
      },
    ]);

    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ["$quantity", "$minQuantity"] },
    });

    const totalCategories = await Category.countDocuments();

    const totalValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          stockValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
          potentialRevenue: { $sum: { $multiply: ["$quantity", "$price"] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalStock: totalStock[0]?.total || 0,
        lowStockCount,
        totalCategories,
        stockValue: totalValue[0]?.stockValue || 0,
        potentialRevenue: totalValue[0]?.potentialRevenue || 0,
        potentialProfit:
          (totalValue[0]?.potentialRevenue || 0) -
          (totalValue[0]?.stockValue || 0),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching inventory statistics",
      error: error.message,
    });
  }
};
