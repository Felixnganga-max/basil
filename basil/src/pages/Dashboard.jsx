import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  DollarSign,
  ArrowRight,
  ChevronRight,
  Wrench,
  Shield,
  Zap,
  Star,
} from "lucide-react";

import Sales from "../components/Sales";
import InventoryManagement from "../components/InventoryManagement";
import Credits from "../components/Credits";
import SalesReport from "../components/SalesReport";
import Profile from "../components/Profile";

// ─── LANDING PAGE ────────────────────────────────────────────────────────────
const Landing = ({ onEnter }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Atmospheric background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(220,38,38,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <header
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "28px 48px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #dc2626, #991b1b)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wrench size={18} color="white" />
          </div>
          <span
            style={{
              color: "white",
              fontSize: "18px",
              fontWeight: "700",
              letterSpacing: "0.05em",
            }}
          >
            BAZIL <span style={{ color: "#dc2626" }}>AUTOSPARES</span>
          </span>
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "13px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Management System
        </div>
      </header>

      {/* Hero */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        {/* Image Section */}
        <div
          style={{
            width: "100%",
            maxWidth: "1100px",
            margin: "48px auto 0",
            position: "relative",
            borderRadius: "20px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(220,38,38,0.1)",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(30px)",
            transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&q=80"
            alt="Auto spare parts"
            style={{
              width: "100%",
              height: "420px",
              objectFit: "cover",
              display: "block",
              filter: "brightness(0.45) saturate(0.8)",
            }}
          />
          {/* Overlay content on image */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.3) 50%, transparent 100%)",
              padding: "48px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(220,38,38,0.15)",
                border: "1px solid rgba(220,38,38,0.3)",
                borderRadius: "100px",
                padding: "6px 16px",
                marginBottom: "24px",
                opacity: loaded ? 1 : 0,
                transition: "opacity 0.8s ease 0.3s",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#dc2626",
                  animation: "pulse 2s infinite",
                }}
              />
              <span
                style={{
                  color: "#fca5a5",
                  fontSize: "12px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                }}
              >
                System Active
              </span>
            </div>

            <h1
              style={{
                color: "white",
                fontSize: "clamp(36px, 6vw, 72px)",
                fontWeight: "800",
                textAlign: "center",
                lineHeight: "1.05",
                letterSpacing: "-0.02em",
                marginBottom: "16px",
                opacity: loaded ? 1 : 0,
                transition: "opacity 0.8s ease 0.5s",
              }}
            >
              Your Spares.
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #dc2626, #f87171)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Your Business.
              </span>
            </h1>

            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "17px",
                textAlign: "center",
                maxWidth: "480px",
                lineHeight: "1.7",
                marginBottom: "40px",
                fontStyle: "italic",
                opacity: loaded ? 1 : 0,
                transition: "opacity 0.8s ease 0.65s",
              }}
            >
              Complete inventory and point-of-sale management for Basil
              Autospares. Track every part, every sale, every shilling.
            </p>

            <button
              onClick={onEnter}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "16px 36px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
                letterSpacing: "0.03em",
                boxShadow:
                  "0 8px 32px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                transition: "all 0.2s ease",
                opacity: loaded ? 1 : 0,
                transitionDelay: "0.8s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-2px) scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 16px 48px rgba(220,38,38,0.5), inset 0 1px 0 rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 8px 32px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.1)";
              }}
            >
              Proceed to POS
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "center",
            margin: "40px auto",
            maxWidth: "1100px",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.9s",
          }}
        ></div>

        {/* Second image row */}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [screen, setScreen] = useState("landing"); // "landing" | "dashboard"
  const [activeTab, setActiveTab] = useState("sales");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navItems = [
    { id: "sales", label: "Sales", icon: ShoppingCart },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "credits", label: "Credits", icon: DollarSign },
    { id: "reports", label: "Reports", icon: FileText },
  ];

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

  if (screen === "landing") {
    return <Landing onEnter={() => setScreen("dashboard")} />;
  }

  if (showProfile) {
    return <Profile onLogout={() => setShowProfile(false)} />;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#0a0a0a",
        color: "white",
        overflow: "hidden",
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      {/* ── Sidebar Desktop ── */}
      <aside
        style={{
          display: "none",
          flexDirection: "column",
          width: "240px",
          background: "#111111",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
        className="desktop-sidebar"
      >
        {/* Logo */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              background: "linear-gradient(135deg, #dc2626, #991b1b)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Wrench size={16} color="white" />
          </div>
          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "800",
                letterSpacing: "0.08em",
                color: "white",
              }}
            >
              BASIL
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Autospares
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          <div
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "0 8px",
              marginBottom: "12px",
            }}
          >
            Main Menu
          </div>
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  marginBottom: "4px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                  background: active
                    ? "linear-gradient(135deg, rgba(220,38,38,0.2), rgba(220,38,38,0.08))"
                    : "transparent",
                  color: active ? "#f87171" : "rgba(255,255,255,0.45)",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                  textAlign: "left",
                  borderLeft: active
                    ? "2px solid #dc2626"
                    : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                  }
                }}
              >
                <Icon size={17} />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: active ? "700" : "500",
                  }}
                >
                  {label}
                </span>
                {active && (
                  <ChevronRight
                    size={14}
                    style={{ marginLeft: "auto", opacity: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile */}
        <div
          style={{
            padding: "12px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={() => setShowProfile(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              transition: "background 0.15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: "800",
                color: "white",
                flexShrink: 0,
              }}
            >
              BZ
            </div>
            <div style={{ textAlign: "left" }}>
              <div
                style={{ color: "white", fontSize: "13px", fontWeight: "600" }}
              >
                Bazil
              </div>
              <div
                style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}
              >
                Administrator
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar ── */}
      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
            }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "240px",
              background: "#111111",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    background: "linear-gradient(135deg, #dc2626, #991b1b)",
                    borderRadius: "7px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Wrench size={14} color="white" />
                </div>
                <span
                  style={{
                    color: "white",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  BASIL <span style={{ color: "#dc2626" }}>POS</span>
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <nav style={{ flex: 1, padding: "16px 12px" }}>
              {navItems.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveTab(id);
                      setSidebarOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      marginBottom: "4px",
                      borderRadius: "10px",
                      border: "none",
                      cursor: "pointer",
                      background: active
                        ? "rgba(220,38,38,0.15)"
                        : "transparent",
                      color: active ? "#f87171" : "rgba(255,255,255,0.5)",
                      fontFamily: "inherit",
                    }}
                  >
                    <Icon size={17} />
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div
              style={{
                padding: "12px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <button
                onClick={() => {
                  setShowProfile(true);
                  setSidebarOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #16a34a, #15803d)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "800",
                    color: "white",
                  }}
                >
                  BZ
                </div>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      color: "white",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    Bazil
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: "11px",
                    }}
                  >
                    View Profile
                  </div>
                </div>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <header
          style={{
            background: "#111111",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "0 24px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                display: "flex",
              }}
              className="mobile-menu-btn"
            >
              <Menu size={22} />
            </button>

            {/* Back to landing */}
            <button
              onClick={() => setScreen("landing")}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "6px",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: "11px",
                padding: "4px 10px",
                letterSpacing: "0.05em",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              ← Home
            </button>

            <div>
              <h2
                style={{
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "700",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {navItems.find((n) => n.id === activeTab)?.label}
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "11px",
                  margin: 0,
                }}
              >
                Basil Autospares · Management
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowProfile(true)}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "800",
              color: "white",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 0 0 2px rgba(22,163,74,0.3)",
            }}
          >
            BZ
          </button>
        </header>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            background: "linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%)",
          }}
        >
          {renderContent()}
        </div>
      </main>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
