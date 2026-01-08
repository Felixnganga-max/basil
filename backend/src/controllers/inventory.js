const {
  Category,
  Inventory,
  RestockHistory,
  User,
} = require("../models/inventory");

// ==================== CATEGORY CONTROLLERS ====================

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
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

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      subcategories: subcategories || [],
    });

    res.status(201).json({
      success: true,
      data: category,
      message: "Category created successfully",
    });
  } catch (error) {
    res.status(500).json({
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
      data: category,
      message: "Category updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating category",
      error: error.message,
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    // Check if category has products
    const productsCount = await Inventory.countDocuments({
      category: req.params.id,
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete category with existing products. Please reassign or delete products first.",
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

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

// ==================== INVENTORY/PRODUCT CONTROLLERS ====================

// Get all inventory items
exports.getAllInventory = async (req, res) => {
  try {
    const { search, category, lowStock } = req.query;

    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    let items = await Inventory.find(query)
      .populate("category")
      .sort({ name: 1 });

    // Low stock filter (applied after fetch because it involves comparison)
    if (lowStock === "true") {
      items = items.filter((item) => item.quantity <= item.minQuantity);
    }

    res.status(200).json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching inventory",
      error: error.message,
    });
  }
};

// Get single inventory item
exports.getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id).populate("category");
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message,
    });
  }
};

// Create inventory item
exports.createInventory = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      categoryName,
      subcategory,
      price,
      costPrice,
      buyingPrice,
      quantity,
      minQuantity,
      sku,
    } = req.body;

    // Validation
    if (!name || !category || !price || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, category, price, and quantity are required",
      });
    }

    // Check if SKU already exists
    if (sku) {
      const existingSKU = await Inventory.findOne({ sku });
      if (existingSKU) {
        return res.status(400).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    const item = await Inventory.create({
      name,
      description,
      category,
      categoryName,
      subcategory,
      price,
      costPrice: costPrice || 0,
      buyingPrice: buyingPrice || costPrice || 0,
      quantity,
      minQuantity: minQuantity || 5,
      sku: sku || `SKU-${Date.now()}`,
      lastRestocked: Date.now(),
    });

    res.status(201).json({
      success: true,
      data: item,
      message: "Product created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Update inventory item
exports.updateInventory = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      categoryName,
      subcategory,
      price,
      costPrice,
      buyingPrice,
      minQuantity,
      sku,
    } = req.body;

    // Check if SKU is being changed and if it already exists
    if (sku) {
      const existingSKU = await Inventory.findOne({
        sku,
        _id: { $ne: req.params.id },
      });
      if (existingSKU) {
        return res.status(400).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        category,
        categoryName,
        subcategory,
        price,
        costPrice,
        buyingPrice,
        minQuantity,
        sku,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
      message: "Product updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// Delete inventory item
exports.deleteInventory = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Optionally delete related restock history
    await RestockHistory.deleteMany({ productId: req.params.id });

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

// Get low stock items
exports.getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.find().populate("category");
    const lowStockItems = items.filter(
      (item) => item.quantity <= item.minQuantity
    );

    res.status(200).json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching low stock items",
      error: error.message,
    });
  }
};

// ==================== RESTOCK CONTROLLERS ====================

// Get all restock history
exports.getAllRestockHistory = async (req, res) => {
  try {
    const { productId, startDate, endDate } = req.query;

    let query = {};

    if (productId) {
      query.productId = productId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const history = await RestockHistory.find(query)
      .populate("productId")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching restock history",
      error: error.message,
    });
  }
};

// Create restock record and update inventory
exports.restockProduct = async (req, res) => {
  try {
    const {
      productId,
      quantityAdded,
      costPrice,
      buyingPrice,
      restockedBy,
      restockedByName,
      supplier,
      notes,
    } = req.body;

    if (!productId || !quantityAdded) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    // Get current product
    const product = await Inventory.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const previousQty = product.quantity;
    const newQty = previousQty + parseInt(quantityAdded);
    const finalCostPrice = costPrice || product.costPrice || 0;
    const finalBuyingPrice = buyingPrice || finalCostPrice;

    // Update product quantity and prices
    product.quantity = newQty;
    product.costPrice = finalCostPrice;
    product.buyingPrice = finalBuyingPrice;
    product.lastRestocked = Date.now();
    product.updatedAt = Date.now();
    await product.save();

    // Create restock history record
    const restockRecord = await RestockHistory.create({
      productId,
      productName: product.name,
      quantityAdded: parseInt(quantityAdded),
      previousQuantity: previousQty,
      newQuantity: newQty,
      costPrice: finalCostPrice,
      buyingPrice: finalBuyingPrice,
      totalCost: parseInt(quantityAdded) * finalBuyingPrice,
      restockedBy: restockedBy || "unknown",
      restockedByName: restockedByName || "Unknown",
      supplier,
      notes,
      date: Date.now(),
    });

    res.status(201).json({
      success: true,
      data: {
        product,
        restockRecord,
      },
      message: "Product restocked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error restocking product",
      error: error.message,
    });
  }
};

// ==================== USER CONTROLLERS ====================

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ fullName: 1 });
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// Get current user (or create default)
exports.getCurrentUser = async (req, res) => {
  try {
    let user = await User.findOne({ email: "admin@inventory.com" });

    if (!user) {
      user = await User.create({
        fullName: "Admin User",
        email: "admin@inventory.com",
        role: "admin",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// Create user
exports.createUser = async (req, res) => {
  try {
    const { fullName, email, role } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "Full name and email are required",
      });
    }

    const user = await User.create({
      fullName,
      email,
      role: role || "staff",
    });

    res.status(201).json({
      success: true,
      data: user,
      message: "User created successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};
