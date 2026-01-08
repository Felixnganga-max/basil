import React, { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Camera,
  Eye,
  EyeOff,
  LogOut,
  Save,
} from "lucide-react";

// Profile Component
const Profile = ({ onLogout }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [saved, setSaved] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@company.com",
    phone: "+1 234 567 8900",
    address: "123 Main Street, City, Country",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Profile Settings
            </h1>
            <p className="text-zinc-400">Manage your account and security</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden mb-6">
          {/* Avatar Section */}
          <div className="relative h-32 bg-gradient-to-r from-red-500 to-green-500">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-zinc-900 flex items-center justify-center text-4xl font-bold">
                  {profileData.firstName[0]}
                  {profileData.lastName[0]}
                </div>
                <button className="absolute bottom-2 right-2 w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all">
                  <Camera size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-20 px-8 pb-6">
            <h2 className="text-2xl font-bold">
              {profileData.firstName} {profileData.lastName}
            </h2>
            <p className="text-zinc-400">{profileData.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === "personal"
                ? "bg-red-500 text-white"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === "security"
                ? "bg-red-500 text-white"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            Security
          </button>
        </div>

        {/* Content */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 md:p-8">
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2 text-zinc-300">
                    <User size={16} />
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2 text-zinc-300">
                    <User size={16} />
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-zinc-300">
                  <Mail size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-zinc-300">
                  <Phone size={16} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-zinc-300">
                  <MapPin size={16} />
                  Address
                </label>
                <textarea
                  value={profileData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-black border border-zinc-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Lock size={20} className="text-yellow-500 mt-1" />
                  <div>
                    <h3 className="font-medium mb-1">Password Security</h3>
                    <p className="text-sm text-zinc-400">
                      Use a strong password with at least 8 characters,
                      including uppercase, lowercase, numbers, and symbols.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-zinc-300">
                  <Lock size={16} />
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={profileData.currentPassword}
                    onChange={(e) =>
                      handleChange("currentPassword", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 transition-all pr-12"
                    placeholder="Enter current password"
                  />
                  <button
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-zinc-300">
                  <Lock size={16} />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={profileData.newPassword}
                    onChange={(e) =>
                      handleChange("newPassword", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 transition-all pr-12"
                    placeholder="Enter new password"
                  />
                  <button
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-zinc-300">
                  <Lock size={16} />
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={profileData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 transition-all pr-12"
                    placeholder="Confirm new password"
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-green-500 bg-opacity-10 border border-green-500 rounded-lg p-4">
                <p className="text-sm text-green-500">
                  Two-factor authentication is enabled for your account
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-8">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                saved
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              <Save size={18} />
              {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
