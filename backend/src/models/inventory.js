const mongoose = require("mongoose");

// Category Schema
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
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
  },
  {
    timestamps: true,
  }
);

// Product/Inventory Schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    categoryName: {
      type: String,
      required: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Price cannot be negative"],
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: [0, "Cost price cannot be negative"],
      default: 0,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    minQuantity: {
      type: Number,
      min: [0, "Minimum quantity cannot be negative"],
      default: 5,
    },
    sku: {
      type: String,
      unique: true,
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
  },
  {
    timestamps: true,
  }
);

// Auto-generate SKU if not provided
productSchema.pre("save", async function () {
  if (!this.sku) {
    this.sku = `SKU-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;
  }
});

// Restock History Schema
const restockHistorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantityAdded: {
      type: Number,
      required: [true, "Quantity added is required"],
      min: [1, "Quantity added must be at least 1"],
    },
    previousQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    costPrice: {
      type: Number,
      required: true,
      min: [0, "Cost price cannot be negative"],
    },
    totalCost: {
      type: Number,
      required: true,
    },
    restockedBy: {
      type: String,
      default: "Admin User",
    },
    restockedByName: {
      type: String,
      default: "Admin User",
    },
    supplier: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create models
const Category = mongoose.model("Category", categorySchema);
const Product = mongoose.model("Product", productSchema);
const RestockHistory = mongoose.model("RestockHistory", restockHistorySchema);

module.exports = {
  Category,
  Product,
  RestockHistory,
};
