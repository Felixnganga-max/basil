import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Tag,
} from "lucide-react";

const SalesReport = () => {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expandedSale, setExpandedSale] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load from localStorage
    const salesData = JSON.parse(localStorage.getItem("sales") || "[]");
    const inventoryData = JSON.parse(localStorage.getItem("inventory") || "[]");
    const categoriesData = JSON.parse(
      localStorage.getItem("categories") || "[]"
    );

    setSales(salesData);
    setInventory(inventoryData);
    setCategories(categoriesData);
  };

  const getFilteredSales = () => {
    const now = new Date(selectedDate);

    return sales.filter((sale) => {
      const saleDate = new Date(sale.saleDate);

      if (reportType === "daily") {
        return saleDate.toDateString() === now.toDateString();
      } else if (reportType === "weekly") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return saleDate >= weekStart && saleDate <= weekEnd;
      } else if (reportType === "monthly") {
        return (
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        );
      }
      return false;
    });
  };

  const calculateTotals = (filteredSales) => {
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce(
      (sum, sale) => sum + sale.finalAmount,
      0
    );
    const totalDiscount = filteredSales.reduce(
      (sum, sale) => sum + sale.totalDiscount,
      0
    );
    const grossRevenue = filteredSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );
    const totalItems = filteredSales.reduce(
      (sum, sale) =>
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    return {
      totalSales,
      totalRevenue,
      totalDiscount,
      grossRevenue,
      totalItems,
    };
  };

  const getProductSummary = (filteredSales) => {
    const productMap = {};

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productMap[item.productId]) {
          productMap[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            totalQuantity: 0,
            totalRevenue: 0,
            totalDiscount: 0,
            actualPrice: item.unitPrice,
            transactions: 0,
          };
        }

        productMap[item.productId].totalQuantity += item.quantity;
        productMap[item.productId].totalRevenue += item.subtotal;
        productMap[item.productId].totalDiscount +=
          item.discount * item.quantity;
        productMap[item.productId].transactions += 1;
      });
    });

    return Object.values(productMap).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );
  };

  const exportToExcel = () => {
    const filteredSales = getFilteredSales();
    const totals = calculateTotals(filteredSales);

    let csvContent = "Sales Report\n";
    csvContent += `Report Type: ${reportType.toUpperCase()}\n`;
    csvContent += `Date: ${selectedDate}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    csvContent += "SUMMARY\n";
    csvContent += `Total Sales,${totals.totalSales}\n`;
    csvContent += `Total Items Sold,${totals.totalItems}\n`;
    csvContent += `Gross Revenue,${totals.grossRevenue}\n`;
    csvContent += `Total Discounts,${totals.totalDiscount}\n`;
    csvContent += `Net Revenue,${totals.totalRevenue}\n\n`;

    csvContent += "DETAILED SALES\n";
    csvContent +=
      "Date,Time,Sale ID,Customer,Product,Quantity,Unit Price,Discount,Subtotal,Payment Method,Status,Sold By\n";

    filteredSales.forEach((sale) => {
      const saleDate = new Date(sale.saleDate);
      const dateStr = saleDate.toLocaleDateString();
      const timeStr = saleDate.toLocaleTimeString();

      sale.items.forEach((item) => {
        const row = [
          dateStr,
          timeStr,
          sale.id,
          sale.customerName || "Walk-in Customer",
          `"${item.productName}"`,
          item.quantity,
          item.unitPrice,
          item.discount,
          item.subtotal,
          sale.paymentMethod,
          sale.status,
          sale.soldByName,
        ].join(",");

        csvContent += row + "\n";
      });
    });

    csvContent += "\nPRODUCT SUMMARY\n";
    csvContent +=
      "Product Name,Total Quantity,Actual Price,Total Discount,Net Revenue,Transactions\n";

    const productSummary = getProductSummary(filteredSales);
    productSummary.forEach((product) => {
      const row = [
        `"${product.productName}"`,
        product.totalQuantity,
        product.actualPrice,
        product.totalDiscount,
        product.totalRevenue,
        product.transactions,
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `sales_report_${reportType}_${selectedDate}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    const filteredSales = getFilteredSales();
    const totals = calculateTotals(filteredSales);
    const productSummary = getProductSummary(filteredSales);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Sales Report - ${reportType.toUpperCase()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 30px; border-bottom: 2px solid #93c5fd; padding-bottom: 5px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .summary-card { border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; }
            .summary-label { font-size: 14px; color: #6b7280; font-weight: 600; }
            .summary-value { font-size: 24px; font-weight: bold; color: #1f2937; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #2563eb; color: white; padding: 12px; text-align: left; font-weight: 600; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .discount { color: #dc2626; font-weight: 600; }
            .total-row { background-color: #dbeafe !important; font-weight: bold; }
            @media print {
              button { display: none; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MOTORBIKE SPARE PARTS SHOP</h1>
            <h2>Sales Report - ${reportType.toUpperCase()}</h2>
            <p><strong>Date:</strong> ${selectedDate} | <strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <h2>Sales Summary</h2>
          <div class="summary">
            <div class="summary-card">
              <div class="summary-label">Total Sales</div>
              <div class="summary-value">${totals.totalSales}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Items Sold</div>
              <div class="summary-value">${totals.totalItems}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Gross Revenue</div>
              <div class="summary-value">KES ${totals.grossRevenue.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Discounts</div>
              <div class="summary-value discount">KES ${totals.totalDiscount.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Net Revenue</div>
              <div class="summary-value" style="color: #059669;">KES ${totals.totalRevenue.toLocaleString()}</div>
            </div>
          </div>
          
          <h2>Product Performance</h2>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Qty Sold</th>
                <th>Unit Price</th>
                <th>Total Discount</th>
                <th>Net Revenue</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              ${productSummary
                .map(
                  (product) => `
                <tr>
                  <td>${product.productName}</td>
                  <td>${product.totalQuantity}</td>
                  <td>KES ${product.actualPrice.toLocaleString()}</td>
                  <td class="discount">KES ${product.totalDiscount.toLocaleString()}</td>
                  <td>KES ${product.totalRevenue.toLocaleString()}</td>
                  <td>${product.transactions}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <h2>Detailed Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Sale ID</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Subtotal</th>
                <th>Payment</th>
                <th>Customer</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales
                .map((sale) =>
                  sale.items
                    .map(
                      (item) => `
                  <tr>
                    <td>${new Date(sale.saleDate).toLocaleString()}</td>
                    <td>${sale.id}</td>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>KES ${item.unitPrice}</td>
                    <td class="discount">KES ${item.discount}</td>
                    <td>KES ${item.subtotal}</td>
                    <td>${sale.paymentMethod}</td>
                    <td>${sale.customerName || "Walk-in"}</td>
                  </tr>
                `
                    )
                    .join("")
                )
                .join("")}
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredSales = getFilteredSales();
  const totals = calculateTotals(filteredSales);
  const productSummary = getProductSummary(filteredSales);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Sales Reports
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={exportToExcel}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </button>
              <button
                onClick={printReport}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print PDF
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Sales</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {totals.totalSales}
                </p>
              </div>
              <ShoppingCart className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Items Sold</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {totals.totalItems}
                </p>
              </div>
              <Tag className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Gross Revenue
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  KES {totals.grossRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Total Discounts
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  KES {totals.totalDiscount.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Net Revenue</p>
                <p className="text-2xl font-bold text-white mt-2">
                  KES {totals.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        {/* Product Performance */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Product Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productSummary.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {product.totalQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      KES {product.actualPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">
                      KES {product.totalDiscount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600 font-bold">
                      KES {product.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {product.transactions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Transactions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Detailed Transactions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sold By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) =>
                  sale.items.map((item, itemIndex) => (
                    <tr
                      key={`${sale.id}-${itemIndex}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(sale.saleDate).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(sale.saleDate).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {sale.id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        KES {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {item.discount > 0
                          ? `KES ${item.discount.toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        KES {item.subtotal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sale.paymentMethod === "cash"
                              ? "bg-green-100 text-green-800"
                              : sale.paymentMethod === "mpesa"
                              ? "bg-blue-100 text-blue-800"
                              : sale.paymentMethod === "credit"
                              ? "bg-red-100 text-red-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {sale.customerName || "Walk-in"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {sale.soldByName}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No sales found for the selected period
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
