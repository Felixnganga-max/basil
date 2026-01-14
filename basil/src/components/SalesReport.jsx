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
  AlertCircle,
  RefreshCw,
  BarChart3,
} from "lucide-react";

const API_BASE_URL = "https://basil-bhmb.vercel.app/api/reports";

const SalesReport = () => {
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSalesReport();
  }, [reportType, selectedDate]);

  const fetchSalesReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/sales?reportType=${reportType}&selectedDate=${selectedDate}`
      );

      const result = await response.json();

      if (result.success) {
        setReportData(result.data);
      } else {
        setError(result.message || "Failed to fetch report");
      }
    } catch (err) {
      setError("Failed to connect to server: " + err.message);
      console.error("Error fetching sales report:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/export?reportType=${reportType}&selectedDate=${selectedDate}`
      );

      const result = await response.json();

      if (result.success) {
        const csvData = result.data;

        let csvContent = "Sales Report\n";
        csvContent += `Report Type: ${reportType.toUpperCase()}\n`;
        csvContent += `Date: ${selectedDate}\n`;
        csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

        if (reportData) {
          csvContent += "SUMMARY\n";
          csvContent += `Total Sales,${reportData.summary.totalSales}\n`;
          csvContent += `Total Items Sold,${reportData.summary.totalItems}\n`;
          csvContent += `Gross Revenue,${reportData.summary.grossRevenue}\n`;
          csvContent += `Total Discounts,${reportData.summary.totalDiscount}\n`;
          csvContent += `Net Revenue,${reportData.summary.totalRevenue}\n`;
          csvContent += `Total Cost,${reportData.summary.totalCost}\n`;
          csvContent += `Total Profit,${reportData.summary.totalProfit}\n`;
          csvContent += `Profit Margin,${reportData.summary.profitMargin}%\n\n`;
        }

        csvContent += "DETAILED SALES\n";
        csvContent +=
          "Date,Time,Sale ID,Customer,Product,Quantity,Unit Price,Discount,Subtotal,Payment Method,Status,Sold By\n";

        csvData.forEach((row) => {
          const csvRow = [
            row.date,
            row.time,
            row.saleId,
            `"${row.customerName}"`,
            `"${row.items}"`,
            row.totalAmount,
            row.totalDiscount,
            row.finalAmount,
            row.profit,
            row.paymentMethod,
            row.status,
            row.soldBy,
          ].join(",");

          csvContent += csvRow + "\n";
        });

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
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
      }
    } catch (err) {
      setError("Failed to export report: " + err.message);
    }
  };

  const printReport = () => {
    if (!reportData) return;

    const { summary, productSummary, sales } = reportData;

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
            .profit { color: #059669; font-weight: 600; }
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
              <div class="summary-value">${summary.totalSales}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Items Sold</div>
              <div class="summary-value">${summary.totalItems}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Gross Revenue</div>
              <div class="summary-value">KES ${summary.grossRevenue.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Discounts</div>
              <div class="summary-value discount">KES ${summary.totalDiscount.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Net Revenue</div>
              <div class="summary-value profit">KES ${summary.totalRevenue.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Cost</div>
              <div class="summary-value">KES ${summary.totalCost.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Total Profit</div>
              <div class="summary-value profit">KES ${summary.totalProfit.toLocaleString()}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Profit Margin</div>
              <div class="summary-value profit">${summary.profitMargin}%</div>
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
                <th>Profit</th>
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
                  <td>KES ${product.unitPrice.toLocaleString()}</td>
                  <td class="discount">KES ${product.totalDiscount.toLocaleString()}</td>
                  <td>KES ${product.totalRevenue.toLocaleString()}</td>
                  <td class="profit">KES ${product.totalProfit.toLocaleString()}</td>
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
                <th>Customer</th>
                <th>Items</th>
                <th>Gross</th>
                <th>Discount</th>
                <th>Final Amount</th>
                <th>Profit</th>
                <th>Payment</th>
                <th>Sold By</th>
              </tr>
            </thead>
            <tbody>
              ${sales
                .map(
                  (sale) => `
                <tr>
                  <td>${new Date(sale.saleDate).toLocaleString()}</td>
                  <td>${sale._id.substring(0, 8)}...</td>
                  <td>${sale.customerName || "Walk-in"}</td>
                  <td>${sale.items.length} item(s)</td>
                  <td>KES ${sale.totalAmount.toLocaleString()}</td>
                  <td class="discount">KES ${sale.totalDiscount.toLocaleString()}</td>
                  <td>KES ${sale.finalAmount.toLocaleString()}</td>
                  <td class="profit">KES ${sale.totalProfit.toLocaleString()}</td>
                  <td>${sale.paymentMethod}</td>
                  <td>${sale.soldByName}</td>
                </tr>
              `
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

  if (loading && !reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading sales report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="text-red-800 font-semibold">
                  Error Loading Report
                </h3>
                <p className="text-red-600 mt-1">{error}</p>
                <button
                  onClick={fetchSalesReport}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  const { summary, productSummary, sales, paymentBreakdown } = reportData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Sales Reports</h1>
            <button
              onClick={fetchSalesReport}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={exportToExcel}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={printReport}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Sales</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {summary.totalSales}
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
                  {summary.totalItems}
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
                  KES {summary.grossRevenue.toLocaleString()}
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
                  KES {summary.totalDiscount.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Profit & Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Net Revenue</p>
                <p className="text-2xl font-bold text-white mt-2">
                  KES {summary.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Total Profit</p>
                <p className="text-2xl font-bold text-white mt-2">
                  KES {summary.totalProfit.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Profit Margin</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {summary.profitMargin}%
                </p>
              </div>
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Payment Method Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(paymentBreakdown).map(([method, amount]) => (
              <div
                key={method}
                className="border border-gray-200 rounded-lg p-4"
              >
                <p className="text-sm text-gray-600 font-medium uppercase">
                  {method}
                </p>
                <p className="text-xl font-bold text-gray-800 mt-2">
                  KES {amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Product Performance */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Product Performance ({productSummary.length} Products)
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
                    Profit
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
                      KES {product.unitPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-600 font-medium">
                      KES {product.totalDiscount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-bold">
                      KES {product.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600 font-bold">
                      KES {product.totalProfit.toLocaleString()}
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
            Detailed Transactions ({sales.length} Sales)
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
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sold By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(sale.saleDate).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(sale.saleDate).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                      {sale._id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {sale.customerName || "Walk-in"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {sale.items.length} item(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      KES {sale.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {sale.totalDiscount > 0
                        ? `KES ${sale.totalDiscount.toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      KES {sale.finalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      KES {sale.totalProfit.toLocaleString()}
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
                      {sale.soldByName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sales.length === 0 && (
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
