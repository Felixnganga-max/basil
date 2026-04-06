// controllers/credits.js
const prisma = require("../../prisma");

// ==================== CREDITS CONTROLLERS ====================

// Get all credits with filtering
exports.getAllCredits = async (req, res) => {
  try {
    const {
      status,
      customerName,
      search,
      startDate,
      endDate,
      limit = 100,
      page = 1,
    } = req.query;

    const where = {};

    if (status) where.status = status;

    if (customerName)
      where.customerName = { contains: customerName, mode: "insensitive" };

    if (startDate || endDate) {
      where.creditDate = {};
      if (startDate) where.creditDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.creditDate.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [credits, totalCount] = await Promise.all([
      prisma.credit.findMany({
        where,
        include: {
          sale: {
            include: {
              items: {
                include: {
                  product: { select: { name: true, sku: true } },
                },
              },
            },
          },
          // schema relation name is paymentHistory, not payments
          paymentHistory: { orderBy: { paidAt: "desc" } },
        },
        orderBy: { creditDate: "desc" },
        take: parseInt(limit),
        skip,
      }),
      prisma.credit.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: credits,
      count: credits.length,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching credits",
      error: error.message,
    });
  }
};

// Get single credit by ID
exports.getCreditById = async (req, res) => {
  try {
    const credit = await prisma.credit.findUnique({
      where: { id: req.params.id },
      include: {
        sale: {
          include: {
            items: {
              include: {
                product: { select: { name: true, sku: true } },
              },
            },
          },
        },
        paymentHistory: { orderBy: { paidAt: "asc" } },
      },
    });

    if (!credit) {
      return res
        .status(404)
        .json({ success: false, message: "Credit not found" });
    }

    res.status(200).json({ success: true, data: credit });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching credit",
      error: error.message,
    });
  }
};

// Record a payment against a credit
exports.recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, receivedBy, receivedByName, notes } =
      req.body;

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment amount" });
    }

    // Must match the CashOrMpesa enum exactly: "cash" | "mpesa"
    const method = (paymentMethod || "cash").toLowerCase();
    if (method !== "cash" && method !== "mpesa") {
      return res.status(400).json({
        success: false,
        message: "paymentMethod must be 'cash' or 'mpesa'",
      });
    }

    const credit = await prisma.credit.findUnique({
      where: { id: req.params.id },
    });

    if (!credit) {
      return res
        .status(404)
        .json({ success: false, message: "Credit not found" });
    }

    if (credit.status === "PAID" || credit.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: `Cannot record payment on a ${credit.status.toLowerCase()} credit`,
      });
    }

    if (amount > credit.remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment (${amount}) exceeds remaining balance (${credit.remainingBalance})`,
      });
    }

    const newAmountPaid = credit.amountPaid + amount;
    const newRemainingBalance = credit.remainingBalance - amount;
    const newStatus = newRemainingBalance === 0 ? "PAID" : "PARTIAL";

    const updatedCredit = await prisma.$transaction(async (tx) => {
      // 1. Create payment record using exact schema field names
      await tx.creditPayment.create({
        data: {
          creditId: credit.id,
          amount,
          paymentMethod: method, // CashOrMpesa enum: "cash" | "mpesa"
          receivedBy: receivedBy || "system",
          receivedByName: receivedByName || "System",
          notes: notes || "",
          // paidAt defaults to now() via schema
        },
      });

      // 2. Update credit balance and status
      return tx.credit.update({
        where: { id: req.params.id },
        data: {
          amountPaid: newAmountPaid,
          remainingBalance: newRemainingBalance,
          status: newStatus,
        },
        include: {
          sale: {
            include: {
              items: {
                include: {
                  product: { select: { name: true, sku: true } },
                },
              },
            },
          },
          paymentHistory: { orderBy: { paidAt: "asc" } },
        },
      });
    });

    res.status(200).json({
      success: true,
      data: updatedCredit,
      message:
        newStatus === "PAID"
          ? `Payment of KSh ${amount.toLocaleString()} recorded. Credit fully cleared!`
          : `Payment of KSh ${amount.toLocaleString()} recorded. Remaining: KSh ${newRemainingBalance.toLocaleString()}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error recording payment",
      error: error.message,
    });
  }
};

// Get credit statistics
exports.getCreditStats = async (req, res) => {
  try {
    const [overall, byStatus] = await Promise.all([
      prisma.credit.aggregate({
        where: { status: { not: "CANCELLED" } },
        _count: { id: true },
        _sum: {
          totalAmount: true,
          amountPaid: true,
          remainingBalance: true,
        },
      }),
      prisma.credit.groupBy({
        by: ["status"],
        where: { status: { not: "CANCELLED" } },
        _count: { id: true },
        _sum: { remainingBalance: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCredits: overall._count.id || 0,
        totalAmount: overall._sum.totalAmount || 0,
        totalPaid: overall._sum.amountPaid || 0,
        totalOutstanding: overall._sum.remainingBalance || 0,
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
          outstanding: s._sum.remainingBalance || 0,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching credit statistics",
      error: error.message,
    });
  }
};
