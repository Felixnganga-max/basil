const { Category, Inventory, Sale, Credit } = require("./models");

// ==================== CATEGORY CONTROLLERS ====================

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

// ==================== INVENTORY CONTROLLERS ====================

exports.getAllInventory = async (req, res) => {
  try {
    const { search, category, subcategory } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (subcategory && subcategory !== "all") {
      query.subcategory = subcategory;
    }

    const items = await Inventory.find(query)
      .populate("category")
      .sort({ name: 1 });

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

// ==================== SALES CONTROLLERS ====================

exports.getAllSales = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    let query = {};

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    if (status) {
      query.status = status;
    }

    const sales = await Sale.find(query)
      .populate("items.productId")
      .sort({ saleDate: -1 });

    res.status(200).json({
      success: true,
      data: sales,
      count: sales.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sales",
      error: error.message,
    });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate("items.productId");
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

exports.createSale = async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      totalDiscount,
      finalAmount,
      paymentMethod,
      paymentDetails,
      customerName,
      customerPhone,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sale must have at least one item",
      });
    }

    // Validate stock availability
    for (const item of items) {
      const product = await Inventory.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productName} not found`,
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productName}. Available: ${product.quantity}`,
        });
      }
    }

    // Determine sale status
    let status = "completed";
    if (paymentDetails.credit > 0) {
      status =
        paymentDetails.cash > 0 || paymentDetails.mpesa > 0
          ? "partial"
          : "credit";
    }

    // Create sale
    const sale = await Sale.create({
      items,
      totalAmount,
      totalDiscount,
      finalAmount,
      paymentMethod,
      paymentDetails,
      customerId: customerName ? `cust_${Date.now()}` : null,
      customerName,
      customerPhone,
      soldBy: "system",
      soldByName: "System",
      status,
      notes,
      saleDate: Date.now(),
    });

    // Update inventory quantities
    for (const item of items) {
      await Inventory.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity },
        updatedAt: Date.now(),
      });
    }

    // Create credit record if needed
    if (paymentDetails.credit > 0) {
      await Credit.create({
        customerId: sale.customerId,
        customerName,
        customerPhone,
        saleId: sale._id,
        items: sale.items,
        totalAmount: paymentDetails.credit,
        remainingBalance: paymentDetails.credit,
        status: "active",
        notes,
        creditDate: Date.now(),
      });
    }

    res.status(201).json({
      success: true,
      data: sale,
      message: "Sale completed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing sale",
      error: error.message,
    });
  }
};

// ==================== CREDIT CONTROLLERS ====================

exports.getAllCredits = async (req, res) => {
  try {
    const { status, customerId } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (customerId) {
      query.customerId = customerId;
    }

    const credits = await Credit.find(query)
      .populate("saleId")
      .sort({ creditDate: -1 });

    res.status(200).json({
      success: true,
      data: credits,
      count: credits.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching credits",
      error: error.message,
    });
  }
};

exports.getCreditById = async (req, res) => {
  try {
    const credit = await Credit.findById(req.params.id).populate("saleId");
    if (!credit) {
      return res.status(404).json({
        success: false,
        message: "Credit record not found",
      });
    }
    res.status(200).json({
      success: true,
      data: credit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching credit",
      error: error.message,
    });
  }
};

exports.addCreditPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, receivedBy, receivedByName, notes } =
      req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0",
      });
    }

    const credit = await Credit.findById(req.params.id);

    if (!credit) {
      return res.status(404).json({
        success: false,
        message: "Credit record not found",
      });
    }

    if (credit.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "This credit has already been paid in full",
      });
    }

    if (amount > credit.remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance of KSh ${credit.remainingBalance}`,
      });
    }

    // Add payment to payments array
    credit.payments.push({
      amount,
      paymentMethod,
      receivedBy: receivedBy || "system",
      receivedByName: receivedByName || "System",
      notes,
      paymentDate: Date.now(),
    });

    // Update credit amounts
    credit.amountPaid += amount;
    credit.remainingBalance -= amount;

    // Update status
    if (credit.remainingBalance === 0) {
      credit.status = "paid";
    } else if (credit.amountPaid > 0) {
      credit.status = "partial";
    }

    await credit.save();

    res.status(200).json({
      success: true,
      data: credit,
      message: "Payment recorded successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error recording payment",
      error: error.message,
    });
  }
};

// ==================== DASHBOARD/ANALYTICS CONTROLLERS ====================

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's sales
    const todaySales = await Sale.find({
      saleDate: { $gte: today, $lt: tomorrow },
    });

    const todayRevenue = todaySales.reduce(
      (sum, sale) => sum + sale.finalAmount,
      0
    );
    const todayTransactions = todaySales.length;

    // Active credits
    const activeCredits = await Credit.find({
      status: { $in: ["active", "partial"] },
    });
    const totalCreditAmount = activeCredits.reduce(
      (sum, credit) => sum + credit.remainingBalance,
      0
    );

    // Low stock items
    const inventory = await Inventory.find();
    const lowStockCount = inventory.filter(
      (item) => item.quantity <= item.minQuantity
    ).length;

    res.status(200).json({
      success: true,
      data: {
        todayRevenue,
        todayTransactions,
        activeCreditsCount: activeCredits.length,
        totalCreditAmount,
        lowStockCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};
