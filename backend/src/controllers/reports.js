// ==================== SALES REPORTS CONTROLLER ====================
// File: controllers/salesReports.js

const { Sale } = require("../models/sales");
const { Product } = require("../models/inventory");

// Get sales report by date range
exports.getSalesReport = async (req, res) => {
  try {
    const { reportType, selectedDate } = req.query;

    console.log("=== SALES REPORT REQUEST ===");
    console.log("Report Type:", reportType);
    console.log("Selected Date:", selectedDate);

    // Parse the selected date
    const referenceDate = selectedDate ? new Date(selectedDate) : new Date();
    let startDate, endDate;

    // Calculate date range based on report type
    if (reportType === "daily") {
      startDate = new Date(referenceDate);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(referenceDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (reportType === "weekly") {
      // Get start of week (Sunday)
      startDate = new Date(referenceDate);
      startDate.setDate(referenceDate.getDate() - referenceDate.getDay());
      startDate.setHours(0, 0, 0, 0);

      // Get end of week (Saturday)
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (reportType === "monthly") {
      // Get start of month
      startDate = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        1
      );
      startDate.setHours(0, 0, 0, 0);

      // Get end of month
      endDate = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() + 1,
        0
      );
      endDate.setHours(23, 59, 59, 999);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid report type. Use 'daily', 'weekly', or 'monthly'",
      });
    }

    console.log("Date Range:", { startDate, endDate });

    // Fetch sales within date range
    const sales = await Sale.find({
      saleDate: { $gte: startDate, $lte: endDate },
      isReturned: false,
    })
      .populate("items.productId", "name sku category")
      .sort({ saleDate: -1 });

    console.log(`Found ${sales.length} sales`);

    // Calculate totals
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.finalAmount, 0);
    const totalDiscount = sales.reduce(
      (sum, sale) => sum + sale.totalDiscount,
      0
    );
    const grossRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalCost = sales.reduce((sum, sale) => sum + sale.totalCost, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.totalProfit, 0);
    const totalItems = sales.reduce(
      (sum, sale) =>
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    // Calculate product summary
    const productMap = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const productId = item.productId?._id || item.productId;
        const productKey = productId.toString();

        if (!productMap[productKey]) {
          productMap[productKey] = {
            productId: productKey,
            productName: item.productName,
            totalQuantity: 0,
            totalRevenue: 0,
            totalDiscount: 0,
            totalCost: 0,
            totalProfit: 0,
            unitPrice: item.unitPrice,
            transactions: 0,
          };
        }

        productMap[productKey].totalQuantity += item.quantity;
        productMap[productKey].totalRevenue += item.subtotal;
        productMap[productKey].totalDiscount +=
          (item.discount || 0) * item.quantity;
        productMap[productKey].totalCost +=
          (item.costPrice || 0) * item.quantity;
        productMap[productKey].totalProfit += item.profit;
        productMap[productKey].transactions += 1;
      });
    });

    const productSummary = Object.values(productMap).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    // Payment method breakdown
    const paymentBreakdown = {
      cash: 0,
      mpesa: 0,
      credit: 0,
      split: 0,
    };

    sales.forEach((sale) => {
      if (paymentBreakdown.hasOwnProperty(sale.paymentMethod)) {
        paymentBreakdown[sale.paymentMethod] += sale.finalAmount;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        reportType,
        dateRange: {
          start: startDate,
          end: endDate,
        },
        summary: {
          totalSales,
          totalItems,
          grossRevenue,
          totalDiscount,
          totalRevenue,
          totalCost,
          totalProfit,
          profitMargin:
            totalRevenue > 0
              ? ((totalProfit / totalRevenue) * 100).toFixed(2)
              : 0,
        },
        paymentBreakdown,
        productSummary,
        sales: sales.map((sale) => ({
          _id: sale._id,
          saleDate: sale.saleDate,
          items: sale.items,
          totalAmount: sale.totalAmount,
          totalDiscount: sale.totalDiscount,
          finalAmount: sale.finalAmount,
          totalProfit: sale.totalProfit,
          paymentMethod: sale.paymentMethod,
          status: sale.status,
          customerName: sale.customerName,
          soldByName: sale.soldByName,
        })),
      },
    });
  } catch (error) {
    console.error("=== ERROR IN SALES REPORT ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Error generating sales report",
      error: error.message,
    });
  }
};

// Get daily sales comparison (for charts)
exports.getDailySalesComparison = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const dailySales = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: start, $lte: end },
          isReturned: false,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$saleDate" },
          },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmount" },
          totalProfit: { $sum: "$totalProfit" },
          totalDiscount: { $sum: "$totalDiscount" },
          totalItems: {
            $sum: {
              $reduce: {
                input: "$items",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.quantity"] },
              },
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: dailySales,
    });
  } catch (error) {
    console.error("Error in daily sales comparison:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching daily sales comparison",
      error: error.message,
    });
  }
};

// Get top selling products
exports.getTopSellingProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setMonth(start.getMonth() - 1); // Default to last month
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const topProducts = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: start, $lte: end },
          isReturned: false,
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
          totalProfit: { $sum: "$items.profit" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.status(200).json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    console.error("Error in top selling products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching top selling products",
      error: error.message,
    });
  }
};

// Get sales by payment method
exports.getSalesByPaymentMethod = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const paymentMethodStats = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: start, $lte: end },
          isReturned: false,
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$finalAmount" },
          totalProfit: { $sum: "$totalProfit" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: paymentMethodStats,
    });
  } catch (error) {
    console.error("Error in payment method stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment method statistics",
      error: error.message,
    });
  }
};

// Export sales report as CSV data
exports.exportSalesReport = async (req, res) => {
  try {
    const { reportType, selectedDate } = req.query;

    const referenceDate = selectedDate ? new Date(selectedDate) : new Date();
    let startDate, endDate;

    if (reportType === "daily") {
      startDate = new Date(referenceDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(referenceDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (reportType === "weekly") {
      startDate = new Date(referenceDate);
      startDate.setDate(referenceDate.getDate() - referenceDate.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (reportType === "monthly") {
      startDate = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        1
      );
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() + 1,
        0
      );
      endDate.setHours(23, 59, 59, 999);
    }

    const sales = await Sale.find({
      saleDate: { $gte: startDate, $lte: endDate },
      isReturned: false,
    })
      .populate("items.productId", "name sku")
      .sort({ saleDate: -1 });

    // Format data for CSV export
    const csvData = sales.map((sale) => ({
      date: new Date(sale.saleDate).toLocaleDateString(),
      time: new Date(sale.saleDate).toLocaleTimeString(),
      saleId: sale._id,
      customerName: sale.customerName || "Walk-in Customer",
      items: sale.items.map((item) => item.productName).join("; "),
      totalAmount: sale.totalAmount,
      totalDiscount: sale.totalDiscount,
      finalAmount: sale.finalAmount,
      profit: sale.totalProfit,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      soldBy: sale.soldByName,
    }));

    res.status(200).json({
      success: true,
      data: csvData,
    });
  } catch (error) {
    console.error("Error exporting sales report:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting sales report",
      error: error.message,
    });
  }
};
