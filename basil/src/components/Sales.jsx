import React, { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Package,
  Tag,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const STORAGE_KEYS = {
  CATEGORIES: "categories",
  INVENTORY: "inventory",
  SALES: "sales",
  CREDITS: "credits",
  CURRENT_USER: "current_user",
};

const defaultCategories = [
  {
    id: "cat_001",
    name: "Engine Parts",
    subcategories: ["Pistons", "Cylinders", "Crankshafts", "Valves", "Gaskets"],
  },
  {
    id: "cat_002",
    name: "Body Parts",
    subcategories: ["Fairings", "Fenders", "Mirrors", "Seats", "Fuel Tanks"],
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
  },
  {
    id: "cat_004",
    name: "Brakes",
    subcategories: ["Brake Pads", "Brake Discs", "Brake Fluid", "Brake Cables"],
  },
];

const defaultInventory = [
  {
    id: "prod_001",
    name: "Piston Set - 125cc",
    category: "cat_001",
    subcategory: "Pistons",
    price: 3500,
    quantity: 15,
    minQuantity: 5,
  },
  {
    id: "prod_002",
    name: "Brake Pads - Front",
    category: "cat_004",
    subcategory: "Brake Pads",
    price: 1200,
    quantity: 30,
    minQuantity: 10,
  },
  {
    id: "prod_003",
    name: "Battery - 12V 7Ah",
    category: "cat_003",
    subcategory: "Batteries",
    price: 4500,
    quantity: 8,
    minQuantity: 3,
  },
  {
    id: "prod_004",
    name: "Side Mirror - Left",
    category: "cat_002",
    subcategory: "Mirrors",
    price: 800,
    quantity: 25,
    minQuantity: 10,
  },
  {
    id: "prod_005",
    name: "Chain Set - 428",
    category: "cat_001",
    subcategory: "Chains",
    price: 2800,
    quantity: 12,
    minQuantity: 5,
  },
  {
    id: "prod_006",
    name: "Spark Plug - NGK",
    category: "cat_003",
    subcategory: "Spark Plugs",
    price: 450,
    quantity: 40,
    minQuantity: 15,
  },
];

const Sales = () => {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [mpesaAmount, setMpesaAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const invData = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      const catData = localStorage.getItem(STORAGE_KEYS.CATEGORIES);

      if (invData) {
        setInventory(JSON.parse(invData));
      } else {
        localStorage.setItem(
          STORAGE_KEYS.INVENTORY,
          JSON.stringify(defaultInventory)
        );
        setInventory(defaultInventory);
      }

      if (catData) {
        setCategories(JSON.parse(catData));
      } else {
        localStorage.setItem(
          STORAGE_KEYS.CATEGORIES,
          JSON.stringify(defaultCategories)
        );
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      // Fallback to defaults
      localStorage.setItem(
        STORAGE_KEYS.INVENTORY,
        JSON.stringify(defaultInventory)
      );
      localStorage.setItem(
        STORAGE_KEYS.CATEGORIES,
        JSON.stringify(defaultCategories)
      );
      setInventory(defaultInventory);
      setCategories(defaultCategories);
    }
    setLoading(false);
  };

  const filteredProducts = inventory.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const matchesSubcategory =
      selectedSubcategory === "all" ||
      product.subcategory === selectedSubcategory;
    return (
      matchesSearch &&
      matchesCategory &&
      matchesSubcategory &&
      product.quantity > 0
    );
  });

  const availableSubcategories =
    selectedCategory === "all"
      ? []
      : categories.find((cat) => cat.id === selectedCategory)?.subcategories ||
        [];

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        alert("Cannot add more than available stock");
      }
    } else {
      setCart([...cart, { ...product, quantity: 1, discount: 0 }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = inventory.find((p) => p.id === productId);
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else if (newQuantity <= product.quantity) {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    } else {
      alert(`Only ${product.quantity} items available in stock`);
    }
  };

  const updateDiscount = (productId, discount) => {
    setCart(
      cart.map((item) =>
        item.id === productId
          ? { ...item, discount: Math.max(0, Math.min(discount, item.price)) }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalDiscount = cart.reduce(
      (sum, item) => sum + item.discount * item.quantity,
      0
    );
    const total = subtotal - totalDiscount;
    return { subtotal, totalDiscount, total };
  };

  const { subtotal, totalDiscount, total } = calculateTotals();

const processSale = () => {
  if (cart.length === 0) {
    alert("Cart is empty!");
    return;
  }

  try {
    // For demo purposes, using a default user
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || { 
      id: "user_001", 
      fullName: "Admin" 
    };

    let paymentDetails = { cash: 0, mpesa: 0, credit: 0 };
    let status = "completed";

    if (paymentMethod === "cash") {
      paymentDetails.cash = total;
    } else if (paymentMethod === "mpesa") {
      paymentDetails.mpesa = total;
    } else if (paymentMethod === "split") {
      const cash = parseFloat(cashAmount) || 0;
      const mpesa = parseFloat(mpesaAmount) || 0;

      if (cash + mpesa > total) {
        alert("Payment amounts exceed total!");
        return;
      }

      paymentDetails.cash = cash;
      paymentDetails.mpesa = mpesa;
      paymentDetails.credit = total - cash - mpesa;

      if (paymentDetails.credit > 0) {
        status = "partial";
        if (!customerName.trim()) {
          alert("Customer name required for credit sales!");
          return;
        }
      }
    } else if (paymentMethod === "credit") {
      if (!customerName.trim()) {
        alert("Customer name required for credit sales!");
        return;
      }
      paymentDetails.credit = total;
      status = "credit";
    }

    const sale = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      saleDate: new Date().toISOString(),
      items: cart.map((item) => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: item.discount,
        subtotal: (item.price - item.discount) * item.quantity,
      })),
      totalAmount: subtotal,
      totalDiscount: totalDiscount,
      finalAmount: total,
      paymentMethod: paymentMethod,
      paymentDetails: paymentDetails,
      customerId: customerName ? `cust_${Date.now()}` : null,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      soldBy: user.id,
      soldByName: user.fullName,
      status: status,
      notes: notes,
    };

    // Update inventory
    const updatedInventory = inventory.map((product) => {
      const cartItem = cart.find((item) => item.id === product.id);
      if (cartItem) {
        return {
          ...product,
          quantity: product.quantity - cartItem.quantity,
          updatedAt: new Date().toISOString(),
        };
      }
      return product;
    });

    // Save sales data
    const existingSales = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([...existingSales, sale]));
    
    // Save updated inventory
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updatedInventory));
    setInventory(updatedInventory);

    // Handle credit sales
    if (paymentDetails.credit > 0) {
      const credit = {
        id: `credit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: sale.customerId,
        customerName: customerName,
        customerPhone: customerPhone,
        saleId: sale.id,
        creditDate: new Date().toISOString(),
        items: sale.items,
        totalAmount: paymentDetails.credit,
        amountPaid: 0,
        remainingBalance: paymentDetails.credit,
        payments: [],
        status: "active",
        notes: notes,
      };

      const existingCredits = JSON.parse(localStorage.getItem(STORAGE_KEYS.CREDITS) || '[]');
      localStorage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify([...existingCredits, credit]));
    }

    alert("Sale completed successfully!");
    setCart([]);
    setShowCheckout(false);
    setPaymentMethod("cash");
    setCashAmount("");
    setMpesaAmount("");
    setCustomerName("");
    setCustomerPhone("");
    setNotes("");
  } catch (error) {
    console.error("Error processing sale:", error);
    alert("Error processing sale. Please try again.");
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <div className="text-xl text-slate-300">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Point of Sale
          </h1>
          <p className="text-slate-400">
            Select products and complete your sale
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-800/50 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory("all");
                  }}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  disabled={
                    selectedCategory === "all" ||
                    availableSubcategories.length === 0
                  }
                  className="px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <option value="all">All Subcategories</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-800/50 shadow-xl max-h-[calc(100vh-280px)] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-2 text-center py-12">
                    <Package
                      className="mx-auto mb-4 text-slate-600"
                      size={48}
                    />
                    <p className="text-slate-400 text-lg">No products found</p>
                    <p className="text-slate-500 text-sm mt-2">
                      Try adjusting your filters
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer group"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors flex-1">
                          {product.name}
                        </h3>
                        <Tag
                          className="text-slate-600 group-hover:text-emerald-500 transition-colors"
                          size={18}
                        />
                      </div>
                      <div className="text-sm text-slate-400 mb-3">
                        {
                          categories.find((c) => c.id === product.category)
                            ?.name
                        }
                        {product.subcategory && (
                          <span className="text-slate-500">
                            {" "}
                            • {product.subcategory}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-bold text-lg">
                          KSh {product.price.toLocaleString()}
                        </span>
                        <span
                          className={`text-sm px-2 py-1 rounded-full ${
                            product.quantity <= product.minQuantity
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          Stock: {product.quantity}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-800/50 shadow-xl sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                  <ShoppingCart size={24} className="text-emerald-400" />
                  Cart ({cart.length})
                </h2>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto mb-4 pr-2">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart
                      className="mx-auto mb-3 text-slate-600"
                      size={40}
                    />
                    <p className="text-slate-400">Cart is empty</p>
                    <p className="text-slate-500 text-sm mt-1">
                      Add products to get started
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/80 p-3 rounded-lg border border-slate-800"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-sm flex-1 text-white">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 rounded transition-all ml-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="bg-slate-800 hover:bg-slate-700 text-white p-1.5 rounded transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-14 text-center bg-slate-900 border border-slate-700 rounded py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
                          min="1"
                        />
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded transition-all"
                        >
                          <Plus size={14} />
                        </button>
                        <span className="text-sm text-slate-400 ml-auto">
                          × KSh {item.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs text-slate-400 min-w-fit">
                          Discount:
                        </label>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) =>
                            updateDiscount(
                              item.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                          min="0"
                          max={item.price}
                          placeholder="0"
                        />
                        <span className="text-xs text-slate-500 min-w-fit">
                          per unit
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                        <span className="text-slate-400">Subtotal:</span>
                        <span className="font-semibold text-emerald-400">
                          KSh{" "}
                          {(
                            (item.price - item.discount) *
                            item.quantity
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-slate-800 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal:</span>
                    <span className="text-white font-medium">
                      KSh {subtotal.toLocaleString()}
                    </span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Discount:</span>
                      <span className="text-red-400 font-medium">
                        - KSh {totalDiscount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-slate-800 pt-2">
                    <span className="text-white">Total:</span>
                    <span className="text-emerald-400">
                      KSh {total.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white py-3 rounded-lg font-semibold mt-4 shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Complete Sale
                </h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 mb-6">
                <h3 className="font-semibold mb-3 text-emerald-400">
                  Sale Summary
                </h3>
                <div className="space-y-2 text-sm">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-slate-300"
                    >
                      <span>
                        {item.name} × {item.quantity}
                        {item.discount > 0 && (
                          <span className="text-amber-400 ml-1">
                            (-KSh {item.discount}/unit)
                          </span>
                        )}
                      </span>
                      <span className="font-medium">
                        KSh{" "}
                        {(
                          (item.price - item.discount) *
                          item.quantity
                        ).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between font-bold text-base">
                    <span className="text-white">Total:</span>
                    <span className="text-emerald-400">
                      KSh {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-slate-300">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "cash", label: "Cash", icon: "💵" },
                    { value: "mpesa", label: "M-Pesa", icon: "📱" },
                    { value: "split", label: "Split", icon: "🔀" },
                    { value: "credit", label: "Credit", icon: "📋" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`p-3 rounded-lg border-2 transition-all font-medium ${
                        paymentMethod === method.value
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : "border-slate-700 bg-slate-950/50 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <span className="text-xl mr-2">{method.icon}</span>
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "split" && (
                <div className="mb-6 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                  <h3 className="font-semibold mb-3 text-slate-300">
                    Split Payment
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-400">
                        💵 Cash Amount
                      </label>
                      <input
                        type="number"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-400">
                        📱 M-Pesa Amount
                      </label>
                      <input
                        type="number"
                        value={mpesaAmount}
                        onChange={(e) => setMpesaAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                  {(parseFloat(cashAmount) || 0) +
                    (parseFloat(mpesaAmount) || 0) <
                    total && (
                    <div className="mt-3 bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-start gap-2">
                      <AlertCircle
                        className="text-amber-400 flex-shrink-0 mt-0.5"
                        size={18}
                      />
                      <div>
                        <p className="text-amber-400 text-sm font-medium">
                          Remaining Credit: KSh{" "}
                          {(
                            total -
                            ((parseFloat(cashAmount) || 0) +
                              (parseFloat(mpesaAmount) || 0))
                          ).toLocaleString()}
                        </p>
                        <p className="text-amber-400/70 text-xs mt-1">
                          Customer details required below
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(paymentMethod === "credit" ||
                (paymentMethod === "split" &&
                  (parseFloat(cashAmount) || 0) +
                    (parseFloat(mpesaAmount) || 0) <
                    total)) && (
                <div className="mb-6 bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                  <h3 className="font-semibold mb-3 text-slate-300">
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-400">
                        Customer Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-400">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g., 0712 345 678"
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-slate-300">
                  Sale Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this sale..."
                  rows="3"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 mb-6">
                <h3 className="font-semibold mb-3 text-emerald-400">
                  Final Payment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Amount:</span>
                    <span className="text-white">
                      KSh {total.toLocaleString()}
                    </span>
                  </div>
                  {paymentMethod === "cash" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cash Payment:</span>
                      <span className="text-emerald-400">
                        KSh {total.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {paymentMethod === "mpesa" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">M-Pesa Payment:</span>
                      <span className="text-emerald-400">
                        KSh {total.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {paymentMethod === "split" && (
                    <>
                      {(parseFloat(cashAmount) || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">💵 Cash:</span>
                          <span className="text-white">
                            KSh {(parseFloat(cashAmount) || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {(parseFloat(mpesaAmount) || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">📱 M-Pesa:</span>
                          <span className="text-white">
                            KSh{" "}
                            {(parseFloat(mpesaAmount) || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {(parseFloat(cashAmount) || 0) +
                        (parseFloat(mpesaAmount) || 0) <
                        total && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">
                            📋 Credit Balance:
                          </span>
                          <span className="text-amber-400">
                            KSh{" "}
                            {(
                              total -
                              ((parseFloat(cashAmount) || 0) +
                                (parseFloat(mpesaAmount) || 0))
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {paymentMethod === "credit" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Credit Balance:</span>
                      <span className="text-amber-400">
                        KSh {total.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={processSale}
                  disabled={
                    cart.length === 0 ||
                    (paymentMethod === "credit" && !customerName.trim()) ||
                    (paymentMethod === "split" &&
                      (parseFloat(cashAmount) || 0) +
                        (parseFloat(mpesaAmount) || 0) <
                        total &&
                      !customerName.trim())
                  }
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white py-3 px-4 rounded-lg font-semibold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Complete Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
