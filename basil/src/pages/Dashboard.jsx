import React, { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  DollarSign,
} from "lucide-react";

// Import your components here
import Sales from "../components/Sales";
import InventoryManagement from "../components/InventoryManagement";
import Credits from "../components/Credits";
import SalesReport from "../components/SalesReport";
import Profile from "../components/Profile";
import LoginPage from "../components/LoginPage"; // Add this import

// Dashboard Component
const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("sales");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navItems = [
    { id: "sales", label: "Sales", icon: ShoppingCart },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "credits", label: "Credits", icon: DollarSign },
    { id: "reports", label: "Sales Reports", icon: FileText },
  ];

  const handleLogin = () => {
    // In the future, add actual authentication logic here
    setIsAuthenticated(true);
  };

  const handleProceedAsGuest = () => {
    // Allow guest access
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    alert("Logging out...");
    setShowProfile(false);
    setIsAuthenticated(false); // Return to login page
  };

  const renderContent = () => {
    switch (activeTab) {
      case "sales":
        return <Sales />;
      case "inventory":
        return <InventoryManagement />;
      case "credits":
        return <Credits />;
      case "reports":
        return <SalesReport />;
      default:
        return <Sales />;
    }
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onProceedAsGuest={handleProceedAsGuest}
      />
    );
  }

  // Show profile if profile view is active
  if (showProfile) {
    return <Profile onLogout={handleLogout} />;
  }

  // Show dashboard if authenticated
  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-zinc-900 border-r border-zinc-800">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold">
              <span className="text-red-500">BASIL</span> Dashboard
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all ${
                  activeTab === item.id
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-lg transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center font-bold">
              JD
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">John Doe</p>
              <p className="text-xs text-zinc-400 group-hover:text-white">
                View Profile
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-zinc-900 border-r border-zinc-800">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 p-2 rounded-lg">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold">Dashboard</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 p-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-all ${
                      activeTab === item.id
                        ? "bg-red-500 text-white"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  setShowProfile(true);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 rounded-lg transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold">
                  JD
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">John Doe</p>
                  <p className="text-xs text-zinc-400">View Profile</p>
                </div>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-zinc-900 border-b border-zinc-800 px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-zinc-400 hover:text-white"
              >
                <Menu size={24} />
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-bold capitalize">
                  {activeTab === "reports" ? "Sales Reports" : activeTab}
                </h2>
                <p className="text-sm text-zinc-400 hidden sm:block">
                  Welcome back, John! | Basil Autospares Management
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowProfile(true)}
              className="md:hidden w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center font-bold"
            >
              JD
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-black to-zinc-900">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
