import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  AlertCircle,
  Search,
  TrendingDown,
  X,
  CheckCircle,
  Box,
  Layers,
  History,
} from "lucide-react";

// Storage keys
const STORAGE_KEYS = {
  CATEGORIES: "categories",
  INVENTORY: "inventory",
  RESTOCK_HISTORY: "restock_history",
  CURRENT_USER: "current_user",
};

// ID Generators
const generateId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const InventoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [restockHistory, setRestockHistory] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState("products");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Form States
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    price: "",
    costPrice: "",
    quantity: "",
    minQuantity: "",
    sku: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    subcategories: "",
  });

  const [restockForm, setRestockForm] = useState({
    quantityToAdd: "",
    costPrice: "",
    supplier: "",
    notes: "",
  });

  // Load data from window.storage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load categories
      try {
        const categoriesResult = await window.storage.get(
          STORAGE_KEYS.CATEGORIES
        );
        if (categoriesResult?.value) {
          setCategories(JSON.parse(categoriesResult.value));
        }
      } catch (error) {
        console.log("No categories found, starting fresh");
      }

      // Load inventory
      try {
        const inventoryResult = await window.storage.get(
          STORAGE_KEYS.INVENTORY
        );
        if (inventoryResult?.value) {
          setInventory(JSON.parse(inventoryResult.value));
        }
      } catch (error) {
        console.log("No inventory found, starting fresh");
      }

      // Load restock history
      try {
        const restockResult = await window.storage.get(
          STORAGE_KEYS.RESTOCK_HISTORY
        );
        if (restockResult?.value) {
          setRestockHistory(JSON.parse(restockResult.value));
        }
      } catch (error) {
        console.log("No restock history found, starting fresh");
      }

      // Load current user
      try {
        const userResult = await window.storage.get(STORAGE_KEYS.CURRENT_USER);
        if (userResult?.value) {
          setCurrentUser(JSON.parse(userResult.value));
        } else {
          const defaultUser = {
            id: "user_default",
            fullName: "Admin User",
          };
          setCurrentUser(defaultUser);
          await saveToStorage(STORAGE_KEYS.CURRENT_USER, defaultUser);
        }
      } catch (error) {
        const defaultUser = {
          id: "user_default",
          fullName: "Admin User",
        };
        setCurrentUser(defaultUser);
        await saveToStorage(STORAGE_KEYS.CURRENT_USER, defaultUser);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Category Management
  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert("Category name is required");
      return;
    }

    const newCategory = {
      id: generateId("cat"),
      name: categoryForm.name.trim(),
      subcategories: categoryForm.subcategories
        ? categoryForm.subcategories
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s)
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    const saved = await saveToStorage(
      STORAGE_KEYS.CATEGORIES,
      updatedCategories
    );

    if (saved) {
      setCategoryForm({ name: "", subcategories: "" });
      setShowModal(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const hasProducts = inventory.some((item) => item.category === categoryId);
    if (hasProducts) {
      alert(
        "Cannot delete category with existing products. Please reassign or delete products first."
      );
      return;
    }

    if (window.confirm("Are you sure you want to delete this category?")) {
      const updatedCategories = categories.filter(
        (cat) => cat.id !== categoryId
      );
      setCategories(updatedCategories);
      await saveToStorage(STORAGE_KEYS.CATEGORIES, updatedCategories);
    }
  };

  // Product Management
  const handleAddProduct = async () => {
    if (
      !productForm.name ||
      !productForm.category ||
      !productForm.price ||
      !productForm.quantity
    ) {
      alert(
        "Please fill in all required fields (Name, Category, Price, Quantity)"
      );
      return;
    }

    const categoryObj = categories.find(
      (cat) => cat.id === productForm.category
    );

    const newProduct = {
      id: generateId("prod"),
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      category: productForm.category,
      categoryName: categoryObj?.name || "",
      subcategory: productForm.subcategory,
      price: parseFloat(productForm.price) || 0,
      costPrice: parseFloat(productForm.costPrice) || 0,
      quantity: parseInt(productForm.quantity) || 0,
      minQuantity: parseInt(productForm.minQuantity) || 5,
      sku: productForm.sku.trim() || `SKU-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRestocked: new Date().toISOString(),
    };

    const updatedInventory = [...inventory, newProduct];
    setInventory(updatedInventory);
    const saved = await saveToStorage(STORAGE_KEYS.INVENTORY, updatedInventory);

    if (saved) {
      resetProductForm();
      setShowModal(false);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedItem) return;

    const categoryObj = categories.find(
      (cat) => cat.id === productForm.category
    );

    const updatedProduct = {
      ...selectedItem,
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      category: productForm.category,
      categoryName: categoryObj?.name || "",
      subcategory: productForm.subcategory,
      price: parseFloat(productForm.price) || 0,
      costPrice: parseFloat(productForm.costPrice) || 0,
      minQuantity: parseInt(productForm.minQuantity) || 5,
      sku: productForm.sku.trim(),
      updatedAt: new Date().toISOString(),
    };

    const updatedInventory = inventory.map((item) =>
      item.id === selectedItem.id ? updatedProduct : item
    );

    setInventory(updatedInventory);
    const saved = await saveToStorage(STORAGE_KEYS.INVENTORY, updatedInventory);

    if (saved) {
      resetProductForm();
      setSelectedItem(null);
      setShowModal(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const updatedInventory = inventory.filter(
        (item) => item.id !== productId
      );
      setInventory(updatedInventory);
      await saveToStorage(STORAGE_KEYS.INVENTORY, updatedInventory);
    }
  };

  // Restock Management
  const handleRestock = async () => {
    if (!selectedItem || !restockForm.quantityToAdd) {
      alert("Please enter quantity to add");
      return;
    }

    const quantityAdded = parseInt(restockForm.quantityToAdd) || 0;
    const previousQty = selectedItem.quantity || 0;
    const newQty = previousQty + quantityAdded;
    const costPrice =
      parseFloat(restockForm.costPrice) || selectedItem.costPrice || 0;

    const updatedProduct = {
      ...selectedItem,
      quantity: newQty,
      costPrice: costPrice,
      lastRestocked: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedInventory = inventory.map((item) =>
      item.id === selectedItem.id ? updatedProduct : item
    );

    const restockRecord = {
      id: generateId("restock"),
      productId: selectedItem.id,
      productName: selectedItem.name,
      quantityAdded: quantityAdded,
      previousQuantity: previousQty,
      newQuantity: newQty,
      costPrice: costPrice,
      totalCost: quantityAdded * costPrice,
      restockedBy: currentUser?.id || "unknown",
      restockedByName: currentUser?.fullName || "Unknown",
      date: new Date().toISOString(),
      supplier: restockForm.supplier.trim(),
      notes: restockForm.notes.trim(),
    };

    const updatedRestockHistory = [restockRecord, ...restockHistory];

    setInventory(updatedInventory);
    setRestockHistory(updatedRestockHistory);

    const inventorySaved = await saveToStorage(
      STORAGE_KEYS.INVENTORY,
      updatedInventory
    );
    const historySaved = await saveToStorage(
      STORAGE_KEYS.RESTOCK_HISTORY,
      updatedRestockHistory
    );

    if (inventorySaved && historySaved) {
      resetRestockForm();
      setSelectedItem(null);
      setShowModal(false);
    }
  };

  // Form Helpers
  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      category: "",
      subcategory: "",
      price: "",
      costPrice: "",
      quantity: "",
      minQuantity: "",
      sku: "",
    });
  };

  const resetRestockForm = () => {
    setRestockForm({
      quantityToAdd: "",
      costPrice: "",
      supplier: "",
      notes: "",
    });
  };

  const openAddProductModal = () => {
    resetProductForm();
    setSelectedItem(null);
    setModalType("addProduct");
    setShowModal(true);
  };

  const openEditProductModal = (product) => {
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "",
      subcategory: product.subcategory || "",
      price: (product.price || 0).toString(),
      costPrice: (product.costPrice || 0).toString(),
      quantity: (product.quantity || 0).toString(),
      minQuantity: (product.minQuantity || 5).toString(),
      sku: product.sku || "",
    });
    setSelectedItem(product);
    setModalType("editProduct");
    setShowModal(true);
  };

  const openRestockModal = (product) => {
    setRestockForm({
      quantityToAdd: "",
      costPrice: (product.costPrice || 0).toString(),
      supplier: "",
      notes: "",
    });
    setSelectedItem(product);
    setModalType("restock");
    setShowModal(true);
  };

  const openAddCategoryModal = () => {
    setCategoryForm({ name: "", subcategories: "" });
    setModalType("addCategory");
    setShowModal(true);
  };

  // Filtering
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;
    const matchesLowStock =
      !lowStockOnly || (item.quantity || 0) <= (item.minQuantity || 5);

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockItems = inventory.filter(
    (item) => (item.quantity || 0) <= (item.minQuantity || 5)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-6 text-slate-600 font-medium">
            Loading inventory...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">
                Inventory Management
              </h1>
              <p className="text-slate-600">
                Manage products, categories, and stock levels
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-500">Logged in as</p>
                <p className="font-semibold text-slate-900">
                  {currentUser?.fullName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="text-amber-600" size={28} />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-bold text-amber-900 text-lg">
                  Low Stock Alert
                </h3>
                <p className="text-amber-800 mt-1">
                  {lowStockItems.length} product
                  {lowStockItems.length !== 1 ? "s" : ""} running low on stock
                </p>
              </div>
              <button
                onClick={() => setLowStockOnly(true)}
                className="ml-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium"
              >
                View Items
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50">
            <div className="flex">
              <button
                onClick={() => setActiveTab("products")}
                className={`px-6 py-4 font-semibold transition flex items-center gap-2 ${
                  activeTab === "products"
                    ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Box size={20} />
                Products ({inventory.length})
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`px-6 py-4 font-semibold transition flex items-center gap-2 ${
                  activeTab === "categories"
                    ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Layers size={20} />
                Categories ({categories.length})
              </button>
              <button
                onClick={() => setActiveTab("restock")}
                className={`px-6 py-4 font-semibold transition flex items-center gap-2 ${
                  activeTab === "restock"
                    ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <History size={20} />
                Restock History
              </button>
            </div>
          </div>

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="p-6">
              {/* Search and Filters */}
              <div className="mb-6 flex flex-wrap gap-3">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search products by name or SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                    />
                  </div>
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 font-medium"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setLowStockOnly(!lowStockOnly)}
                  className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition ${
                    lowStockOnly
                      ? "bg-amber-100 text-amber-800 border-2 border-amber-400 shadow-sm"
                      : "bg-slate-100 text-slate-700 border-2 border-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <TrendingDown size={18} />
                  Low Stock Only
                </button>

                <button
                  onClick={openAddProductModal}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-semibold shadow-sm"
                >
                  <Plus size={20} />
                  Add Product
                </button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredInventory.map((product) => {
                      const quantity = product.quantity || 0;
                      const minQuantity = product.minQuantity || 5;
                      const isLowStock = quantity <= minQuantity;
                      return (
                        <tr
                          key={product.id}
                          className={
                            isLowStock
                              ? "bg-amber-50"
                              : "hover:bg-slate-50 transition"
                          }
                        >
                          <td className="px-4 py-4 text-sm font-mono text-slate-600">
                            {product.sku || "N/A"}
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-semibold text-slate-900">
                                {product.name || "Unnamed Product"}
                              </div>
                              {product.description && (
                                <div className="text-sm text-slate-500 mt-0.5">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <div className="font-medium text-slate-900">
                              {product.categoryName || "Uncategorized"}
                            </div>
                            {product.subcategory && (
                              <div className="text-xs text-slate-500 mt-0.5">
                                {product.subcategory}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
                            KES {(product.price || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-slate-600 font-medium">
                            KES {(product.costPrice || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                isLowStock
                                  ? "bg-red-100 text-red-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {quantity} units
                            </span>
                            {isLowStock && (
                              <div className="text-xs text-red-600 mt-1 font-medium">
                                Min: {minQuantity}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openRestockModal(product)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Restock"
                              >
                                <Package size={18} />
                              </button>
                              <button
                                onClick={() => openEditProductModal(product)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredInventory.length === 0 && (
                  <div className="text-center py-16 bg-white">
                    <Box className="mx-auto text-slate-300 mb-4" size={64} />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No products found
                    </h3>
                    <p className="text-slate-500">
                      Add your first product to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div className="p-6">
              <div className="mb-6">
                <button
                  onClick={openAddCategoryModal}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-semibold shadow-sm"
                >
                  <Plus size={20} />
                  Add Category
                </button>
              </div>

              <div className="grid gap-6">
                {categories.map((category) => {
                  const categoryProducts = inventory.filter(
                    (p) => p.category === category.id
                  );
                  const hasSubcategories =
                    category.subcategories && category.subcategories.length > 0;

                  return (
                    <div
                      key={category.id}
                      className="border-2 border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      {/* Category Header */}
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Layers className="text-white" size={24} />
                              <h3 className="font-bold text-2xl text-white">
                                {category.name}
                              </h3>
                              <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full backdrop-blur">
                                {categoryProducts.length} products
                              </span>
                            </div>
                            <p className="text-indigo-100 text-sm mt-2">
                              Created:{" "}
                              {new Date(
                                category.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-white hover:bg-white/20 rounded-lg transition"
                            title="Delete Category"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {hasSubcategories && (
                        <div className="p-5 bg-slate-50 border-b border-slate-200">
                          <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                            Subcategories ({category.subcategories.length})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {category.subcategories.map((sub, idx) => {
                              const subProducts = categoryProducts.filter(
                                (p) => p.subcategory === sub
                              );
                              return (
                                <div
                                  key={idx}
                                  className="bg-white border-2 border-slate-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition"
                                >
                                  <p className="font-semibold text-slate-900 text-sm">
                                    {sub}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1 font-medium">
                                    {subProducts.length} items
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Products */}
                      {categoryProducts.length > 0 && (
                        <div className="p-5">
                          <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                            Products in this Category
                          </h4>
                          <div className="space-y-3">
                            {categoryProducts.slice(0, 5).map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Box size={16} className="text-slate-400" />
                                    <span className="font-medium text-slate-900">
                                      {product.name}
                                    </span>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                        product.quantity <= product.minQuantity
                                          ? "bg-red-100 text-red-800"
                                          : "bg-emerald-100 text-emerald-800"
                                      }`}
                                    >
                                      {product.quantity} units
                                    </span>
                                  </div>
                                  <div className="text-sm text-slate-500 mt-1 ml-6">
                                    SKU: {product.sku || "N/A"} | Price: KES{" "}
                                    {product.price.toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      openEditProductModal(product)
                                    }
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteProduct(product.id)
                                    }
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {categoryProducts.length > 5 && (
                              <div className="text-center pt-2">
                                <button
                                  onClick={() => {
                                    setActiveTab("products");
                                    setFilterCategory(category.id);
                                  }}
                                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                  View all {categoryProducts.length} products →
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {categoryProducts.length === 0 && (
                        <div className="p-5 text-center">
                          <div className="text-slate-400 mb-2">
                            <Box size={32} className="mx-auto" />
                          </div>
                          <p className="text-slate-500 font-medium">
                            No products in this category yet
                          </p>
                          <button
                            onClick={() => {
                              setActiveTab("products");
                              openAddProductModal();
                              setProductForm((prev) => ({
                                ...prev,
                                category: category.id,
                              }));
                            }}
                            className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Add first product →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {categories.length === 0 && (
                  <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                    <Layers className="mx-auto text-slate-400 mb-4" size={64} />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No categories yet
                    </h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">
                      Categories help organize your products. Create your first
                      category to get started.
                    </p>
                    <button
                      onClick={openAddCategoryModal}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-semibold shadow-sm mx-auto"
                    >
                      <Plus size={20} />
                      Create First Category
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Restock History Tab */}
          {activeTab === "restock" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Restock History
                </h2>
                <p className="text-slate-600">
                  Track all inventory restocking activities
                </p>
              </div>

              {restockHistory.length > 0 ? (
                <div className="space-y-4">
                  {restockHistory.map((record) => (
                    <div
                      key={record.id}
                      className="border-2 border-slate-200 rounded-xl bg-white p-5 hover:shadow-md transition"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                              <Package className="text-emerald-600" size={20} />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-slate-900">
                                {record.productName}
                              </h3>
                              <p className="text-sm text-slate-500">
                                Restocked by {record.restockedByName}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-12">
                            <div>
                              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                                Quantity Added
                              </p>
                              <p className="font-bold text-lg text-emerald-600">
                                +{record.quantityAdded}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                                New Total
                              </p>
                              <p className="font-bold text-lg text-slate-900">
                                {record.newQuantity} units
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                                Cost Price
                              </p>
                              <p className="font-bold text-lg text-slate-900">
                                KES {record.costPrice?.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                                Total Cost
                              </p>
                              <p className="font-bold text-lg text-slate-900">
                                KES {record.totalCost?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(record.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      {(record.supplier || record.notes) && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="flex flex-wrap gap-4">
                            {record.supplier && (
                              <div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                                  Supplier
                                </p>
                                <p className="text-sm font-medium text-slate-900">
                                  {record.supplier}
                                </p>
                              </div>
                            )}
                            {record.notes && (
                              <div className="flex-1">
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                                  Notes
                                </p>
                                <p className="text-sm text-slate-900">
                                  {record.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                  <History className="mx-auto text-slate-400 mb-4" size={64} />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No restock history yet
                  </h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    Restock history will appear here when you add stock to your
                    products.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab("products");
                      if (inventory.length > 0) {
                        openRestockModal(inventory[0]);
                      }
                    }}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 font-semibold shadow-sm mx-auto"
                  >
                    <Package size={20} />
                    Restock a Product
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-slate-200 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {modalType === "addProduct" && "Add New Product"}
                    {modalType === "editProduct" && "Edit Product"}
                    {modalType === "restock" && "Restock Product"}
                    {modalType === "addCategory" && "Add New Category"}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    {modalType === "addProduct" &&
                      "Add a new product to your inventory"}
                    {modalType === "editProduct" &&
                      "Update product details and pricing"}
                    {modalType === "restock" &&
                      "Add stock and update cost information"}
                    {modalType === "addCategory" &&
                      "Create a new product category"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedItem(null);
                    resetProductForm();
                    resetRestockForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X size={24} className="text-slate-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Add/Edit Product Form */}
              {(modalType === "addProduct" || modalType === "editProduct") && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      placeholder="Enter product description"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            category: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Subcategory
                      </label>
                      <select
                        value={productForm.subcategory}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            subcategory: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      >
                        <option value="">Select Subcategory</option>
                        {productForm.category &&
                          categories
                            .find((c) => c.id === productForm.category)
                            ?.subcategories?.map((sub) => (
                              <option key={sub} value={sub}>
                                {sub}
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Selling Price (KES) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            price: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Cost Price (KES)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.costPrice}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            costPrice: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {modalType === "addProduct" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Initial Quantity *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={productForm.quantity}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              quantity: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Min. Stock Level
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={productForm.minQuantity}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              minQuantity: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                          placeholder="5"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={productForm.sku}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            sku: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                    {modalType === "editProduct" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Min. Stock Level
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={productForm.minQuantity}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              minQuantity: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                          placeholder="5"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Restock Form */}
              {modalType === "restock" && selectedItem && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Box className="text-indigo-600" size={20} />
                      <h3 className="font-bold text-slate-900">
                        {selectedItem.name}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">Current Stock</p>
                        <p className="font-bold text-lg text-slate-900">
                          {selectedItem.quantity} units
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Minimum Required</p>
                        <p className="font-bold text-lg text-amber-600">
                          {selectedItem.minQuantity || 5} units
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Quantity to Add *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={restockForm.quantityToAdd}
                      onChange={(e) =>
                        setRestockForm({
                          ...restockForm,
                          quantityToAdd: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Cost Price per Unit (KES)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={restockForm.costPrice}
                      onChange={(e) =>
                        setRestockForm({
                          ...restockForm,
                          costPrice: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      placeholder="Enter cost price"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Current: KES {selectedItem.costPrice?.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={restockForm.supplier}
                      onChange={(e) =>
                        setRestockForm({
                          ...restockForm,
                          supplier: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      placeholder="Enter supplier name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={restockForm.notes}
                      onChange={(e) =>
                        setRestockForm({
                          ...restockForm,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      placeholder="Any additional notes"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* Add Category Form */}
              {modalType === "addCategory" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      placeholder="Enter category name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Subcategories
                    </label>
                    <textarea
                      value={categoryForm.subcategories}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          subcategories: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      placeholder="Enter subcategories separated by commas"
                      rows={3}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Example: Premium, Standard, Budget
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 p-6">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedItem(null);
                    resetProductForm();
                    resetRestockForm();
                  }}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (modalType === "addProduct") handleAddProduct();
                    if (modalType === "editProduct") handleEditProduct();
                    if (modalType === "restock") handleRestock();
                    if (modalType === "addCategory") handleAddCategory();
                  }}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  {modalType === "addProduct" && "Add Product"}
                  {modalType === "editProduct" && "Update Product"}
                  {modalType === "restock" && "Restock"}
                  {modalType === "addCategory" && "Add Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {inventory.length}
            </div>
            <div className="text-sm text-slate-600 font-medium">
              Total Products
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-1">
              {inventory.reduce((sum, item) => sum + (item.quantity || 0), 0)}
            </div>
            <div className="text-sm text-slate-600 font-medium">
              Total Stock
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600 mb-1">
              {lowStockItems.length}
            </div>
            <div className="text-sm text-slate-600 font-medium">
              Low Stock Items
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-1">
              {categories.length}
            </div>
            <div className="text-sm text-slate-600 font-medium">Categories</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;
