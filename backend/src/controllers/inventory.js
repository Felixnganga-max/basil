// controllers/sales.js
const prisma = require("../../prisma");

// ==================== SALES CONTROLLERS ====================

// Helper: adds paymentDetails object to every sale response
// so the frontend doesn't need to change how it reads payment info
function formatSale(sale) {
  return {
    ...sale,
    paymentDetails: {
      cash: sale.cashAmount,
      mpesa: sale.mpesaAmount,
      credit: sale.creditAmount,
    },
  };
}

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

    const where = {};

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.saleDate.lte = end;
      }
    }

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (soldBy) where.soldBy = soldBy;
    if (customerName)
      where.customerName = { contains: customerName, mode: "insensitive" };
    if (isReturned !== undefined) where.isReturned = isReturned === "true";

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { soldByName: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: { name: true, sku: true, categoryName: true },
              },
            },
          },
        },
        orderBy: { saleDate: "desc" },
        take: parseInt(limit),
        skip,
      }),
      prisma.sale.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: sales.map(formatSale),
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
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                categoryName: true,
                subcategory: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    res.status(200).json({ success: true, data: formatSale(sale) });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching sale",
      error: error.message,
    });
  }
};

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

    if (!items || items.length === 0) {
      console.log("ERROR: No items in cart");
      return res.status(400).json({
        success: false,
        message: "Sale must have at least one item",
      });
    }

    console.log(`Validating ${items.length} items...`);

    // Use a transaction so stock validation + sale creation + stock decrement
    // are fully atomic — if anything fails, everything rolls back
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Validate stock for every item before touching anything
      for (const item of items) {
        console.log(`Checking product: ${item.productId}`);
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw {
            statusCode: 404,
            message: `Product ${item.productName} not found`,
          };
        }

        console.log(
          `Product found: ${product.name}, Stock: ${product.quantity}, Requested: ${item.quantity}`,
        );

        if (product.quantity < item.quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient stock for ${item.productName}. Available: ${product.quantity}, Requested: ${item.quantity}`,
          };
        }
      }

      // 2. Determine sale status
      let status = "COMPLETED";
      if (paymentDetails.credit > 0) {
        status =
          paymentDetails.cash > 0 || paymentDetails.mpesa > 0
            ? "PARTIAL"
            : "CREDIT";
      }

      console.log(`Creating sale with status: ${status}`);

      // 3. Create the sale + all items in one go
      const newSale = await tx.sale.create({
        data: {
          totalAmount,
          totalDiscount: totalDiscount || 0,
          finalAmount,
          totalCost,
          totalProfit,
          paymentMethod,
          cashAmount: paymentDetails.cash || 0,
          mpesaAmount: paymentDetails.mpesa || 0,
          creditAmount: paymentDetails.credit || 0,
          customerId: customerName ? `cust_${Date.now()}` : null,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          soldBy: soldBy || "system",
          soldByName: soldByName || "System",
          status,
          notes: notes || "",
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              sku: item.sku || "",
              quantity: item.quantity,
              costPrice: item.costPrice,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              subtotal: item.subtotal,
              profit: item.profit,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  categoryName: true,
                  subcategory: true,
                },
              },
            },
          },
        },
      });

      console.log(`Sale created with ID: ${newSale.id}`);

      // 4. Decrement stock for each item
      for (const item of items) {
        console.log(
          `Updating stock for product: ${item.productId}, reducing by ${item.quantity}`,
        );
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // 5. Create credit record if applicable
      if (paymentDetails.credit > 0) {
        console.log(
          `Creating credit record for amount: ${paymentDetails.credit}`,
        );
        await tx.credit.create({
          data: {
            customerId: newSale.customerId,
            customerName,
            customerPhone: customerPhone || null,
            saleId: newSale.id,
            totalAmount: paymentDetails.credit,
            amountPaid: 0,
            remainingBalance: paymentDetails.credit,
            status: "ACTIVE",
            notes: notes || "",
          },
        });
        console.log("Credit record created");
      }

      return newSale;
    });

    console.log("=== SALE COMPLETED SUCCESSFULLY ===");

    res.status(201).json({
      success: true,
      data: formatSale(sale),
      message: "Sale completed successfully",
    });
  } catch (error) {
    console.error("=== ERROR IN CREATE SALE ===");
    console.error("Error:", error.message || error);

    // Handle validation errors thrown inside the transaction
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error processing sale",
      error: error.message,
    });
  }
};

// Return / Refund a sale
exports.returnSale = async (req, res) => {
  try {
    const { returnedBy, returnedByName, returnNotes } = req.body;

    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    if (sale.isReturned) {
      return res.status(400).json({
        success: false,
        message: "This sale has already been returned",
      });
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      // 1. Restore stock for every item
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      // 2. Mark sale as returned
      const updated = await tx.sale.update({
        where: { id: req.params.id },
        data: {
          isReturned: true,
          status: "RETURNED",
          returnedAt: new Date(),
          returnedBy: returnedBy || "system",
          returnedByName: returnedByName || "System",
          returnNotes: returnNotes || "",
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  categoryName: true,
                  subcategory: true,
                },
              },
            },
          },
        },
      });

      // 3. Cancel associated credit if any
      if (sale.creditAmount > 0) {
        await tx.credit.updateMany({
          where: { saleId: sale.id },
          data: {
            status: "CANCELLED",
            notes: `Sale returned: ${returnNotes || "No reason provided"}`,
          },
        });
      }

      return updated;
    });

    res.status(200).json({
      success: true,
      data: formatSale(updatedSale),
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

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.saleDate = {};
      if (startDate) dateFilter.saleDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.saleDate.lte = end;
      }
    }

    const baseWhere = { ...dateFilter, isReturned: false };

    const [overallAgg, byPaymentMethod, byStatus, itemsAgg, returnAgg] =
      await Promise.all([
        prisma.sale.aggregate({
          where: baseWhere,
          _count: { id: true },
          _sum: {
            finalAmount: true,
            totalCost: true,
            totalProfit: true,
            totalDiscount: true,
          },
        }),
        prisma.sale.groupBy({
          by: ["paymentMethod"],
          where: baseWhere,
          _count: { id: true },
          _sum: { finalAmount: true },
        }),
        prisma.sale.groupBy({
          by: ["status"],
          where: baseWhere,
          _count: { id: true },
          _sum: { finalAmount: true },
        }),
        prisma.saleItem.aggregate({
          where: { sale: baseWhere },
          _sum: { quantity: true },
        }),
        prisma.sale.aggregate({
          where: { ...dateFilter, isReturned: true },
          _count: { id: true },
          _sum: { finalAmount: true },
        }),
      ]);

    // Top products — requires raw SQL (groupBy on a joined table)
    const topProducts = await prisma.$queryRaw`
      SELECT
        si."productId",
        si."productName",
        SUM(si.quantity)::int  AS "totalQuantity",
        SUM(si.subtotal)       AS "totalRevenue",
        SUM(si.profit)         AS "totalProfit"
      FROM sale_items si
      INNER JOIN sales s ON si."saleId" = s.id
      WHERE s."isReturned" = false
      GROUP BY si."productId", si."productName"
      ORDER BY "totalQuantity" DESC
      LIMIT 10
    `;

    // Daily sales — requires raw SQL (date formatting)
    const dailySales = await prisma.$queryRaw`
      SELECT
        TO_CHAR("saleDate", 'YYYY-MM-DD') AS "_id",
        COUNT(*)::int                      AS count,
        SUM("finalAmount")                 AS revenue,
        SUM("totalProfit")                 AS profit
      FROM sales
      WHERE "isReturned" = false
      GROUP BY TO_CHAR("saleDate", 'YYYY-MM-DD')
      ORDER BY "_id" ASC
    `;

    res.status(200).json({
      success: true,
      data: {
        overall: {
          totalSales: overallAgg._count.id || 0,
          totalRevenue: overallAgg._sum.finalAmount || 0,
          totalCost: overallAgg._sum.totalCost || 0,
          totalProfit: overallAgg._sum.totalProfit || 0,
          totalDiscount: overallAgg._sum.totalDiscount || 0,
          totalItemsSold: itemsAgg._sum.quantity || 0,
        },
        byPaymentMethod: byPaymentMethod.map((r) => ({
          _id: r.paymentMethod,
          count: r._count.id,
          total: r._sum.finalAmount,
        })),
        byStatus: byStatus.map((r) => ({
          _id: r.status,
          count: r._count.id,
          total: r._sum.finalAmount,
        })),
        topProducts,
        dailySales,
        returns: {
          totalReturns: returnAgg._count.id || 0,
          totalReturnedValue: returnAgg._sum.finalAmount || 0,
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

    const where = { saleDate: { gte: today, lt: tomorrow }, isReturned: false };

    const [sales, stats] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: {
            include: { product: { select: { name: true, sku: true } } },
          },
        },
      }),
      prisma.sale.aggregate({
        where,
        _count: { id: true },
        _sum: {
          finalAmount: true,
          totalProfit: true,
          totalDiscount: true,
          cashAmount: true,
          mpesaAmount: true,
          creditAmount: true,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        sales: sales.map(formatSale),
        statistics: {
          totalTransactions: stats._count.id || 0,
          totalRevenue: stats._sum.finalAmount || 0,
          totalProfit: stats._sum.totalProfit || 0,
          totalDiscount: stats._sum.totalDiscount || 0,
          cashSales: stats._sum.cashAmount || 0,
          mpesaSales: stats._sum.mpesaAmount || 0,
          creditSales: stats._sum.creditAmount || 0,
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
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    if (sale.isReturned) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete a returned sale. Stock has already been restored.",
      });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Restore inventory
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      // 2. Delete associated credit if exists
      if (sale.creditAmount > 0) {
        await tx.credit.deleteMany({ where: { saleId: sale.id } });
      }

      // 3. Delete sale (sale_items cascade automatically via schema)
      await tx.sale.delete({ where: { id: req.params.id } });
    });

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
