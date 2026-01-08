import React, { useState, useEffect } from "react";
import {
  Search,
  DollarSign,
  User,
  Calendar,
  Package,
  CreditCard,
  X,
  Check,
  Eye,
  Phone,
  FileText,
} from "lucide-react";

const Credits = () => {
  const [credits, setCredits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Payment form states
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const result = await window.storage.get("credits");
      const loadedCredits = result ? JSON.parse(result.value) : [];
      // Sort by date (newest first)
      loadedCredits.sort(
        (a, b) => new Date(b.creditDate) - new Date(a.creditDate)
      );
      setCredits(loadedCredits);
    } catch (error) {
      console.log("Loading initial credits");
      setCredits([]);
    }
    setLoading(false);
  };

  // Filter credits
  const filteredCredits = credits.filter((credit) => {
    const matchesSearch =
      credit.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (credit.customerPhone && credit.customerPhone.includes(searchTerm));

    const matchesStatus =
      statusFilter === "all" || credit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate total outstanding debt
  const totalOutstanding = credits
    .filter((c) => c.status !== "cleared")
    .reduce((sum, c) => sum + c.remainingBalance, 0);

  // Calculate statistics
  const activeCredits = credits.filter((c) => c.status === "active").length;
  const partialCredits = credits.filter((c) => c.status === "partial").length;
  const clearedCredits = credits.filter((c) => c.status === "cleared").length;

  // Open payment modal
  const openPaymentModal = (credit) => {
    setSelectedCredit(credit);
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentNotes("");
    setShowPaymentModal(true);
  };

  // Open details modal
  const openDetailsModal = (credit) => {
    setSelectedCredit(credit);
    setShowDetailsModal(true);
  };

  // Process payment
  const processPayment = async () => {
    if (!selectedCredit) return;

    const amount = parseFloat(paymentAmount);

    if (!amount || amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (amount > selectedCredit.remainingBalance) {
      alert("Payment amount cannot exceed remaining balance");
      return;
    }

    const currentUser = await window.storage.get("current_user");
    if (!currentUser) {
      alert("No user logged in");
      return;
    }

    const user = JSON.parse(currentUser.value);

    // Create payment record
    const payment = {
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      amount: amount,
      paymentMethod: paymentMethod,
      receivedBy: user.id,
      receivedByName: user.fullName,
      notes: paymentNotes,
    };

    // Update credit record
    const newAmountPaid = selectedCredit.amountPaid + amount;
    const newRemainingBalance = selectedCredit.remainingBalance - amount;
    const newStatus = newRemainingBalance === 0 ? "cleared" : "partial";

    const updatedCredit = {
      ...selectedCredit,
      amountPaid: newAmountPaid,
      remainingBalance: newRemainingBalance,
      payments: [...selectedCredit.payments, payment],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    // Update credits in storage
    try {
      const updatedCredits = credits.map((c) =>
        c.id === selectedCredit.id ? updatedCredit : c
      );

      await window.storage.set("credits", JSON.stringify(updatedCredits));
      setCredits(updatedCredits);

      alert(`Payment of KSh ${amount.toLocaleString()} recorded successfully!`);
      setShowPaymentModal(false);
      setSelectedCredit(null);
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Error processing payment. Please try again.");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-red-500 bg-red-900 bg-opacity-30 border-red-700";
      case "partial":
        return "text-yellow-500 bg-yellow-900 bg-opacity-30 border-yellow-700";
      case "cleared":
        return "text-green-500 bg-green-900 bg-opacity-30 border-green-700";
      default:
        return "text-zinc-500 bg-zinc-900 bg-opacity-30 border-zinc-700";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "partial":
        return "Partial Payment";
      case "cleared":
        return "Cleared";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-red-500">
          Credit Management
        </h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Total Outstanding</span>
              <DollarSign className="text-red-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-red-500">
              KSh {totalOutstanding.toLocaleString()}
            </div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Active Credits</span>
              <CreditCard className="text-red-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-white">{activeCredits}</div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Partial Payments</span>
              <CreditCard className="text-yellow-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-white">
              {partialCredits}
            </div>
          </div>

          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Cleared</span>
              <Check className="text-green-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-white">
              {clearedCredits}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-zinc-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="partial">Partial Payment</option>
              <option value="cleared">Cleared</option>
            </select>
          </div>
        </div>

        {/* Credits List */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800">
          {filteredCredits.length === 0 ? (
            <div className="text-center text-zinc-400 py-12">
              <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
              <p>No credits found</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredCredits.map((credit) => (
                <div
                  key={credit.id}
                  className="p-4 hover:bg-zinc-800 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Customer Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="bg-zinc-800 p-2 rounded">
                          <User className="text-red-500" size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-white mb-1">
                            {credit.customerName}
                          </h3>
                          {credit.customerPhone && (
                            <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                              <Phone size={14} />
                              {credit.customerPhone}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <Calendar size={14} />
                            Credit Date: {formatDate(credit.creditDate)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Amount Info */}
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-zinc-400 mb-1">Total Amount</div>
                          <div className="font-semibold text-white">
                            KSh {credit.totalAmount.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-400 mb-1">Amount Paid</div>
                          <div className="font-semibold text-green-500">
                            KSh {credit.amountPaid.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-400 mb-1">Remaining</div>
                          <div className="font-semibold text-red-500">
                            KSh {credit.remainingBalance.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-400 mb-1">Status</div>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(
                              credit.status
                            )}`}
                          >
                            {getStatusText(credit.status)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-zinc-800 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${
                                (credit.amountPaid / credit.totalAmount) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">
                          {(
                            (credit.amountPaid / credit.totalAmount) *
                            100
                          ).toFixed(1)}
                          % Paid
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 md:w-48">
                      <button
                        onClick={() => openDetailsModal(credit)}
                        className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded text-sm"
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                      {credit.status !== "cleared" && (
                        <button
                          onClick={() => openPaymentModal(credit)}
                          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm font-semibold"
                        >
                          <DollarSign size={16} />
                          Record Payment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-red-500">
                  Record Payment
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Customer Info */}
              <div className="bg-black p-4 rounded border border-zinc-700 mb-6">
                <h3 className="font-semibold text-white mb-2">
                  {selectedCredit.customerName}
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Debt:</span>
                    <span className="text-white">
                      KSh {selectedCredit.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Already Paid:</span>
                    <span className="text-green-500">
                      KSh {selectedCredit.amountPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-zinc-700 pt-2 mt-2">
                    <span className="text-white">Remaining:</span>
                    <span className="text-red-500">
                      KSh {selectedCredit.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    max={selectedCredit.remainingBalance}
                    className="w-full px-4 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-red-500"
                  />
                  <div className="text-xs text-zinc-400 mt-1">
                    Maximum: KSh{" "}
                    {selectedCredit.remainingBalance.toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Add any notes..."
                    rows="3"
                    className="w-full px-4 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-red-500"
                  ></textarea>
                </div>
              </div>

              {/* Remaining Balance After Payment */}
              {paymentAmount && parseFloat(paymentAmount) > 0 && (
                <div className="bg-green-900 bg-opacity-30 border border-green-700 p-3 rounded mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">
                      New Remaining Balance:
                    </span>
                    <span className="font-semibold text-green-500">
                      KSh{" "}
                      {(
                        selectedCredit.remainingBalance -
                        parseFloat(paymentAmount)
                      ).toLocaleString()}
                    </span>
                  </div>
                  {selectedCredit.remainingBalance -
                    parseFloat(paymentAmount) ===
                    0 && (
                    <div className="text-xs text-green-400 mt-1">
                      ✓ This payment will clear the debt
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded font-semibold"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-red-500">
                  Credit Details
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Customer Info */}
              <div className="bg-black p-4 rounded border border-zinc-700 mb-6">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <User size={18} className="text-red-500" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Name:</span>
                    <div className="font-semibold text-white">
                      {selectedCredit.customerName}
                    </div>
                  </div>
                  {selectedCredit.customerPhone && (
                    <div>
                      <span className="text-zinc-400">Phone:</span>
                      <div className="font-semibold text-white">
                        {selectedCredit.customerPhone}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-400">Credit Date:</span>
                    <div className="font-semibold text-white">
                      {formatDateTime(selectedCredit.creditDate)}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400">Status:</span>
                    <div>
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(
                          selectedCredit.status
                        )}`}
                      >
                        {getStatusText(selectedCredit.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Purchased */}
              <div className="bg-black p-4 rounded border border-zinc-700 mb-6">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Package size={18} className="text-red-500" />
                  Items Purchased on Credit
                </h3>
                <div className="space-y-2">
                  {selectedCredit.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm py-2 border-b border-zinc-800 last:border-0"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {item.productName}
                        </div>
                        <div className="text-zinc-400">
                          Qty: {item.quantity} × KSh{" "}
                          {item.unitPrice.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-white font-semibold">
                        KSh {item.subtotal.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-black p-4 rounded border border-zinc-700 mb-6">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <DollarSign size={18} className="text-red-500" />
                  Financial Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Amount:</span>
                    <span className="text-white font-semibold">
                      KSh {selectedCredit.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Amount Paid:</span>
                    <span className="text-green-500 font-semibold">
                      KSh {selectedCredit.amountPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-700">
                    <span className="text-white font-semibold">
                      Remaining Balance:
                    </span>
                    <span className="text-red-500 font-bold text-lg">
                      KSh {selectedCredit.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (selectedCredit.amountPaid /
                            selectedCredit.totalAmount) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 text-center">
                    {(
                      (selectedCredit.amountPaid / selectedCredit.totalAmount) *
                      100
                    ).toFixed(1)}
                    % Paid
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {selectedCredit.payments.length > 0 && (
                <div className="bg-black p-4 rounded border border-zinc-700 mb-6">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-red-500" />
                    Payment History
                  </h3>
                  <div className="space-y-3">
                    {selectedCredit.payments.map((payment, index) => (
                      <div
                        key={payment.paymentId}
                        className="bg-zinc-900 p-3 rounded border border-zinc-800"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold text-green-500">
                              KSh {payment.amount.toLocaleString()}
                            </div>
                            <div className="text-xs text-zinc-400">
                              {formatDateTime(payment.date)}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-300">
                            {payment.paymentMethod === "cash"
                              ? "Cash"
                              : "M-Pesa"}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400">
                          Received by: {payment.receivedByName}
                        </div>
                        {payment.notes && (
                          <div className="text-xs text-zinc-400 mt-2 italic">
                            Note: {payment.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedCredit.notes && (
                <div className="bg-black p-4 rounded border border-zinc-700 mb-6">
                  <h3 className="font-semibold text-white mb-2">Notes</h3>
                  <p className="text-sm text-zinc-400">
                    {selectedCredit.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded font-semibold"
                >
                  Close
                </button>
                {selectedCredit.status !== "cleared" && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      openPaymentModal(selectedCredit);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded font-semibold"
                  >
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Credits;
