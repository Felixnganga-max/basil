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
const API_BASE_URL = "http://localhost:5000/api/inventory";

const api = {
  getCategories: () =>
    fetch(`${API_BASE_URL}/categories`).then((r) => r.json()),
  createCategory: (data) =>
    fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  deleteCategory: (id) =>
    fetch(`${API_BASE_URL}/categories/${id}`, { method: "DELETE" }).then((r) =>
      r.json(),
    ),

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
    fetch(`${API_BASE_URL}/products/${id}`, { method: "DELETE" }).then((r) =>
      r.json(),
    ),

  restockProduct: (id, data) =>
    fetch(`${API_BASE_URL}/products/${id}/restock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  getRestockHistory: () =>
    fetch(`${API_BASE_URL}/restock-history`).then((r) => r.json()),

  getStats: () => fetch(`${API_BASE_URL}/stats`).then((r) => r.json()),
};

// Helper: Prisma stores subcategories as JSON — normalize to array
const getSubcategories = (cat) => {
  if (!cat) return [];
  const subs = cat.subcategories;
  if (Array.isArray(subs)) return subs;
  if (typeof subs === "string") {
    try {
      return JSON.parse(subs);
    } catch {
      return [];
    }
  }
  return [];
};

const InventoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [restockHistory, setRestockHistory] = useState([]);
  const [currentUser] = useState({
    id: "user_default",
    fullName: "Admin User",
  });
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("products");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, inventoryRes, restockRes] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getRestockHistory(),
      ]);
      if (categoriesRes.success) setCategories(categoriesRes.data);
      if (inventoryRes.success) setInventory(inventoryRes.data);
      if (restockRes.success) setRestockHistory(restockRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      alert(
        "Failed to load data. Please check if the backend is running on http://localhost:5000",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================== CATEGORY ====================
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
              .filter(Boolean)
          : [],
      });
      if (response.success) {
        setCategories([...categories, response.data]);
        setCategoryForm({ name: "", subcategories: "" });
        setShowModal(false);
      } else {
        alert(response.message || "Failed to create category");
      }
    } catch (error) {
      alert("Failed to create category. Please try again.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const hasProducts = inventory.some(
      (item) => item.categoryId === categoryId,
    );
    if (hasProducts) {
      alert(
        "Cannot delete category with existing products. Please reassign or delete products first.",
      );
      return;
    }
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;
    try {
      const response = await api.deleteCategory(categoryId);
      if (response.success) {
        setCategories(categories.filter((cat) => cat.id !== categoryId)); // ✅ cat.id
      } else {
        alert(response.message || "Failed to delete category");
      }
    } catch (error) {
      alert("Failed to delete category. Please try again.");
    }
  };

  // ==================== PRODUCT ====================
  const handleAddProduct = async () => {
    if (
      !productForm.name ||
      !productForm.category ||
      !productForm.price ||
      !productForm.quantity
    ) {
      alert(
        "Please fill in all required fields (Name, Category, Price, Quantity)",
      );
      return;
    }
    try {
      const response = await api.createProduct({
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        category: productForm.category,
        subcategory: productForm.subcategory,
        price: parseFloat(productForm.price) || 0,
        costPrice: parseFloat(productForm.costPrice) || 0,
        quantity: parseInt(productForm.quantity) || 0,
        minQuantity: parseInt(productForm.minQuantity) || 5,
        sku: productForm.sku.trim() || `SKU-${Date.now()}`,
      });
      if (response.success) {
        setInventory([...inventory, response.data]);
        resetProductForm();
        setShowModal(false);
      } else {
        alert(response.message || "Failed to create product");
      }
    } catch (error) {
      alert("Failed to create product. Please try again.");
    }
  };

  const handleEditProduct = async () => {
    if (!selectedItem) return;
    try {
      const response = await api.updateProduct(selectedItem.id, {
        // ✅ selectedItem.id
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        category: productForm.category,
        subcategory: productForm.subcategory,
        price: parseFloat(productForm.price) || 0,
        costPrice: parseFloat(productForm.costPrice) || 0,
        minQuantity: parseInt(productForm.minQuantity) || 5,
        sku: productForm.sku.trim(),
      });
      if (response.success) {
        setInventory(
          inventory.map((item) =>
            item.id === selectedItem.id ? response.data : item,
          ),
        ); // ✅ item.id
        resetProductForm();
        setSelectedItem(null);
        setShowModal(false);
      } else {
        alert(response.message || "Failed to update product");
      }
    } catch (error) {
      alert("Failed to update product. Please try again.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      const response = await api.deleteProduct(productId);
      if (response.success) {
        setInventory(inventory.filter((item) => item.id !== productId)); // ✅ item.id
      } else {
        alert(response.message || "Failed to delete product");
      }
    } catch (error) {
      alert("Failed to delete product. Please try again.");
    }
  };

  // ==================== RESTOCK ====================
  const handleRestock = async () => {
    if (!selectedItem || !restockForm.quantityToAdd) {
      alert("Please enter quantity to add");
      return;
    }
    try {
      const response = await api.restockProduct(selectedItem.id, {
        // ✅ selectedItem.id
        quantityToAdd: parseInt(restockForm.quantityToAdd) || 0,
        costPrice:
          parseFloat(restockForm.costPrice) || selectedItem.costPrice || 0,
        supplier: restockForm.supplier.trim(),
        notes: restockForm.notes.trim(),
        restockedBy: currentUser?.id || "unknown",
        restockedByName: currentUser?.fullName || "Unknown",
      });
      if (response.success) {
        setInventory(
          inventory.map((item) =>
            item.id === selectedItem.id ? response.data.product : item,
          ),
        ); // ✅
        setRestockHistory([response.data.restockRecord, ...restockHistory]);
        resetRestockForm();
        setSelectedItem(null);
        setShowModal(false);
      } else {
        alert(response.message || "Failed to restock product");
      }
    } catch (error) {
      alert("Failed to restock product. Please try again.");
    }
  };

  // ==================== FORM HELPERS ====================
  const resetProductForm = () =>
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
  const resetRestockForm = () =>
    setRestockForm({
      quantityToAdd: "",
      costPrice: "",
      supplier: "",
      notes: "",
    });

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
      category: product.categoryId || "", // ✅ Prisma uses categoryId
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

  // ==================== FILTERING ====================
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || item.categoryId === filterCategory; // ✅
    const matchesLowStock =
      !lowStockOnly || (item.quantity || 0) <= (item.minQuantity || 5);
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const lowStockItems = inventory.filter(
    (item) => (item.quantity || 0) <= (item.minQuantity || 5),
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
            <div className="text-right">
              <p className="text-sm text-slate-500">Logged in as</p>
              <p className="font-semibold text-slate-900">
                {currentUser?.fullName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={28} />
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

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-slate-200 bg-slate-50 flex">
            {[
              {
                key: "products",
                label: `Products (${inventory.length})`,
                icon: <Box size={20} />,
              },
              {
                key: "categories",
                label: `Categories (${categories.length})`,
                icon: <Layers size={20} />,
              },
              {
                key: "restock",
                label: "Restock History",
                icon: <History size={20} />,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 font-semibold transition flex items-center gap-2 ${
                  activeTab === tab.key
                    ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="p-6">
              <div className="mb-6 flex flex-wrap gap-3">
                <div className="flex-1 min-w-64 relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                  />
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
                    </option> // ✅ cat.id
                  ))}
                </select>
                <button
                  onClick={() => setLowStockOnly(!lowStockOnly)}
                  className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition border-2 ${
                    lowStockOnly
                      ? "bg-amber-100 text-amber-800 border-amber-400"
                      : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <TrendingDown size={18} /> Low Stock Only
                </button>
                <button
                  onClick={openAddProductModal}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-semibold shadow-sm"
                >
                  <Plus size={20} /> Add Product
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      {[
                        "SKU",
                        "Product",
                        "Category",
                        "Price",
                        "Cost",
                        "Stock",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className={`px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider ${h === "Actions" || h === "Price" || h === "Cost" || h === "Stock" ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredInventory.map((product) => {
                      const isLowStock =
                        (product.quantity || 0) <= (product.minQuantity || 5);
                      return (
                        <tr
                          key={product.id}
                          className={
                            isLowStock
                              ? "bg-amber-50"
                              : "hover:bg-slate-50 transition"
                          }
                        >
                          {" "}
                          // ✅ product.id
                          <td className="px-4 py-4 text-sm font-mono text-slate-600">
                            {product.sku || "N/A"}
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-900">
                              {product.name}
                            </div>
                            {product.description && (
                              <div className="text-sm text-slate-500 mt-0.5">
                                {product.description}
                              </div>
                            )}
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
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${isLowStock ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}
                            >
                              {product.quantity} units
                            </span>
                            {isLowStock && (
                              <div className="text-xs text-red-600 mt-1 font-medium">
                                Min: {product.minQuantity}
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
                              </button>{" "}
                              // ✅ product.id
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
                  <Plus size={20} /> Add Category
                </button>
              </div>
              <div className="grid gap-6">
                {categories.map((category) => {
                  const subcategories = getSubcategories(category); // ✅ normalized
                  const categoryProducts = inventory.filter(
                    (p) => p.categoryId === category.id,
                  ); // ✅

                  return (
                    <div
                      key={category.id}
                      className="border-2 border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      {" "}
                      // ✅ category.id
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Layers className="text-white" size={24} />
                              <h3 className="font-bold text-2xl text-white">
                                {category.name}
                              </h3>
                              <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">
                                {categoryProducts.length} products
                              </span>
                            </div>
                            <p className="text-indigo-100 text-sm mt-2">
                              Created:{" "}
                              {new Date(
                                category.createdAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-white hover:bg-white/20 rounded-lg transition"
                          >
                            {" "}
                            // ✅ category.id
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                      {subcategories.length > 0 && (
                        <div className="p-5 bg-slate-50 border-b border-slate-200">
                          <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                            Subcategories ({subcategories.length})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {subcategories.map((sub, idx) => {
                              const subProducts = categoryProducts.filter(
                                (p) => p.subcategory === sub,
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
                                  key={product.id}
                                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${isLowStock ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}
                                >
                                  {" "}
                                  // ✅ product.id
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
                      {[
                        "Date",
                        "Product",
                        "Quantity",
                        "Cost Price",
                        "Supplier",
                        "Restocked By",
                        "Notes",
                      ].map((h) => (
                        <th
                          key={h}
                          className={`px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider ${h === "Quantity" || h === "Cost Price" ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {restockHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50">
                        {" "}
                        // ✅ record.id
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
                            {record.product?.sku || "N/A"}
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 font-medium"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option> // ✅ cat.id
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
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 font-medium disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="">Select Subcategory</option>
                        {productForm.category &&
                          getSubcategories(
                            categories.find(
                              (c) => c.id === productForm.category,
                            ),
                          ).map(
                            (
                              sub,
                              idx, // ✅ c.id + getSubcategories
                            ) => (
                              <option key={idx} value={sub}>
                                {sub}
                              </option>
                            ),
                          )}
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
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 font-mono"
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
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
