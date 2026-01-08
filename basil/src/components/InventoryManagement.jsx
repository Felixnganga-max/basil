import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  AlertCircle,
  Search,
  TrendingDown,
} from "lucide-react";

// Storage keys - using window.storage instead of localStorage
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
          // Set default user if none exists
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

  const saveToStorage = async (key, data) => {
    try {
      await window.storage.set(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      alert(`Failed to save data. Please try again.`);
      return false;
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

    // Update inventory
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

    // Create restock record
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Inventory Management
          </h1>
          <p className="text-gray-600">
            Manage products, categories, and stock levels
          </p>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 mr-3" size={24} />
              <div>
                <p className="font-semibold text-red-800">Low Stock Alert</p>
                <p className="text-red-700 text-sm">
                  {lowStockItems.length} product(s) are running low on stock
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab("products")}
                className={`px-6 py-3 font-medium ${
                  activeTab === "products"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Products ({inventory.length})
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`px-6 py-3 font-medium ${
                  activeTab === "categories"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Categories ({categories.length})
              </button>
              <button
                onClick={() => setActiveTab("restock")}
                className={`px-6 py-3 font-medium ${
                  activeTab === "restock"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Restock History
              </button>
            </div>
          </div>

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="p-6">
              {/* Search and Filters */}
              <div className="mb-6 flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    lowStockOnly
                      ? "bg-red-100 text-red-700 border border-red-300"
                      : "bg-gray-100 text-gray-700 border border-gray-300"
                  }`}
                >
                  <TrendingDown size={18} />
                  Low Stock Only
                </button>

                <button
                  onClick={openAddProductModal}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Product
                </button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Category
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Cost
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredInventory.map((product) => {
                      const quantity = product.quantity || 0;
                      const minQuantity = product.minQuantity || 5;
                      const isLowStock = quantity <= minQuantity;
                      return (
                        <tr
                          key={product.id}
                          className={
                            isLowStock ? "bg-red-50" : "hover:bg-gray-50"
                          }
                        >
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {product.sku || "N/A"}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">
                                {product.name || "Unnamed Product"}
                              </div>
                              {product.description && (
                                <div className="text-sm text-gray-500">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="text-gray-900">
                              {product.categoryName || "Uncategorized"}
                            </div>
                            {product.subcategory && (
                              <div className="text-xs text-gray-500">
                                {product.subcategory}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            KES {(product.price || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">
                            KES {(product.costPrice || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isLowStock
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {quantity} units
                            </span>
                            {isLowStock && (
                              <div className="text-xs text-red-600 mt-1">
                                Min: {minQuantity}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openRestockModal(product)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Restock"
                              >
                                <Package size={18} />
                              </button>
                              <button
                                onClick={() => openEditProductModal(product)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
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
                  <div className="text-center py-12 text-gray-500">
                    No products found. Add your first product to get started.
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Category
                </button>
              </div>

              <div className="space-y-6">
                {categories.map((category) => {
                  const categoryProducts = inventory.filter(
                    (p) => p.category === category.id
                  );
                  const hasSubcategories =
                    category.subcategories && category.subcategories.length > 0;

                  return (
                    <div
                      key={category.id}
                      className="border rounded-lg bg-white overflow-hidden"
                    >
                      {/* Category Header */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-xl text-gray-900">
                                📁 {category.name}
                              </h3>
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                {categoryProducts.length} products
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Created:{" "}
                              {new Date(
                                category.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Category"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {hasSubcategories && (
                        <div className="p-4 bg-gray-50">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <span>📂</span>
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
                                  className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 text-sm">
                                        {sub}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {subProducts.length} items
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Products in this category */}
                      {categoryProducts.length > 0 && (
                        <div className="p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Products in this category
                          </h4>
                          <div className="space-y-2">
                            {categoryProducts.slice(0, 5).map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 text-sm">
                                    {product.name}
                                  </p>
                                  {product.subcategory && (
                                    <p className="text-xs text-gray-500">
                                      📂 {product.subcategory}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {product.quantity || 0} units
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    KES {(product.price || 0).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {categoryProducts.length > 5 && (
                              <p className="text-xs text-gray-500 text-center pt-2">
                                + {categoryProducts.length - 5} more products
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {categoryProducts.length === 0 && (
                        <div className="p-6 text-center text-gray-500 text-sm">
                          No products in this category yet
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {categories.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-lg font-semibold mb-2">
                    No categories yet
                  </h3>
                  <p className="text-sm">
                    Create your first category to organize products into folders
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Restock History Tab */}
          {activeTab === "restock" && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Qty Added
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Cost/Unit
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                        Total Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Supplier
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {restockHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {record.date
                            ? new Date(record.date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {record.productName || "Unknown Product"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          +{record.quantityAdded || 0}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          KES {(record.costPrice || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          KES {(record.totalCost || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {record.restockedByName || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {record.supplier || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {restockHistory.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No restock history yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {modalType === "addProduct" && "Add New Product"}
                {modalType === "editProduct " && "Edit Product"}
                {modalType === "addCategory" && "Add New Category"}
                {modalType === "restock" && "Restock Product"}
              </h2>
            </div>

            <div className="p-6">
              {/* Add/Edit Product Form */}
              {(modalType === "addProduct" || modalType === "editProduct") && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Product description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            category: e.target.value,
                            subcategory: "",
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={!productForm.category}
                      >
                        <option value="">None</option>
                        {productForm.category &&
                          categories
                            .find((c) => c.id === productForm.category)
                            ?.subcategories.map((sub, idx) => (
                              <option key={idx} value={sub}>
                                {sub}
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Selling Price (KES) *
                      </label>
                      <input
                        type="number"
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            price: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost Price (KES)
                      </label>
                      <input
                        type="number"
                        value={productForm.costPrice}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            costPrice: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {modalType === "addProduct" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Initial Quantity *
                        </label>
                        <input
                          type="number"
                          value={productForm.quantity}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              quantity: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Quantity
                        </label>
                        <input
                          type="number"
                          value={productForm.minQuantity}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              minQuantity: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="5"
                          min="0"
                        />
                      </div>
                    </div>
                  )}

                  {modalType === "editProduct" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Quantity Alert
                      </label>
                      <input
                        type="number"
                        value={productForm.minQuantity}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            minQuantity: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="5"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Current stock: {selectedItem?.quantity || 0} units. Use
                        restock to add more inventory.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) =>
                        setProductForm({ ...productForm, sku: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                </div>
              )}

              {/* Add Category Form */}
              {modalType === "addCategory" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Suspension Parts"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategories (Optional)
                    </label>
                    <textarea
                      value={categoryForm.subcategories}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          subcategories: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Enter subcategories separated by commas&#10;e.g., Front Forks, Rear Shock, Bearings"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple subcategories with commas
                    </p>
                  </div>
                </div>
              )}

              {/* Restock Form */}
              {modalType === "restock" && selectedItem && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {selectedItem.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Current Stock:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {selectedItem.quantity || 0} units
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Current Cost:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          KES {selectedItem.costPrice || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity to Add *
                    </label>
                    <input
                      type="number"
                      value={restockForm.quantityToAdd}
                      onChange={(e) =>
                        setRestockForm({
                          ...restockForm,
                          quantityToAdd: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="1"
                    />
                    {restockForm.quantityToAdd && (
                      <p className="text-xs text-gray-500 mt-1">
                        New stock level:{" "}
                        {(selectedItem.quantity || 0) +
                          parseInt(restockForm.quantityToAdd || 0)}{" "}
                        units
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price per Unit (KES)
                    </label>
                    <input
                      type="number"
                      value={restockForm.costPrice}
                      onChange={(e) =>
                        setRestockForm({
                          ...restockForm,
                          costPrice: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {restockForm.quantityToAdd && restockForm.costPrice && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-600">Total Cost:</span>
                      <span className="font-bold text-lg text-gray-900 ml-2">
                        KES{" "}
                        {(
                          parseInt(restockForm.quantityToAdd) *
                          parseFloat(restockForm.costPrice)
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Supplier name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Additional notes about this restock..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedItem(null);
                  resetProductForm();
                  resetRestockForm();
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (modalType === "addProduct") handleAddProduct();
                  else if (modalType === "editProduct") handleEditProduct();
                  else if (modalType === "addCategory") handleAddCategory();
                  else if (modalType === "restock") handleRestock();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {modalType === "addProduct" && "Add Product"}
                {modalType === "editProduct" && "Save Changes"}
                {modalType === "addCategory" && "Add Category"}
                {modalType === "restock" && "Confirm Restock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
