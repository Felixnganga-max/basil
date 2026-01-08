const mongoose = require("mongoose");

// Category Schema
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  subcategories: [
    {
      type: String,
      trim: true,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Product/Inventory Schema
const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  categoryName: {
    type: String,
    required: true,
  },
  subcategory: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  costPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  buyingPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  minQuantity: {
    type: Number,
    default: 5,
    min: 0,
  },
  sku: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  lastRestocked: {
    type: Date,
    default: Date.now,
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

// Sales Schema
const salesSchema = new mongoose.Schema({
  saleDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
        required: true,
      },
      productName: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
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
        min: 0,
      },
    },
  ],
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
  paymentMethod: {
    type: String,
    enum: ["cash", "mpesa", "split", "credit"],
    required: true,
  },
  paymentDetails: {
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
  },
  customerId: {
    type: String,
    trim: true,
  },
  customerName: {
    type: String,
    trim: true,
  },
  customerPhone: {
    type: String,
    trim: true,
  },
  soldBy: {
    type: String,
    default: "system",
  },
  soldByName: {
    type: String,
    default: "System",
  },
  status: {
    type: String,
    enum: ["completed", "partial", "credit"],
    default: "completed",
  },
  notes: {
    type: String,
    trim: true,
  },
});

// Credit/Debt Schema
const creditSchema = new mongoose.Schema({
  customerId: {
    type: String,
    trim: true,
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  customerPhone: {
    type: String,
    trim: true,
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sale",
    required: true,
  },
  creditDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Inventory",
      },
      productName: String,
      quantity: Number,
      unitPrice: Number,
      discount: Number,
      subtotal: Number,
    },
  ],
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
  payments: [
    {
      paymentDate: {
        type: Date,
        default: Date.now,
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      paymentMethod: {
        type: String,
        enum: ["cash", "mpesa"],
        required: true,
      },
      receivedBy: String,
      receivedByName: String,
      notes: String,
    },
  ],
  status: {
    type: String,
    enum: ["active", "paid", "partial"],
    default: "active",
  },
  notes: {
    type: String,
    trim: true,
  },
});

// ==================== RESTOCK HISTORY SCHEMA ====================
// ⚠️ ADD THIS - Your controller needs it!
const restockHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantityAdded: {
    type: Number,
    required: true,
    min: 1,
  },
  previousQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  newQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  costPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  buyingPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  restockedBy: {
    type: String,
    default: "unknown",
  },
  restockedByName: {
    type: String,
    default: "Unknown",
  },
  supplier: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

// ==================== USER SCHEMA ====================
// ⚠️ ADD THIS - Your controller needs it!
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ["admin", "manager", "staff"],
    default: "staff",
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

// Indexes
categorySchema.index({ name: 1 });
inventorySchema.index({ sku: 1 });
inventorySchema.index({ category: 1 });
salesSchema.index({ saleDate: -1 });
salesSchema.index({ status: 1 });
creditSchema.index({ customerId: 1 });
creditSchema.index({ saleId: 1 });
creditSchema.index({ status: 1 });
restockHistorySchema.index({ productId: 1 });
restockHistorySchema.index({ date: -1 });
userSchema.index({ email: 1 });

// Update timestamps middleware
categorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

inventorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export models
const Category = mongoose.model("Category", categorySchema);
const Inventory = mongoose.model("Inventory", inventorySchema);
const Sale = mongoose.model("Sale", salesSchema);
const Credit = mongoose.model("Credit", creditSchema);
const RestockHistory = mongoose.model("RestockHistory", restockHistorySchema);
const User = mongoose.model("User", userSchema);

// ⚠️ CRITICAL: Export ALL models including RestockHistory and User
module.exports = {
  Category,
  Inventory,
  Sale,
  Credit,
  RestockHistory,
  User,
};
