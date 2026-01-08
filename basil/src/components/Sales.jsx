import React, { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  Package,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
    costPrice: 2800,
    sellingPrice: 3500,
    quantity: 15,
    minQuantity: 5,
  },
  {
    id: "prod_002",
    name: "Brake Pads - Front",
    category: "cat_004",
    subcategory: "Brake Pads",
    costPrice: 900,
    sellingPrice: 1200,
    quantity: 30,
    minQuantity: 10,
  },
  {
    id: "prod_003",
    name: "Battery - 12V 7Ah",
    category: "cat_003",
    subcategory: "Batteries",
    costPrice: 3500,
    sellingPrice: 4500,
    quantity: 8,
    minQuantity: 3,
  },
  {
    id: "prod_004",
    name: "Side Mirror - Left",
    category: "cat_002",
    subcategory: "Mirrors",
    costPrice: 600,
    sellingPrice: 800,
    quantity: 25,
    minQuantity: 10,
  },
  {
    id: "prod_005",
    name: "Chain Set - 428",
    category: "cat_001",
    subcategory: "Chains",
    costPrice: 2200,
    sellingPrice: 2800,
    quantity: 12,
    minQuantity: 5,
  },
  {
    id: "prod_006",
    name: "Spark Plug - NGK",
    category: "cat_003",
    subcategory: "Spark Plugs",
    costPrice: 350,
    sellingPrice: 450,
    quantity: 40,
    minQuantity: 15,
  },
  {
    id: "prod_007",
    name: "Oil Filter",
    category: "cat_001",
    subcategory: "Filters",
    costPrice: 400,
    sellingPrice: 550,
    quantity: 22,
    minQuantity: 8,
  },
  {
    id: "prod_008",
    name: "Front Fairing",
    category: "cat_002",
    subcategory: "Fairings",
    costPrice: 5500,
    sellingPrice: 7000,
    quantity: 5,
    minQuantity: 2,
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
  const [expandedProduct, setExpandedProduct] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const invData = localStorage.getItem("inventory");
      const catData = localStorage.getItem("categories");

      if (invData) {
        const parsedInv = JSON.parse(invData);
        setInventory(parsedInv);
      } else {
        localStorage.setItem("inventory", JSON.stringify(defaultInventory));
        setInventory(defaultInventory);
      }

      if (catData) {
        const parsedCat = JSON.parse(catData);
        setCategories(parsedCat);
      } else {
        localStorage.setItem("categories", JSON.stringify(defaultCategories));
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setInventory(defaultInventory);
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
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

  const updateProductQuantity = (productId, newQuantity) => {
    const product = inventory.find((p) => p.id === productId);
    if (!product) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else if (newQuantity <= product.quantity) {
      const existingItem = cart.find((item) => item.id === productId);
      if (existingItem) {
        setCart(
          cart.map((item) =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
          )
        );
      } else {
        setCart([...cart, { ...product, quantity: newQuantity, discount: 0 }]);
      }
    } else {
      alert(`Only ${product.quantity} items available in stock`);
    }
  };

  const updateDiscount = (productId, discount) => {
    setCart(
      cart.map((item) =>
        item.id === productId
          ? {
              ...item,
              discount: Math.max(0, Math.min(discount, item.sellingPrice || 0)),
            }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
    if (expandedProduct === productId) {
      setExpandedProduct(null);
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + (item.sellingPrice || 0) * (item.quantity || 0),
      0
    );
    const totalDiscount = cart.reduce(
      (sum, item) => sum + (item.discount || 0) * (item.quantity || 0),
      0
    );
    const total = subtotal - totalDiscount;
    const totalCost = cart.reduce(
      (sum, item) => sum + (item.costPrice || 0) * (item.quantity || 0),
      0
    );
    const profit = total - totalCost;
    return { subtotal, totalDiscount, total, totalCost, profit };
  };

  const { subtotal, totalDiscount, total, totalCost, profit } =
    calculateTotals();

  const getCartItemQuantity = (productId) => {
    const item = cart.find((i) => i.id === productId);
    return item ? item.quantity : 0;
  };

  const processSale = () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("current_user")) || {
        id: "user_001",
        fullName: "Admin",
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
          costPrice: item.costPrice,
          unitPrice: item.sellingPrice,
          discount: item.discount,
          subtotal: (item.sellingPrice - item.discount) * item.quantity,
          profit:
            (item.sellingPrice - item.discount - item.costPrice) *
            item.quantity,
        })),
        totalAmount: subtotal,
        totalDiscount: totalDiscount,
        finalAmount: total,
        totalCost: totalCost,
        totalProfit: profit,
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

      const existingSales = JSON.parse(localStorage.getItem("sales") || "[]");
      localStorage.setItem("sales", JSON.stringify([...existingSales, sale]));

      localStorage.setItem("inventory", JSON.stringify(updatedInventory));
      setInventory(updatedInventory);

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

        const existingCredits = JSON.parse(
          localStorage.getItem("credits") || "[]"
        );
        localStorage.setItem(
          "credits",
          JSON.stringify([...existingCredits, credit])
        );
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
      setExpandedProduct(null);
    } catch (error) {
      console.error("Error processing sale:", error);
      alert("Error processing sale. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 text-gray-900 p-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-red-600 mb-1">
            Point of Sale
          </h1>
          <p className="text-gray-600 text-sm">
            Select products and complete your sale
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white p-3 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-500"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory("all");
                  }}
                  className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-500"
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
                  className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-500 disabled:opacity-50"
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

            <div className="bg-white rounded-lg shadow max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto mb-3 text-gray-400" size={40} />
                    <p className="text-gray-600">No products found</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const cartQty = getCartItemQuantity(product.id);
                    const isInCart = cartQty > 0;
                    const isExpanded = expandedProduct === product.id;

                    return (
                      <div
                        key={product.id}
                        className={`p-3 transition-all ${
                          isInCart ? "bg-red-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => {
                            if (isInCart) {
                              setExpandedProduct(
                                isExpanded ? null : product.id
                              );
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  product.quantity <= product.minQuantity
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                Stock: {product.quantity}
                              </span>
                              <span className="text-xs text-gray-600">
                                Cost: KSh{" "}
                                {(product.costPrice || 0).toLocaleString()}
                              </span>
                              <span className="text-xs text-red-600 font-semibold">
                                Sell: KSh{" "}
                                {(product.sellingPrice || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-3">
                            {isInCart ? (
                              <>
                                <span className="text-sm font-bold text-red-600 min-w-[30px] text-center">
                                  {cartQty}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp
                                    className="text-gray-400"
                                    size={20}
                                  />
                                ) : (
                                  <ChevronDown
                                    className="text-gray-400"
                                    size={20}
                                  />
                                )}
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateProductQuantity(product.id, 1);
                                  setExpandedProduct(product.id);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded transition-all"
                              >
                                <Plus size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        {isInCart && isExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateProductQuantity(product.id, cartQty - 1)
                                }
                                className="bg-gray-300 hover:bg-gray-400 text-gray-900 p-2 rounded transition-all"
                              >
                                <Minus size={16} />
                              </button>

                              <input
                                type="number"
                                value={cartQty}
                                onChange={(e) =>
                                  updateProductQuantity(
                                    product.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-20 text-center bg-white border border-gray-300 rounded py-1.5 text-sm font-semibold focus:outline-none focus:border-red-500"
                                min="0"
                                max={product.quantity}
                              />

                              <button
                                onClick={() =>
                                  updateProductQuantity(product.id, cartQty + 1)
                                }
                                disabled={cartQty >= product.quantity}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white p-2 rounded transition-all"
                              >
                                <Plus size={16} />
                              </button>

                              <button
                                onClick={() => removeFromCart(product.id)}
                                className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded transition-all ml-auto"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                                Discount/unit:
                              </label>
                              <input
                                type="number"
                                value={
                                  cart.find((item) => item.id === product.id)
                                    ?.discount || 0
                                }
                                onChange={(e) =>
                                  updateDiscount(
                                    product.id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="flex-1 bg-white border border-gray-300 rounded px-2 py-1.5 text-sm font-semibold focus:outline-none focus:border-orange-500"
                                min="0"
                                max={product.sellingPrice}
                                placeholder="0"
                              />
                              <span className="text-xs text-gray-600">KSh</span>
                            </div>

                            <div className="flex justify-between items-center text-sm bg-red-100 p-2 rounded">
                              <span className="font-medium text-gray-700">
                                Line Total:
                              </span>
                              <span className="font-bold text-red-600">
                                KSh{" "}
                                {(
                                  ((product.sellingPrice || 0) -
                                    (cart.find((item) => item.id === product.id)
                                      ?.discount || 0)) *
                                  cartQty
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg shadow sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                  <ShoppingCart size={24} />
                  Cart
                </h2>
                <div className="bg-red-600 text-white px-2.5 py-1 rounded-full text-sm font-bold">
                  {cart.length}
                </div>
              </div>

              <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart
                      className="mx-auto mb-2 text-gray-400"
                      size={40}
                    />
                    <p className="text-gray-600 text-sm">Cart is empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 p-2.5 rounded border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {item.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {item.quantity} × KSh{" "}
                            {(item.sellingPrice || 0).toLocaleString()}
                          </p>
                          {item.discount > 0 && (
                            <p className="text-xs text-orange-600 font-medium">
                              Disc: -KSh {(item.discount || 0).toLocaleString()}{" "}
                              /unit
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:bg-red-100 p-1 rounded transition-all ml-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200">
                        <span className="text-gray-600 font-medium">
                          Subtotal:
                        </span>
                        <span className="font-bold text-red-600">
                          KSh{" "}
                          {(
                            ((item.sellingPrice || 0) - (item.discount || 0)) *
                            (item.quantity || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-gray-300 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">
                      KSh {subtotal.toLocaleString()}
                    </span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="text-orange-500 font-semibold">
                        - KSh {totalDiscount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                    <span>Total:</span>
                    <span className="text-red-600">
                      KSh {total.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-green-50 p-2 rounded border border-green-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700 font-medium">
                        Profit:
                      </span>
                      <span className="text-green-700 font-bold">
                        KSh {profit.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold mt-3 shadow transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Receive Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-red-600">
                  Receive Payment
                </h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-gray-600 hover:bg-gray-100 p-2 rounded transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-bold mb-3 text-red-600">Sale Summary</h3>
                <div className="space-y-2 text-sm">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-gray-700"
                    >
                      <span>
                        {item.name} × {item.quantity}
                        {item.discount > 0 && (
                          <span className="text-orange-500 ml-1">
                            (-KSh {item.discount}/u)
                          </span>
                        )}
                      </span>
                      <span className="font-semibold">
                        KSh{" "}
                        {(
                          (item.sellingPrice - item.discount) *
                          item.quantity
                        ).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-red-600">
                      KSh {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-2 text-gray-700">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "cash", label: "Cash", icon: "💵" },
                    { value: "mpesa", label: "M-Pesa", icon: "📱" },
                    { value: "split", label: "Split", icon: "🔀" },
                    { value: "credit", label: "Credit", icon: "📋" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`p-3 rounded-lg border-2 transition-all font-semibold text-sm ${
                        paymentMethod === method.value
                          ? "border-red-600 bg-red-50 text-red-600"
                          : "border-gray-300 hover:border-orange-500"
                      }`}
                    >
                      <span className="mr-1">{method.icon}</span>
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "split" && (
                <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-3 text-gray-700">
                    Split Payment
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-700">
                        💵 Cash
                      </label>
                      <input
                        type="number"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm font-semibold focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-700">
                        📱 M-Pesa
                      </label>
                      <input
                        type="number"
                        value={mpesaAmount}
                        onChange={(e) => setMpesaAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm font-semibold focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                  {(() => {
                    const cash = parseFloat(cashAmount) || 0;
                    const mpesa = parseFloat(mpesaAmount) || 0;
                    const remaining = total - cash - mpesa;
                    return (
                      <div className="mt-3 p-3 bg-white rounded border border-gray-300">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">Paid:</span>
                          <span className="font-bold">
                            KSh {(cash + mpesa).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {remaining > 0 ? "Credit:" : "Change:"}
                          </span>
                          <span
                            className={`font-bold ${
                              remaining > 0
                                ? "text-orange-500"
                                : remaining < 0
                                ? "text-green-600"
                                : ""
                            }`}
                          >
                            KSh {Math.abs(remaining).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {(paymentMethod === "credit" ||
                (paymentMethod === "split" &&
                  parseFloat(cashAmount || 0) + parseFloat(mpesaAmount || 0) <
                    total)) && (
                <div className="mb-4 bg-orange-50 p-4 rounded-lg border border-orange-300">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="text-orange-500 mt-0.5" size={20} />
                    <h3 className="font-bold text-orange-700">
                      Customer Info Required
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-700">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer name"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-gray-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="0712345678"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs font-bold mb-1 text-gray-700">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows="2"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={processSale}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
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
