// controllers/reports.js
const prisma = require("../../prisma");

// ==================== HELPER ====================

function getDateRange(reportType, selectedDate) {
  const ref = selectedDate ? new Date(selectedDate) : new Date();
  let startDate, endDate;

  if (reportType === "daily") {
    startDate = new Date(ref);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(ref);
    endDate.setHours(23, 59, 59, 999);
  } else if (reportType === "weekly") {
    startDate = new Date(ref);
    startDate.setDate(ref.getDate() - ref.getDay()); // Sunday
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Saturday
    endDate.setHours(23, 59, 59, 999);
  } else if (reportType === "monthly") {
    startDate = new Date(ref.getFullYear(), ref.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
  } else {
    throw new Error("Invalid report type. Use 'daily', 'weekly', or 'monthly'");
  }

  return { startDate, endDate };
}

// ==================== GET SALES REPORT ====================

exports.getSalesReport = async (req, res) => {
  try {
    const { reportType, selectedDate } = req.query;

    console.log("=== SALES REPORT REQUEST ===");
    console.log("Report Type:", reportType);
    console.log("Selected Date:", selectedDate);

    let dateRange;
    try {
      dateRange = getDateRange(reportType, selectedDate);
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    const { startDate, endDate } = dateRange;
    console.log("Date Range:", { startDate, endDate });

    const sales = await prisma.sale.findMany({
      where: {
        saleDate: { gte: startDate, lte: endDate },
        isReturned: false,
      },
      include: {
        items: {
          include: {
            product: { select: { name: true, sku: true, categoryName: true } },
          },
        },
      },
      orderBy: { saleDate: "desc" },
    });

    console.log(`Found ${sales.length} sales`);

    // ── Calculate totals ──
    let totalRevenue = 0,
      totalDiscount = 0,
      grossRevenue = 0,
      totalCost = 0,
      totalProfit = 0,
      totalItems = 0;

    sales.forEach((sale) => {
      totalRevenue += sale.finalAmount;
      totalDiscount += sale.totalDiscount;
      grossRevenue += sale.totalAmount;
      totalCost += sale.totalCost;
      totalProfit += sale.totalProfit;
      totalItems += sale.items.reduce((s, i) => s + i.quantity, 0);
    });

    // ── Product summary ──
    const productMap = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const key = item.productId;
        if (!productMap[key]) {
          productMap[key] = {
            productId: key,
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
        productMap[key].totalQuantity += item.quantity;
        productMap[key].totalRevenue += item.subtotal;
        productMap[key].totalDiscount += (item.discount || 0) * item.quantity;
        productMap[key].totalCost += (item.costPrice || 0) * item.quantity;
        productMap[key].totalProfit += item.profit;
        productMap[key].transactions += 1;
      });
    });

    const productSummary = Object.values(productMap).sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    );

    // ── Payment breakdown ──
    const paymentBreakdown = { cash: 0, mpesa: 0, credit: 0, split: 0 };
    sales.forEach((sale) => {
      if (
        Object.prototype.hasOwnProperty.call(
          paymentBreakdown,
          sale.paymentMethod,
        )
      ) {
        paymentBreakdown[sale.paymentMethod] += sale.finalAmount;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        reportType,
        dateRange: { start: startDate, end: endDate },
        summary: {
          totalSales: sales.length,
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
          _id: sale.id,
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

// ==================== DAILY SALES COMPARISON ====================

exports.getDailySalesComparison = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const dailySales = await prisma.$queryRaw`
      SELECT
        TO_CHAR("saleDate", 'YYYY-MM-DD')  AS "_id",
        COUNT(*)::int                       AS "totalSales",
        SUM("finalAmount")                  AS "totalRevenue",
        SUM("totalProfit")                  AS "totalProfit",
        SUM("totalDiscount")                AS "totalDiscount",
        COALESCE((
          SELECT SUM(si.quantity)
          FROM sale_items si
          WHERE si."saleId" = s.id
        ), 0)                               AS "totalItems"
      FROM sales s
      WHERE "isReturned" = false
        AND "saleDate" >= ${start}
        AND "saleDate" <= ${end}
      GROUP BY TO_CHAR("saleDate", 'YYYY-MM-DD'), s.id
      ORDER BY "_id" ASC
    `;

    res.status(200).json({ success: true, data: dailySales });
  } catch (error) {
    console.error("Error in daily sales comparison:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching daily sales comparison",
      error: error.message,
    });
  }
};

// ==================== TOP SELLING PRODUCTS ====================

exports.getTopSellingProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const start = startDate
      ? new Date(startDate)
      : (() => {
          const d = new Date();
          d.setMonth(d.getMonth() - 1);
          return d;
        })();
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const lim = parseInt(limit);

    const topProducts = await prisma.$queryRaw`
      SELECT
        si."productId"        AS "_id",
        si."productName",
        SUM(si.quantity)::int AS "totalQuantity",
        SUM(si.subtotal)      AS "totalRevenue",
        SUM(si.profit)        AS "totalProfit",
        COUNT(si.id)::int     AS "transactions"
      FROM sale_items si
      INNER JOIN sales s ON si."saleId" = s.id
      WHERE s."isReturned" = false
        AND s."saleDate" >= ${start}
        AND s."saleDate" <= ${end}
      GROUP BY si."productId", si."productName"
      ORDER BY "totalQuantity" DESC
      LIMIT ${lim}
    `;

    res.status(200).json({ success: true, data: topProducts });
  } catch (error) {
    console.error("Error in top selling products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching top selling products",
      error: error.message,
    });
  }
};

// ==================== SALES BY PAYMENT METHOD ====================

exports.getSalesByPaymentMethod = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const stats = await prisma.sale.groupBy({
      by: ["paymentMethod"],
      where: { saleDate: { gte: start, lte: end }, isReturned: false },
      _count: { id: true },
      _sum: { finalAmount: true, totalProfit: true },
    });

    res.status(200).json({
      success: true,
      data: stats.map((r) => ({
        _id: r.paymentMethod,
        count: r._count.id,
        totalAmount: r._sum.finalAmount,
        totalProfit: r._sum.totalProfit,
      })),
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

// ==================== EXPORT SALES REPORT AS CSV DATA ====================

exports.exportSalesReport = async (req, res) => {
  try {
    const { reportType, selectedDate } = req.query;

    let dateRange;
    try {
      dateRange = getDateRange(reportType, selectedDate);
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    const { startDate, endDate } = dateRange;

    const sales = await prisma.sale.findMany({
      where: {
        saleDate: { gte: startDate, lte: endDate },
        isReturned: false,
      },
      include: { items: true },
      orderBy: { saleDate: "desc" },
    });

    const csvData = sales.map((sale) => ({
      date: new Date(sale.saleDate).toLocaleDateString(),
      time: new Date(sale.saleDate).toLocaleTimeString(),
      saleId: sale.id,
      customerName: sale.customerName || "Walk-in Customer",
      items: sale.items.map((i) => i.productName).join("; "),
      totalAmount: sale.totalAmount,
      totalDiscount: sale.totalDiscount,
      finalAmount: sale.finalAmount,
      profit: sale.totalProfit,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      soldBy: sale.soldByName,
    }));

    res.status(200).json({ success: true, data: csvData });
  } catch (error) {
    console.error("Error exporting sales report:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting sales report",
      error: error.message,
    });
  }
};
