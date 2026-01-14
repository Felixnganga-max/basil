const mongoose = require("mongoose");
// Import Product from inventory model
const { Product } = require("./inventory");

// ==================== SALE ITEM SCHEMA ====================
const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  sku: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  profit: {
    type: Number,
    required: true,
  },
});

// ==================== PAYMENT DETAILS SCHEMA ====================
const paymentDetailsSchema = new mongoose.Schema({
  cash: {
    type: Number,
    default: 0,
    min: 0,
  },
  mpesa: {
    type: Number,
    default: 0,
    min: 0,
  },
  credit: {
    type: Number,
    default: 0,
    min: 0,
  },
});

// ==================== MAIN SALE SCHEMA ====================
const saleSchema = new mongoose.Schema({
  saleDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  items: {
    type: [saleItemSchema],
    required: true,
    validate: {
      validator: function (items) {
        return items && items.length > 0;
      },
      message: "Sale must have at least one item",
    },
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  totalDiscount: {
    type: Number,
    default: 0,
    min: 0,
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0,
  },
  totalProfit: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "mpesa", "split", "credit"],
    required: true,
  },
  paymentDetails: {
    type: paymentDetailsSchema,
    required: true,
  },
  customerId: {
    type: String,
    default: null,
  },
  customerName: {
    type: String,
    default: null,
  },
  customerPhone: {
    type: String,
    default: null,
  },
  soldBy: {
    type: String,
    required: true,
  },
  soldByName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["completed", "partial", "credit", "returned"],
    default: "completed",
  },
  notes: {
    type: String,
    default: "",
  },
  isReturned: {
    type: Boolean,
    default: false,
  },
  returnedAt: {
    type: Date,
    default: null,
  },
  returnedBy: {
    type: String,
    default: null,
  },
  returnedByName: {
    type: String,
    default: null,
  },
  returnNotes: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
saleSchema.index({ saleDate: -1 });
saleSchema.index({ status: 1 });
saleSchema.index({ customerName: 1 });
saleSchema.index({ soldBy: 1 });
saleSchema.index({ isReturned: 1 });

// Virtual for calculating items count
saleSchema.virtual("itemsCount").get(function () {
  return this.items.length;
});

// Virtual for calculating total items quantity
saleSchema.virtual("totalQuantity").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Pre-save middleware to update timestamps
saleSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

// ==================== CREDIT SCHEMA ====================
const creditSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    default: null,
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sale",
    required: true,
  },
  items: {
    type: [saleItemSchema],
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0,
  },
  remainingBalance: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["active", "partial", "paid", "cancelled"],
    default: "active",
  },
  paymentHistory: [
    {
      amount: Number,
      paymentMethod: {
        type: String,
        enum: ["cash", "mpesa"],
      },
      paidAt: {
        type: Date,
        default: Date.now,
      },
      receivedBy: String,
      receivedByName: String,
      notes: String,
    },
  ],
  notes: {
    type: String,
    default: "",
  },
  creditDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for credit
creditSchema.index({ customerId: 1 });
creditSchema.index({ customerName: 1 });
creditSchema.index({ status: 1 });
creditSchema.index({ saleId: 1 });

// Pre-save middleware for credits
creditSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

// ==================== CREATE MODELS ====================
const Sale = mongoose.model("Sale", saleSchema);
const Credit = mongoose.model("Credit", creditSchema);

// ==================== EXPORTS ====================
module.exports = {
  Sale,
  Credit,
  Product, // Re-export Product for convenience
};
