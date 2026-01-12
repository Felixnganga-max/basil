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

// API Configuration
const API_BASE_URL = "https://basil-bhmb.vercel.app/api/inventory";

// API Helper Functions
const api = {
  // Categories
  getCategories: () =>
    fetch(`${API_BASE_URL}/categories`).then((r) => r.json()),
  createCategory: (data) =>
    fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  deleteCategory: (id) =>
    fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "DELETE",
    }).then((r) => r.json()),

  // Products
  getProducts: (query = "") =>
    fetch(`${API_BASE_URL}/products${query}`).then((r) => r.json()),
  createProduct: (data) =>
    fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  updateProduct: (id, data) =>
    fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  deleteProduct: (id) =>
    fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
    }).then((r) => r.json()),

  // Restock
  restockProduct: (id, data) =>
    fetch(`${API_BASE_URL}/products/${id}/restock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  getRestockHistory: () =>
    fetch(`${API_BASE_URL}/restock-history`).then((r) => r.json()),

  // Stats
  getStats: () => fetch(`${API_BASE_URL}/stats`).then((r) => r.json()),
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

  // Load data from API on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load categories
      const categoriesRes = await api.getCategories();
      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }

      // Load inventory
      const inventoryRes = await api.getProducts();
      if (inventoryRes.success) {
        setInventory(inventoryRes.data);
      }

      // Load restock history
      const restockRes = await api.getRestockHistory();
      if (restockRes.success) {
        setRestockHistory(restockRes.data);
      }

      // Set current user
      const defaultUser = {
        id: "user_default",
        fullName: "Admin User",
      };
      setCurrentUser(defaultUser);
    } catch (error) {
      console.error("Error loading data:", error);
      alert(
        "Failed to load data. Please check if the backend is running on http://localhost:5000"
      );
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

    try {
      const response = await api.createCategory({
        name: categoryForm.name.trim(),
        subcategories: categoryForm.subcategories
          ? categoryForm.subcategories
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
          : [],
      });

      if (response.success) {
        setCategories([...categories, response.data]);
        setCategoryForm({ name: "", subcategories: "" });
        setShowModal(false);
        alert("Category created successfully!");
      } else {
        alert(response.message || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category. Please try again.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const hasProducts = inventory.some(
      (item) =>
        item.category?._id === categoryId || item.category === categoryId
    );
    if (hasProducts) {
      alert(
        "Cannot delete category with existing products. Please reassign or delete products first."
      );
      return;
    }

    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        const response = await api.deleteCategory(categoryId);
        if (response.success) {
          setCategories(categories.filter((cat) => cat._id !== categoryId));
          alert("Category deleted successfully!");
        } else {
          alert(response.message || "Failed to delete category");
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Failed to delete category. Please try again.");
      }
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

    try {
      const productData = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        category: productForm.category,
        subcategory: productForm.subcategory,
        price: parseFloat(productForm.price) || 0,
        costPrice: parseFloat(productForm.costPrice) || 0,
        quantity: parseInt(productForm.quantity) || 0,
        minQuantity: parseInt(productForm.minQuantity) || 5,
        sku: productForm.sku.trim() || `SKU-${Date.now()}`,
      };

      const response = await api.createProduct(productData);

      if (response.success) {
        setInventory([...inventory, response.data]);
        resetProductForm();
        setShowModal(false);
        alert("Product added successfully!");
      } else {
        alert(response.message || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product. Please try again.");
    }
  };

  const handleEditProduct = async () => {
    if (!selectedItem) return;

    try {
      const productData = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        category: productForm.category,
        subcategory: productForm.subcategory,
        price: parseFloat(productForm.price) || 0,
        costPrice: parseFloat(productForm.costPrice) || 0,
        minQuantity: parseInt(productForm.minQuantity) || 5,
        sku: productForm.sku.trim(),
      };

      const response = await api.updateProduct(selectedItem._id, productData);

      if (response.success) {
        const updatedInventory = inventory.map((item) =>
          item._id === selectedItem._id ? response.data : item
        );
        setInventory(updatedInventory);
        resetProductForm();
        setSelectedItem(null);
        setShowModal(false);
        alert("Product updated successfully!");
      } else {
        alert(response.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product. Please try again.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await api.deleteProduct(productId);
        if (response.success) {
          setInventory(inventory.filter((item) => item._id !== productId));
          alert("Product deleted successfully!");
        } else {
          alert(response.message || "Failed to delete product");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  // Restock Management
  const handleRestock = async () => {
    if (!selectedItem || !restockForm.quantityToAdd) {
      alert("Please enter quantity to add");
      return;
    }

    try {
      const restockData = {
        quantityToAdd: parseInt(restockForm.quantityToAdd) || 0,
        costPrice:
          parseFloat(restockForm.costPrice) || selectedItem.costPrice || 0,
        supplier: restockForm.supplier.trim(),
        notes: restockForm.notes.trim(),
        restockedBy: currentUser?.id || "unknown",
        restockedByName: currentUser?.fullName || "Unknown",
      };

      const response = await api.restockProduct(selectedItem._id, restockData);

      if (response.success) {
        const updatedInventory = inventory.map((item) =>
          item._id === selectedItem._id ? response.data.product : item
        );
        setInventory(updatedInventory);
        setRestockHistory([response.data.restockRecord, ...restockHistory]);
        resetRestockForm();
        setSelectedItem(null);
        setShowModal(false);
        alert("Product restocked successfully!");
      } else {
        alert(response.message || "Failed to restock product");
      }
    } catch (error) {
      console.error("Error restocking product:", error);
      alert("Failed to restock product. Please try again.");
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
    const categoryId = product.category?._id || product.category;
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      category: categoryId || "",
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
    const categoryId = item.category?._id || item.category;
    const matchesCategory =
      filterCategory === "all" || categoryId === filterCategory;
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
                    <option key={cat._id} value={cat._id}>
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
                      const categoryName =
                        product.category?.name ||
                        product.categoryName ||
                        "Uncategorized";

                      return (
                        <tr
                          key={product._id}
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
                              {categoryName}
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
                                onClick={() => handleDeleteProduct(product._id)}
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
                  const categoryProducts = inventory.filter((p) => {
                    const productCategoryId = p.category?._id || p.category;
                    return productCategoryId === category._id;
                  });
                  const hasSubcategories =
                    category.subcategories && category.subcategories.length > 0;

                  return (
                    <div
                      key={category._id}
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
                            onClick={() => handleDeleteCategory(category._id)}
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
                                    {subProducts.length} products
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Products in Category */}
                      {categoryProducts.length > 0 && (
                        <div className="p-5">
                          <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                            Products in this category
                          </h4>
                          <div className="grid gap-3">
                            {categoryProducts.map((product) => {
                              const isLowStock =
                                (product.quantity || 0) <=
                                (product.minQuantity || 5);
                              return (
                                <div
                                  key={product._id}
                                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                                    isLowStock
                                      ? "bg-amber-50 border-amber-200"
                                      : "bg-slate-50 border-slate-200"
                                  }`}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-semibold text-slate-900">
                                        {product.name}
                                      </h5>
                                      {isLowStock && (
                                        <AlertCircle
                                          className="text-amber-600"
                                          size={16}
                                        />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-sm">
                                      <span className="text-slate-600 font-mono">
                                        {product.sku}
                                      </span>
                                      {product.subcategory && (
                                        <span className="text-slate-500">
                                          {product.subcategory}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="font-bold text-slate-900">
                                        KES{" "}
                                        {(product.price || 0).toLocaleString()}
                                      </div>
                                      <div className="text-sm text-slate-600">
                                        Stock: {product.quantity || 0}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {categories.length === 0 && (
                  <div className="text-center py-16 bg-white border-2 border-slate-200 rounded-xl">
                    <Layers className="mx-auto text-slate-300 mb-4" size={64} />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No categories yet
                    </h3>
                    <p className="text-slate-500">
                      Add your first category to organize your products.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Restock History Tab */}
          {activeTab === "restock" && (
            <div className="p-6">
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Cost Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Restocked By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {restockHistory.map((record) => (
                      <tr key={record._id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {new Date(record.date).toLocaleDateString()}{" "}
                          {new Date(record.date).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900">
                            {record.product?.name ||
                              record.productName ||
                              "Unknown"}
                          </div>
                          <div className="text-sm text-slate-500 font-mono">
                            {record.product?.sku || record.productSku || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold">
                            +{record.quantityAdded || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                          KES {(record.costPrice || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {record.supplier || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {record.restockedByName || "Unknown"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {record.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {restockHistory.length === 0 && (
                  <div className="text-center py-16 bg-white">
                    <History
                      className="mx-auto text-slate-300 mb-4"
                      size={64}
                    />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      No restock history yet
                    </h3>
                    <p className="text-slate-500">
                      Restock records will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {modalType === "addProduct" && "Add New Product"}
                {modalType === "editProduct" && "Edit Product"}
                {modalType === "restock" && "Restock Product"}
                {modalType === "addCategory" && "Add New Category"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Add/Edit Product Form */}
              {(modalType === "addProduct" || modalType === "editProduct") && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
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
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                      placeholder="Enter product description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
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
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 font-medium"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
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
                        disabled={!productForm.category}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 font-medium disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="">Select Subcategory</option>
                        {productForm.category &&
                          categories
                            .find((c) => c._id === productForm.category)
                            ?.subcategories?.map((sub, idx) => (
                              <option key={idx} value={sub}>
                                {sub}
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
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
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
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
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {modalType === "addProduct" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
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
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
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
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                          placeholder="5"
                        />
                      </div>
                    </div>
                  )}

                  {modalType === "editProduct" && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
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
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                        placeholder="5"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) =>
                        setProductForm({ ...productForm, sku: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 font-mono"
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-5 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={
                        modalType === "addProduct"
                          ? handleAddProduct
                          : handleEditProduct
                      }
                      className="flex-1 px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold shadow-sm"
                    >
                      {modalType === "addProduct"
                        ? "Add Product"
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}

              {/* Restock Form */}
              {modalType === "restock" && selectedItem && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                    <h3 className="font-bold text-indigo-900 text-lg mb-2">
                      {selectedItem.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-indigo-600 font-medium">
                          Current Stock
                        </p>
                        <p className="text-2xl font-bold text-indigo-900 mt-1">
                          {selectedItem.quantity || 0} units
                        </p>
                      </div>
                      <div>
                        <p className="text-indigo-600 font-medium">SKU</p>
                        <p className="text-lg font-mono text-indigo-900 mt-1">
                          {selectedItem.sku || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Cost Price (KES)
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                      placeholder="Enter supplier name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
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
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                      placeholder="Enter any additional notes"
                    />
                  </div>

                  {restockForm.quantityToAdd && (
                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-emerald-900 mb-2">
                        <CheckCircle size={20} />
                        <span className="font-bold">New Stock Level</span>
                      </div>
                      <p className="text-3xl font-bold text-emerald-900">
                        {(selectedItem.quantity || 0) +
                          parseInt(restockForm.quantityToAdd || 0)}{" "}
                        units
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-5 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRestock}
                      className="flex-1 px-5 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold shadow-sm"
                    >
                      Confirm Restock
                    </button>
                  </div>
                </div>
              )}

              {/* Add Category Form */}
              {modalType === "addCategory" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                      placeholder="Enter category name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Subcategories (comma-separated)
                    </label>
                    <textarea
                      value={categoryForm.subcategories}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          subcategories: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                      placeholder="e.g., Small, Medium, Large"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Separate multiple subcategories with commas
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-5 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCategory}
                      className="flex-1 px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold shadow-sm"
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
