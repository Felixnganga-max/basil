// controllers/inventory.js
const prisma = require("../../prisma");

// ==================== CATEGORY CONTROLLERS ====================

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });

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
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({ success: true, data: category });
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

    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const category = await prisma.category.create({
      data: { name, subcategories: subcategories || [] },
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

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, subcategories },
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
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
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const productsCount = await prisma.product.count({
      where: { categoryId: req.params.id },
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete category with existing products. Please reassign or delete products first.",
        productsCount,
      });
    }

    await prisma.category.delete({ where: { id: req.params.id } });

    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully" });
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

    const where = {};

    if (category && category !== "all") where.categoryId = category;
    if (subcategory && subcategory !== "all") where.subcategory = subcategory;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    let products;

    if (lowStockOnly === "true") {
      // Need raw SQL for column-to-column comparison (quantity <= minQuantity)
      products = await prisma.$queryRaw`
        SELECT p.*, c.name AS "categoryName", c.subcategories AS "categorySubcategories"
        FROM products p
        LEFT JOIN categories c ON p."categoryId" = c.id
        WHERE p.quantity <= p."minQuantity"
        ORDER BY p."createdAt" DESC
      `;
    } else {
      products = await prisma.product.findMany({
        where,
        include: { category: { select: { name: true, subcategories: true } } },
        orderBy: { createdAt: "desc" },
      });
    }

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
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: { select: { name: true, subcategories: true } } },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
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
    const products = await prisma.$queryRaw`
      SELECT p.*, c.name AS "categoryName"
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p.quantity <= p."minQuantity"
      ORDER BY p.quantity ASC
    `;

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

    const categoryDoc = await prisma.category.findUnique({
      where: { id: category },
    });
    if (!categoryDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const generatedSku =
      sku ||
      `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const product = await prisma.product.create({
      data: {
        name,
        description: description || "",
        categoryId: category,
        categoryName: categoryDoc.name,
        subcategory: subcategory || "",
        price,
        costPrice: costPrice || 0,
        quantity: quantity || 0,
        minQuantity: minQuantity || 5,
        sku: generatedSku,
        lastRestocked: new Date(),
      },
      include: { category: { select: { name: true, subcategories: true } } },
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "A product with this SKU already exists",
        error: error.message,
      });
    }
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

    // Only include fields that were actually sent in the request
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subcategory !== undefined) updateData.subcategory = subcategory;
    if (price !== undefined) updateData.price = price;
    if (costPrice !== undefined) updateData.costPrice = costPrice;
    if (minQuantity !== undefined) updateData.minQuantity = minQuantity;
    if (sku !== undefined) updateData.sku = sku;

    if (category) {
      const categoryDoc = await prisma.category.findUnique({
        where: { id: category },
      });
      if (!categoryDoc) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
      updateData.categoryId = category;
      updateData.categoryName = categoryDoc.name;
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
      include: { category: { select: { name: true, subcategories: true } } },
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
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
    await prisma.product.delete({ where: { id: req.params.id } });

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
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

    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity + quantityToAdd;
    const totalCost = quantityToAdd * costPrice;

    // Transaction: update stock + create history record atomically
    const [updatedProduct, restockRecord] = await prisma.$transaction([
      prisma.product.update({
        where: { id: req.params.id },
        data: {
          quantity: newQuantity,
          costPrice,
          lastRestocked: new Date(),
        },
        include: { category: { select: { name: true, subcategories: true } } },
      }),
      prisma.restockHistory.create({
        data: {
          productId: req.params.id,
          productName: product.name,
          quantityAdded: quantityToAdd, // NOTE: original code had a typo here using `quantityAdded` (undefined)
          previousQuantity,
          newQuantity,
          costPrice,
          totalCost,
          restockedBy: restockedBy || "Admin",
          restockedByName: restockedByName || "Admin User",
          supplier: supplier || "",
          notes: notes || "",
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Product restocked successfully",
      data: { product: updatedProduct, restockRecord },
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

    const history = await prisma.restockHistory.findMany({
      where: productId ? { productId } : {},
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { date: "desc" },
    });

    res
      .status(200)
      .json({ success: true, count: history.length, data: history });
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
    const restock = await prisma.restockHistory.findUnique({
      where: { id: req.params.id },
      include: { product: { select: { name: true, sku: true } } },
    });

    if (!restock) {
      return res
        .status(404)
        .json({ success: false, message: "Restock record not found" });
    }

    res.status(200).json({ success: true, data: restock });
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
    const [totalProducts, totalCategories, stockAgg, valueData, lowStockData] =
      await Promise.all([
        prisma.product.count(),
        prisma.category.count(),
        prisma.product.aggregate({ _sum: { quantity: true } }),
        // Raw SQL needed: Prisma aggregate can't multiply two columns
        prisma.$queryRaw`
          SELECT
            COALESCE(SUM(quantity * "costPrice"), 0) AS "stockValue",
            COALESCE(SUM(quantity * price), 0)       AS "potentialRevenue"
          FROM products
        `,
        // Raw SQL needed: column-to-column comparison
        prisma.$queryRaw`
          SELECT COUNT(*)::int AS count
          FROM products
          WHERE quantity <= "minQuantity"
        `,
      ]);

    const stockValue = parseFloat(valueData[0]?.stockValue || 0);
    const potentialRevenue = parseFloat(valueData[0]?.potentialRevenue || 0);
    const lowStockCount = lowStockData[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalStock: stockAgg._sum.quantity || 0,
        lowStockCount,
        totalCategories,
        stockValue,
        potentialRevenue,
        potentialProfit: potentialRevenue - stockValue,
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
