const { Sale, Credit, Product } = require("../models/sales");
// const { Product } = require("../models/inventory");

// ==================== SALES CONTROLLERS ====================

// Get all sales with filtering
exports.getAllSales = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      paymentMethod,
      soldBy,
      customerName,
      search,
      isReturned,
      limit = 100,
      page = 1,
    } = req.query;

    let query = {};

    // Date range filter
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.saleDate.$lte = end;
      }
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Payment method filter
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Sold by filter
    if (soldBy) {
      query.soldBy = soldBy;
    }

    // Customer name filter
    if (customerName) {
      query.customerName = { $regex: customerName, $options: "i" };
    }

    // Search filter (customer name or notes)
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { soldByName: { $regex: search, $options: "i" } },
      ];
    }

    // Return status filter
    if (isReturned !== undefined) {
      query.isReturned = isReturned === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sales = await Sale.find(query)
      .populate("items.productId", "name sku category")
      .sort({ saleDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalCount = await Sale.countDocuments(query);

    res.status(200).json({
      success: true,
      data: sales,
      count: sales.length,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sales",
      error: error.message,
    });
  }
};

// Get single sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate(
      "items.productId",
      "name sku category subcategory"
    );

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sale",
      error: error.message,
    });
  }
};

// Create new sale
// Create new sale
exports.createSale = async (req, res) => {
  try {
    console.log("=== CREATE SALE REQUEST ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const {
      items,
      totalAmount,
      totalDiscount,
      finalAmount,
      totalCost,
      totalProfit,
      paymentMethod,
      paymentDetails,
      customerName,
      customerPhone,
      notes,
      soldBy,
      soldByName,
    } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      console.log("ERROR: No items in cart");
      return res.status(400).json({
        success: false,
        message: "Sale must have at least one item",
      });
    }

    console.log(`Validating ${items.length} items...`);

    // Validate stock availability and get product details
    for (const item of items) {
      console.log(`Checking product: ${item.productId}`);
      const product = await Product.findById(item.productId);

      if (!product) {
        console.log(`ERROR: Product not found - ${item.productId}`);
        return res.status(404).json({
          success: false,
          message: `Product ${item.productName} not found`,
        });
      }

      console.log(
        `Product found: ${product.name}, Stock: ${product.quantity}, Requested: ${item.quantity}`
      );

      if (product.quantity < item.quantity) {
        console.log(`ERROR: Insufficient stock for ${product.name}`);
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productName}. Available: ${product.quantity}, Requested: ${item.quantity}`,
        });
      }
    }

    // Determine sale status based on payment
    let status = "completed";
    if (paymentDetails.credit > 0) {
      status =
        paymentDetails.cash > 0 || paymentDetails.mpesa > 0
          ? "partial"
          : "credit";
    }

    console.log(`Creating sale with status: ${status}`);

    // Create sale record
    const sale = await Sale.create({
      items,
      totalAmount,
      totalDiscount,
      finalAmount,
      totalCost,
      totalProfit,
      paymentMethod,
      paymentDetails,
      customerId: customerName ? `cust_${Date.now()}` : null,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      soldBy: soldBy || "system",
      soldByName: soldByName || "System",
      status,
      notes: notes || "",
      saleDate: Date.now(),
    });

    console.log(`Sale created with ID: ${sale._id}`);

    // Update inventory quantities - REDUCE stock
    for (const item of items) {
      console.log(
        `Updating stock for product: ${item.productId}, reducing by ${item.quantity}`
      );
      const product = await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { quantity: -item.quantity },
          updatedAt: Date.now(),
        },
        { new: true }
      );

      if (!product) {
        console.log(`ERROR: Failed to update stock for ${item.productName}`);
        return res.status(500).json({
          success: false,
          message: `Error updating stock for ${item.productName}`,
        });
      }
      console.log(`Stock updated. New quantity: ${product.quantity}`);
    }

    // Create credit record if needed
    if (paymentDetails.credit > 0) {
      console.log(
        `Creating credit record for amount: ${paymentDetails.credit}`
      );
      await Credit.create({
        customerId: sale.customerId,
        customerName,
        customerPhone,
        saleId: sale._id,
        items: sale.items,
        totalAmount: paymentDetails.credit,
        amountPaid: 0,
        remainingBalance: paymentDetails.credit,
        status: "active",
        notes: notes || "",
        creditDate: Date.now(),
      });
      console.log("Credit record created");
    }

    // Populate the sale before returning
    const populatedSale = await Sale.findById(sale._id).populate(
      "items.productId",
      "name sku category subcategory"
    );

    console.log("=== SALE COMPLETED SUCCESSFULLY ===");

    res.status(201).json({
      success: true,
      data: populatedSale,
      message: "Sale completed successfully",
    });
  } catch (error) {
    console.error("=== ERROR IN CREATE SALE ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Error processing sale",
      error: error.message,
    });
  }
};

// Return/Refund a sale
exports.returnSale = async (req, res) => {
  try {
    const { returnedBy, returnedByName, returnNotes } = req.body;

    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    if (sale.isReturned) {
      return res.status(400).json({
        success: false,
        message: "This sale has already been returned",
      });
    }

    // Update inventory quantities - INCREASE stock back
    for (const item of sale.items) {
      const product = await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { quantity: item.quantity },
          updatedAt: Date.now(),
        },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productName} not found for return`,
        });
      }
    }

    // Update sale status
    sale.isReturned = true;
    sale.status = "returned";
    sale.returnedAt = Date.now();
    sale.returnedBy = returnedBy || "system";
    sale.returnedByName = returnedByName || "System";
    sale.returnNotes = returnNotes || "";
    sale.updatedAt = Date.now();

    await sale.save();

    // If there was a credit associated, mark it as cancelled
    if (sale.paymentDetails.credit > 0) {
      await Credit.findOneAndUpdate(
        { saleId: sale._id },
        {
          status: "cancelled",
          notes: `Sale returned: ${returnNotes || "No reason provided"}`,
          updatedAt: Date.now(),
        }
      );
    }

    const populatedSale = await Sale.findById(sale._id).populate(
      "items.productId",
      "name sku category subcategory"
    );

    res.status(200).json({
      success: true,
      data: populatedSale,
      message: "Sale returned successfully. Stock has been restored.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing return",
      error: error.message,
    });
  }
};

// Get sales statistics
exports.getSalesStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.saleDate = {};
      if (startDate) dateQuery.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.saleDate.$lte = end;
      }
    }

    // Total sales statistics
    const stats = await Sale.aggregate([
      { $match: { ...dateQuery, isReturned: false } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmount" },
          totalCost: { $sum: "$totalCost" },
          totalProfit: { $sum: "$totalProfit" },
          totalDiscount: { $sum: "$totalDiscount" },
          totalItemsSold: { $sum: { $size: "$items" } },
        },
      },
    ]);

    // Sales by payment method
    const byPaymentMethod = await Sale.aggregate([
      { $match: { ...dateQuery, isReturned: false } },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          total: { $sum: "$finalAmount" },
        },
      },
    ]);

    // Sales by status
    const byStatus = await Sale.aggregate([
      { $match: { ...dateQuery, isReturned: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$finalAmount" },
        },
      },
    ]);

    // Top selling products
    const topProducts = await Sale.aggregate([
      { $match: { ...dateQuery, isReturned: false } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
          totalProfit: { $sum: "$items.profit" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    // Sales by day (for charts)
    const dailySales = await Sale.aggregate([
      { $match: { ...dateQuery, isReturned: false } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$saleDate" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$finalAmount" },
          profit: { $sum: "$totalProfit" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Returns statistics
    const returnStats = await Sale.aggregate([
      { $match: { ...dateQuery, isReturned: true } },
      {
        $group: {
          _id: null,
          totalReturns: { $sum: 1 },
          totalReturnedValue: { $sum: "$finalAmount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: stats[0] || {
          totalSales: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          totalDiscount: 0,
          totalItemsSold: 0,
        },
        byPaymentMethod,
        byStatus,
        topProducts,
        dailySales,
        returns: returnStats[0] || {
          totalReturns: 0,
          totalReturnedValue: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sales statistics",
      error: error.message,
    });
  }
};

// Get today's sales dashboard
exports.getTodaySales = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySales = await Sale.find({
      saleDate: { $gte: today, $lt: tomorrow },
      isReturned: false,
    }).populate("items.productId", "name sku");

    const stats = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: today, $lt: tomorrow },
          isReturned: false,
        },
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmount" },
          totalProfit: { $sum: "$totalProfit" },
          totalDiscount: { $sum: "$totalDiscount" },
          cashSales: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "cash"] }, "$finalAmount", 0],
            },
          },
          mpesaSales: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "mpesa"] }, "$finalAmount", 0],
            },
          },
          creditSales: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", "credit"] }, "$finalAmount", 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        sales: todaySales,
        statistics: stats[0] || {
          totalTransactions: 0,
          totalRevenue: 0,
          totalProfit: 0,
          totalDiscount: 0,
          cashSales: 0,
          mpesaSales: 0,
          creditSales: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching today's sales",
      error: error.message,
    });
  }
};

// Delete sale (admin only - use with caution)
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    if (sale.isReturned) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete a returned sale. Stock has already been restored.",
      });
    }

    // Restore inventory before deleting
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: item.quantity },
        updatedAt: Date.now(),
      });
    }

    // Delete associated credit if exists
    if (sale.paymentDetails.credit > 0) {
      await Credit.findOneAndDelete({ saleId: sale._id });
    }

    await Sale.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Sale deleted successfully and stock restored",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting sale",
      error: error.message,
    });
  }
};
