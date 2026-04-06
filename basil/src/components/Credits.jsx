import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  DollarSign,
  User,
  Calendar,
  Package,
  CreditCard,
  X,
  Eye,
  Phone,
  FileText,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// ── API ──────────────────────────────────────────────────────────────────────
const API_BASE_URL = "https://basil-ozi8.vercel.app/api";

const api = {
  getCredits: (query = "") =>
    fetch(`${API_BASE_URL}/credits${query}`).then((r) => r.json()),

  getCreditStats: () =>
    fetch(`${API_BASE_URL}/credits/stats`).then((r) => r.json()),

  recordPayment: (creditId, data) =>
    fetch(`${API_BASE_URL}/credits/${creditId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (ds) =>
  new Date(ds).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (ds) =>
  new Date(ds).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const STATUS_META = {
  ACTIVE: { label: "Active", color: "text-red-400 bg-red-950 border-red-800" },
  PARTIAL: {
    label: "Partial Payment",
    color: "text-yellow-400 bg-yellow-950 border-yellow-800",
  },
  PAID: {
    label: "Cleared",
    color: "text-green-400 bg-green-950 border-green-800",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-zinc-400 bg-zinc-900 border-zinc-700",
  },
};

const statusMeta = (status) =>
  STATUS_META[status?.toUpperCase()] ?? STATUS_META.ACTIVE;

const pct = (paid, total) =>
  total > 0 ? ((paid / total) * 100).toFixed(1) : "0.0";

// ── Component ─────────────────────────────────────────────────────────────────
const Credits = () => {
  const [credits, setCredits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" | "mpesa" — matches CashOrMpesa enum
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Adapt to your auth system
  const currentUser = { id: "user_default", fullName: "Admin User" };

  // ── Data loading ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [creditsRes, statsRes] = await Promise.all([
        api.getCredits(),
        api.getCreditStats(),
      ]);
      if (!creditsRes.success) throw new Error(creditsRes.message);
      if (!statsRes.success) throw new Error(statsRes.message);
      setCredits(creditsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError(
        err.message ||
          "Failed to load credits. Check that the backend is running on http://localhost:5000",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredCredits = credits.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.customerName?.toLowerCase().includes(term) ||
      c.customerPhone?.includes(term);
    const matchesStatus =
      statusFilter === "all" ||
      c.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  // ── Payment modal ─────────────────────────────────────────────────────────
  const openPaymentModal = (credit) => {
    setSelectedCredit(credit);
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentNotes("");
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }
    if (amount > selectedCredit.remainingBalance) {
      alert("Payment amount cannot exceed remaining balance");
      return;
    }

    setPaymentLoading(true);
    try {
      const res = await api.recordPayment(selectedCredit.id, {
        amount,
        paymentMethod, // "cash" or "mpesa" — matches enum
        receivedBy: currentUser.id,
        receivedByName: currentUser.fullName,
        notes: paymentNotes,
      });
      if (!res.success) throw new Error(res.message);
      alert(res.message);
      setShowPaymentModal(false);
      setSelectedCredit(null);
      await loadData();
    } catch (err) {
      alert(`Error recording payment: ${err.message}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4" />
          <div className="text-xl text-white">Loading credits...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-black p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <p className="text-white mb-2 font-semibold">
            Failed to load credits
          </p>
          <p className="text-zinc-400 text-sm mb-6">{error}</p>
          <button
            onClick={loadData}
            className="flex items-center gap-2 mx-auto bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full bg-black text-white p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-red-500">Credit Management</h1>
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded text-sm"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">Total Outstanding</span>
                <DollarSign className="text-red-500" size={18} />
              </div>
              <div className="text-2xl font-bold text-red-500">
                KSh {(stats.totalOutstanding || 0).toLocaleString()}
              </div>
            </div>

            {stats.byStatus?.map((s) => {
              const meta = statusMeta(s.status);
              const iconColor =
                s.status === "PAID"
                  ? "text-green-500"
                  : s.status === "PARTIAL"
                    ? "text-yellow-500"
                    : "text-red-500";
              return (
                <div
                  key={s.status}
                  className="bg-zinc-900 p-4 rounded-lg border border-zinc-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">{meta.label}</span>
                    <CreditCard className={iconColor} size={18} />
                  </div>
                  <div className="text-2xl font-bold text-white">{s.count}</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    KSh {(s.outstanding || 0).toLocaleString()} remaining
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-zinc-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-red-500 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-red-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PARTIAL">Partial Payment</option>
              <option value="PAID">Cleared</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Credits List */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800">
          {filteredCredits.length === 0 ? (
            <div className="text-center text-zinc-400 py-16">
              <CreditCard size={48} className="mx-auto mb-4 opacity-40" />
              <p className="font-semibold mb-1">No credits found</p>
              <p className="text-sm text-zinc-500">
                Credit sales will appear here automatically when processed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {filteredCredits.map((credit) => {
                const meta = statusMeta(credit.status);
                const isCleared =
                  credit.status === "PAID" || credit.status === "CANCELLED";

                return (
                  <div
                    key={credit.id}
                    className="p-4 hover:bg-zinc-800/50 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Customer */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="bg-zinc-800 p-2 rounded mt-0.5">
                            <User className="text-red-500" size={18} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              {credit.customerName}
                            </h3>
                            {credit.customerPhone && (
                              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                                <Phone size={12} /> {credit.customerPhone}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                              <Calendar size={12} />
                              {/* schema uses creditDate */}
                              {formatDate(credit.creditDate)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <div className="text-zinc-400 text-xs mb-0.5">
                              Total
                            </div>
                            <div className="font-semibold text-white">
                              KSh {credit.totalAmount.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-zinc-400 text-xs mb-0.5">
                              Paid
                            </div>
                            <div className="font-semibold text-green-400">
                              KSh {credit.amountPaid.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-zinc-400 text-xs mb-0.5">
                              Remaining
                            </div>
                            <div className="font-semibold text-red-400">
                              KSh {credit.remainingBalance.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-zinc-400 text-xs mb-0.5">
                              Status
                            </div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{
                              width: `${pct(credit.amountPaid, credit.totalAmount)}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {pct(credit.amountPaid, credit.totalAmount)}% paid
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 md:w-44">
                        <button
                          onClick={() => {
                            setSelectedCredit(credit);
                            setShowDetailsModal(true);
                          }}
                          className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-3 rounded text-sm"
                        >
                          <Eye size={14} /> View Details
                        </button>
                        {!isCleared && (
                          <button
                            onClick={() => openPaymentModal(credit)}
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm font-semibold"
                          >
                            <DollarSign size={14} /> Record Payment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Modal ──────────────────────────────────────────────────────── */}
      {showPaymentModal && selectedCredit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-red-500">
                  Record Payment
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Summary */}
              <div className="bg-black p-4 rounded border border-zinc-700 mb-5">
                <h3 className="font-semibold text-white mb-3">
                  {selectedCredit.customerName}
                </h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Debt:</span>
                    <span className="text-white">
                      KSh {selectedCredit.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Already Paid:</span>
                    <span className="text-green-400">
                      KSh {selectedCredit.amountPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-zinc-700 pt-2 mt-2">
                    <span className="text-white">Remaining:</span>
                    <span className="text-red-400">
                      KSh {selectedCredit.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    max={selectedCredit.remainingBalance}
                    className="w-full px-4 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Max: KSh {selectedCredit.remainingBalance.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Values are lowercase to match the CashOrMpesa enum exactly */}
                    {[
                      { value: "cash", label: "💵 Cash" },
                      { value: "mpesa", label: "📱 M-Pesa" },
                    ].map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setPaymentMethod(m.value)}
                        className={`py-2 rounded border-2 text-sm font-semibold transition-all ${
                          paymentMethod === m.value
                            ? "border-red-600 bg-red-950 text-red-400"
                            : "border-zinc-700 hover:border-zinc-500 text-zinc-300"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Any notes..."
                    rows={2}
                    className="w-full px-4 py-2 bg-black border border-zinc-700 rounded text-white focus:outline-none focus:border-red-500 text-sm resize-none"
                  />
                </div>
              </div>

              {/* Balance preview */}
              {paymentAmount && parseFloat(paymentAmount) > 0 && (
                <div className="bg-green-950 border border-green-800 p-3 rounded mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">
                      New Remaining Balance:
                    </span>
                    <span className="font-semibold text-green-300">
                      KSh{" "}
                      {Math.max(
                        0,
                        selectedCredit.remainingBalance -
                          parseFloat(paymentAmount),
                      ).toLocaleString()}
                    </span>
                  </div>
                  {selectedCredit.remainingBalance -
                    parseFloat(paymentAmount) <=
                    0 && (
                    <div className="text-xs text-green-400 mt-1">
                      ✓ This payment will fully clear the debt
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={paymentLoading}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  disabled={paymentLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paymentLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                      Processing...
                    </>
                  ) : (
                    "Record Payment"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Details Modal ──────────────────────────────────────────────────────── */}
      {showDetailsModal && selectedCredit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-red-500">
                  Credit Details
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Customer */}
              <div className="bg-black p-4 rounded border border-zinc-700 mb-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <User size={16} className="text-red-500" /> Customer
                  Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-400 text-xs">Name</span>
                    <div className="font-semibold text-white mt-0.5">
                      {selectedCredit.customerName}
                    </div>
                  </div>
                  {selectedCredit.customerPhone && (
                    <div>
                      <span className="text-zinc-400 text-xs">Phone</span>
                      <div className="font-semibold text-white mt-0.5">
                        {selectedCredit.customerPhone}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-400 text-xs">Credit Date</span>
                    {/* schema field: creditDate */}
                    <div className="font-semibold text-white mt-0.5">
                      {formatDateTime(selectedCredit.creditDate)}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-xs">Status</span>
                    <div className="mt-0.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${statusMeta(selectedCredit.status).color}`}
                      >
                        {statusMeta(selectedCredit.status).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items from linked sale */}
              {selectedCredit.sale?.items?.length > 0 && (
                <div className="bg-black p-4 rounded border border-zinc-700 mb-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Package size={16} className="text-red-500" /> Items
                    Purchased
                  </h3>
                  <div className="space-y-2">
                    {selectedCredit.sale.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm py-2 border-b border-zinc-800 last:border-0"
                      >
                        <div>
                          <div className="font-semibold text-white">
                            {item.productName}
                          </div>
                          <div className="text-zinc-400 text-xs">
                            {item.quantity} × KSh{" "}
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
              )}

              {/* Financial summary */}
              <div className="bg-black p-4 rounded border border-zinc-700 mb-4">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <DollarSign size={16} className="text-red-500" /> Financial
                  Summary
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
                    <span className="text-green-400 font-semibold">
                      KSh {selectedCredit.amountPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-700">
                    <span className="text-white font-semibold">Remaining:</span>
                    <span className="text-red-400 font-bold text-lg">
                      KSh {selectedCredit.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{
                        width: `${pct(selectedCredit.amountPaid, selectedCredit.totalAmount)}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-zinc-500 mt-1 text-center">
                    {pct(selectedCredit.amountPaid, selectedCredit.totalAmount)}
                    % Paid
                  </div>
                </div>
              </div>

              {/* Payment history — schema relation is paymentHistory, timestamp is paidAt */}
              {selectedCredit.paymentHistory?.length > 0 && (
                <div className="bg-black p-4 rounded border border-zinc-700 mb-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-red-500" /> Payment
                    History
                  </h3>
                  <div className="space-y-3">
                    {selectedCredit.paymentHistory.map((p) => (
                      <div
                        key={p.id}
                        className="bg-zinc-900 p-3 rounded border border-zinc-800"
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <div>
                            <div className="font-semibold text-green-400">
                              KSh {p.amount.toLocaleString()}
                            </div>
                            {/* schema field: paidAt */}
                            <div className="text-xs text-zinc-400">
                              {formatDateTime(p.paidAt)}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">
                            {p.paymentMethod === "cash"
                              ? "💵 Cash"
                              : "📱 M-Pesa"}
                          </span>
                        </div>
                        {p.receivedByName && (
                          <div className="text-xs text-zinc-400">
                            Received by: {p.receivedByName}
                          </div>
                        )}
                        {p.notes && (
                          <div className="text-xs text-zinc-500 mt-1 italic">
                            {p.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCredit.notes && (
                <div className="bg-black p-4 rounded border border-zinc-700 mb-4">
                  <h3 className="font-semibold text-white mb-2">Notes</h3>
                  <p className="text-sm text-zinc-400">
                    {selectedCredit.notes}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded font-semibold"
                >
                  Close
                </button>
                {selectedCredit.status !== "PAID" &&
                  selectedCredit.status !== "CANCELLED" && (
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
