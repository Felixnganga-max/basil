// data.js - Data structure definitions for Motorbike Spare Parts Shop

// ============================================
// USER DATA STRUCTURE
// ============================================
const userSchema = {
  id: "string", // Unique identifier
  username: "string", // Login username
  password: "string", // Hashed password (in production, use proper hashing)
  fullName: "string", // Full name of user
  role: "string", // 'admin' or 'staff'
  createdAt: "timestamp",
  lastLogin: "timestamp",
};

// Default admin user
const defaultUsers = [
  {
    id: "user_001",
    username: "admin",
    password: "admin123", // In production, this should be hashed
    fullName: "Administrator",
    role: "admin",
    createdAt: new Date().toISOString(),
    lastLogin: null,
  },
];

// ============================================
// CATEGORY DATA STRUCTURE
// ============================================
const categorySchema = {
  id: "string", // Unique identifier (e.g., "cat_001")
  name: "string", // Category name (e.g., "Engine Parts")
  subcategories: ["array of strings"], // Optional subcategories
  createdAt: "timestamp",
  updatedAt: "timestamp",
};

// Sample categories
const defaultCategories = [
  {
    id: "cat_001",
    name: "Engine Parts",
    subcategories: ["Pistons", "Cylinders", "Crankshafts", "Valves", "Gaskets"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat_002",
    name: "Body Parts",
    subcategories: ["Fairings", "Fenders", "Mirrors", "Seats", "Fuel Tanks"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat_003",
    name: "Electrical",
    subcategories: [
      "Batteries",
      "Spark Plugs",
      "Wiring",
      "Lights",
      "Ignition Coils",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat_004",
    name: "Brakes",
    subcategories: ["Brake Pads", "Brake Discs", "Brake Fluid", "Brake Cables"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat_005",
    name: "Transmission",
    subcategories: ["Chains", "Sprockets", "Clutch Plates", "Gear Oil"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================
// INVENTORY/PRODUCT DATA STRUCTURE
// ============================================
const inventorySchema = {
  id: "string", // Unique identifier (e.g., "prod_001")
  name: "string", // Product name
  description: "string", // Optional description
  category: "string", // Category ID
  subcategory: "string", // Optional subcategory name
  price: "number", // Selling price
  costPrice: "number", // Optional: Cost price for profit calculation
  quantity: "number", // Current stock quantity
  minQuantity: "number", // Minimum quantity for restock alert
  sku: "string", // Stock Keeping Unit (optional)
  createdAt: "timestamp",
  updatedAt: "timestamp",
  lastRestocked: "timestamp",
};

// Sample inventory
const defaultInventory = [
  {
    id: "prod_001",
    name: "Piston Set - 125cc",
    description: "Standard piston set for 125cc engines",
    category: "cat_001",
    subcategory: "Pistons",
    price: 3500,
    costPrice: 2800,
    quantity: 15,
    minQuantity: 5,
    sku: "PST-125-001",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRestocked: new Date().toISOString(),
  },
  {
    id: "prod_002",
    name: "Brake Pads - Front",
    description: "Front brake pads for most 150cc bikes",
    category: "cat_004",
    subcategory: "Brake Pads",
    price: 1200,
    costPrice: 900,
    quantity: 30,
    minQuantity: 10,
    sku: "BRK-FRT-002",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRestocked: new Date().toISOString(),
  },
];

// ============================================
// SALES DATA STRUCTURE
// ============================================
const saleSchema = {
  id: "string", // Unique identifier (e.g., "sale_001")
  saleDate: "timestamp",
  items: [
    {
      productId: "string",
      productName: "string",
      quantity: "number",
      unitPrice: "number", // Actual price at time of sale
      discount: "number", // Discount amount per unit
      subtotal: "number", // (unitPrice - discount) * quantity
    },
  ],
  totalAmount: "number", // Total before discount
  totalDiscount: "number", // Total discount applied
  finalAmount: "number", // Total after discount
  paymentMethod: "string", // 'cash', 'mpesa', 'split', 'credit'
  paymentDetails: {
    cash: "number", // Amount paid in cash
    mpesa: "number", // Amount paid via Mpesa
    credit: "number", // Amount on credit
  },
  customerId: "string", // Reference to customer if on credit
  customerName: "string",
  soldBy: "string", // User ID who made the sale
  soldByName: "string",
  status: "string", // 'completed', 'partial', 'credit'
  notes: "string",
};

// Sample sales
const defaultSales = [];

// ============================================
// CREDIT/DEBT DATA STRUCTURE
// ============================================
const creditSchema = {
  id: "string", // Unique identifier (e.g., "credit_001")
  customerId: "string", // Unique customer ID
  customerName: "string",
  customerPhone: "string", // Optional
  saleId: "string", // Reference to original sale
  creditDate: "timestamp", // When credit was given
  items: [
    {
      productId: "string",
      productName: "string",
      quantity: "number",
      unitPrice: "number",
      subtotal: "number",
    },
  ],
  totalAmount: "number", // Original credit amount
  amountPaid: "number", // Total amount paid so far
  remainingBalance: "number", // Amount still owed
  payments: [
    {
      paymentId: "string",
      date: "timestamp",
      amount: "number",
      paymentMethod: "string", // 'cash' or 'mpesa'
      receivedBy: "string", // User ID
      notes: "string",
    },
  ],
  status: "string", // 'active', 'partial', 'cleared'
  dueDate: "timestamp", // Optional due date
  notes: "string",
  createdAt: "timestamp",
  updatedAt: "timestamp",
};

// Sample credits
const defaultCredits = [];

// ============================================
// PAYMENT DATA STRUCTURE (for tracking)
// ============================================
const paymentSchema = {
  id: "string",
  creditId: "string", // Reference to credit
  date: "timestamp",
  amount: "number",
  paymentMethod: "string",
  receivedBy: "string",
  receivedByName: "string",
  notes: "string",
};

// ============================================
// CUSTOMER DATA STRUCTURE (Optional - for future)
// ============================================
const customerSchema = {
  id: "string",
  name: "string",
  phone: "string",
  email: "string",
  address: "string",
  totalPurchases: "number",
  outstandingCredit: "number",
  createdAt: "timestamp",
};

// ============================================
// RESTOCK HISTORY DATA STRUCTURE
// ============================================
const restockSchema = {
  id: "string",
  productId: "string",
  productName: "string",
  quantityAdded: "number",
  previousQuantity: "number",
  newQuantity: "number",
  costPrice: "number",
  totalCost: "number",
  restockedBy: "string",
  restockedByName: "string",
  date: "timestamp",
  supplier: "string", // Optional
  notes: "string",
};

// ============================================
// STORAGE KEYS CONSTANTS
// ============================================
const STORAGE_KEYS = {
  USERS: "users",
  CURRENT_USER: "current_user",
  CATEGORIES: "categories",
  INVENTORY: "inventory",
  SALES: "sales",
  CREDITS: "credits",
  CUSTOMERS: "customers",
  RESTOCK_HISTORY: "restock_history",
  SETTINGS: "settings",
};

// ============================================
// HELPER FUNCTIONS FOR ID GENERATION
// ============================================
const generateId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const idGenerators = {
  user: () => generateId("user"),
  category: () => generateId("cat"),
  product: () => generateId("prod"),
  sale: () => generateId("sale"),
  credit: () => generateId("credit"),
  payment: () => generateId("pay"),
  customer: () => generateId("cust"),
  restock: () => generateId("restock"),
};

// ============================================
// INITIALIZATION DATA
// ============================================
const initializeData = {
  users: defaultUsers,
  categories: defaultCategories,
  inventory: defaultInventory,
  sales: defaultSales,
  credits: defaultCredits,
  customers: [],
  restockHistory: [],
};

// Export everything
export {
  userSchema,
  categorySchema,
  inventorySchema,
  saleSchema,
  creditSchema,
  paymentSchema,
  customerSchema,
  restockSchema,
  defaultUsers,
  defaultCategories,
  defaultInventory,
  defaultSales,
  defaultCredits,
  STORAGE_KEYS,
  idGenerators,
  initializeData,
};
