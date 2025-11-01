import React, { useState, useEffect, useCallback } from "react";
import {
  Upload,
  Download,
  Cloud,
  CloudOff,
  Plus,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Save,
  Edit2,
  RefreshCw,
} from "lucide-react";
import { pushAllData, pullAllData } from "./firebase";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Device {
  id: string;
  name: string;
  monthlyLimit?: number;
  createdAt: number;
}

interface PartialOut {
  amount: number;
  timestamp: number;
  note?: string;
}

interface Account {
  id: string;
  deviceId: string;
  bank: string;
  balance: number;
  notes: string;
  active: boolean;
  outs: PartialOut[];
  monthlyReceived: number;
  monthlyLimit: number;
  createdAt: number;
  updatedAt: number;
}

interface CloudSyncState {
  lastPush: number | null;
  lastPull: number | null;
  autoSyncEnabled: boolean;
  syncPending: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BANKS = [
  "Monobank",
  "PUMB",
  "Alliance",
  "Izi",
  "Privat",
  "Agricole",
  "Freebank",
  "CA",
  "Sky",
];

const BANK_LIMITS: Record<string, number> = {
  PUMB: 80000,
  Monobank: 80000,
  Alliance: 30000,
  Izi: 60000,
  Agricole: 80000,
  Privat: 80000,
  Freebank: 80000,
  CA: 80000,
  Sky: 80000,
};

const FOP_MONTHLY_LIMIT = 500000;
const AUTO_PUSH_DELAY = 10000;

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

// ============================================================================
// TOAST NOTIFICATION
// ============================================================================

const Toast: React.FC<{
  message: string;
  type: "success" | "error";
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg backdrop-blur-xl border animate-slide-in ${
        type === "success"
          ? "bg-green-500/20 border-green-400/30 text-green-100"
          : "bg-red-500/20 border-red-400/30 text-red-100"
      }`}
    >
      <div className="flex items-center gap-2">
        {type === "success" ? (
          <CheckCircle size={18} />
        ) : (
          <AlertCircle size={18} />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function App() {
  const [devices, setDevices] = useState<Device[]>(() =>
    storage.get("devices", []),
  );
  const [accounts, setAccounts] = useState<Account[]>(() =>
    storage.get("accounts", []),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<string[]>([]);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [cloudSync, setCloudSync] = useState<CloudSyncState>(() =>
    storage.get("cloudSync", {
      lastPush: null,
      lastPull: null,
      autoSyncEnabled: false,
      syncPending: false,
    }),
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingOutAccountId, setEditingOutAccountId] = useState<string | null>(
    null,
  );
  const [newOutAmount, setNewOutAmount] = useState("");
  const [newOutNote, setNewOutNote] = useState("");
  const [showDeviceManager, setShowDeviceManager] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showDeviceFilterModal, setShowDeviceFilterModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetOptions, setResetOptions] = useState({
    balance: true,
    active: true,
    outs: true,
    notes: true,
    monthlyReceived: true,
  });
  const [showOutsHistory, setShowOutsHistory] = useState<string | null>(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceIsFOP, setNewDeviceIsFOP] = useState(false);
  const [deviceError, setDeviceError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [selectedDeviceForAccount, setSelectedDeviceForAccount] = useState("");
  const [selectedBankForAccount, setSelectedBankForAccount] = useState("");

  const executeResetAll = () => {
    const updatedAccounts = accounts.map((acc) => ({
      ...acc,
      balance: resetOptions.balance ? 0 : acc.balance,
      active: resetOptions.active ? false : acc.active,
      outs: resetOptions.outs ? [] : acc.outs,
      notes: resetOptions.notes ? "" : acc.notes,
      monthlyReceived: resetOptions.monthlyReceived ? 0 : acc.monthlyReceived,
      updatedAt: Date.now(),
    }));

    setAccounts(updatedAccounts);
    setCloudSync((prev) => ({ ...prev, syncPending: true }));
    setShowResetConfirmModal(false);

    // Reset options for next time
    setResetOptions({
      balance: true,
      active: true,
      outs: true,
      notes: true,
      monthlyReceived: true,
    });

    const resetItems = [];
    if (resetOptions.balance) resetItems.push("balances");
    if (resetOptions.active) resetItems.push("active states");
    if (resetOptions.outs) resetItems.push("outs");
    if (resetOptions.notes) resetItems.push("notes");
    if (resetOptions.monthlyReceived) resetItems.push("monthly received");

    showToast(`✅ Reset: ${resetItems.join(", ")}`, "success");
  };

  useEffect(() => {
    storage.set("devices", devices);
  }, [devices]);

  useEffect(() => {
    storage.set("accounts", accounts);
  }, [accounts]);

  useEffect(() => {
    storage.set("cloudSync", cloudSync);
  }, [cloudSync]);

  useEffect(() => {
    if (!cloudSync.autoSyncEnabled || !cloudSync.syncPending) return;

    const timer = setTimeout(() => {
      handlePushToCloud();
    }, AUTO_PUSH_DELAY);

    return () => clearTimeout(timer);
  }, [cloudSync.autoSyncEnabled, cloudSync.syncPending]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const markSyncPending = () => {
    setCloudSync((prev) => ({ ...prev, syncPending: true }));
  };

  const addDevice = (name: string, isFOP: boolean = false) => {
    // Check if device name already exists
    const existingDevice = devices.find(
      (d) => d.name.toLowerCase() === name.toLowerCase(),
    );
    if (existingDevice) {
      setDeviceError("This device already exists.");
      return;
    }

    const newDevice: Device = {
      id: `DEV_${Date.now()}`,
      name,
      monthlyLimit: isFOP ? FOP_MONTHLY_LIMIT : undefined,
      createdAt: Date.now(),
    };
    setDevices((prev) => [...prev, newDevice]);
    markSyncPending();
    showToast(`Device "${name}" added`, "success");
    setDeviceError("");
  };

  const removeDevice = (deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    setAccounts((prev) => prev.filter((a) => a.deviceId !== deviceId));
    markSyncPending();
    showToast("Device removed", "success");
  };

  const addAccount = (deviceId: string, bank: string) => {
    // Check if this bank is already linked to this device
    const existingAccount = accounts.find(
      (acc) => acc.deviceId === deviceId && acc.bank === bank,
    );

    if (existingAccount) {
      setAccountError("This bank is already linked to this device.");
      return;
    }

    const newAccount: Account = {
      id: `ACC_${Date.now()}`,
      deviceId,
      bank,
      balance: 0,
      notes: "",
      active: false,
      outs: [],
      monthlyReceived: 0,
      monthlyLimit: BANK_LIMITS[bank] || 80000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setAccounts((prev) => [...prev, newAccount]);
    markSyncPending();
    showToast(
      `Account added to ${devices.find((d) => d.id === deviceId)?.name}`,
      "success",
    );
    setAccountError("");
  };

  const updateAccount = (accountId: string, updates: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, ...updates, updatedAt: Date.now() }
          : acc,
      ),
    );
    markSyncPending();
  };

  const deleteAccount = (accountId: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    markSyncPending();
    showToast("Account deleted", "success");
  };

  const addOut = (accountId: string, amount: number, note: string = "") => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              outs: [...acc.outs, { amount, timestamp: Date.now(), note }],
              updatedAt: Date.now(),
            }
          : acc,
      ),
    );
    markSyncPending();
    setEditingOutAccountId(null);
    setNewOutAmount("");
    setNewOutNote("");
    showToast(`Added out: ${amount.toLocaleString()} UAH`, "success");
  };

  const deleteOut = (accountId: string, outIndex: number) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              outs: acc.outs.filter((_, i) => i !== outIndex),
              updatedAt: Date.now(),
            }
          : acc,
      ),
    );
    markSyncPending();
    showToast("Out deleted", "success");
  };

  const resetOuts = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, outs: [], updatedAt: Date.now() }
          : acc,
      ),
    );
    markSyncPending();
    showToast("Outs reset", "success");
  };

  const resetAllData = () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all account data? This will clear:\n• All balances (set to 0)\n• All active checkboxes (set to false)\n• All outs history\n• All notes\n• All monthly received amounts\n\nMonthly limits will remain unchanged.\n\nThis action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        balance: 0,
        active: false,
        outs: [],
        notes: "",
        monthlyReceived: 0,
        updatedAt: Date.now(),
      })),
    );
    markSyncPending();
    showToast("✅ All account data has been reset", "success");
  };

  const handlePushToCloud = async () => {
    setIsLoading(true);
    try {
      await pushAllData(devices, accounts);
      setCloudSync((prev) => ({
        ...prev,
        lastPush: Date.now(),
        syncPending: false,
      }));
      showToast("✅ Pushed to cloud successfully", "success");
    } catch (error) {
      console.error("Push error:", error);
      showToast("❌ Push failed - check console for details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsLoading(true);
    try {
      const { devices: cloudDevices, accounts: cloudAccounts } =
        await pullAllData();

      if (cloudDevices.length > 0 || cloudAccounts.length > 0) {
        setDevices(cloudDevices);
        setAccounts(cloudAccounts);
        showToast(
          `✅ Pulled ${cloudDevices.length} devices and ${cloudAccounts.length} accounts`,
          "success",
        );
      } else {
        showToast("ℹ️ No data found in cloud", "success");
      }

      setCloudSync((prev) => ({
        ...prev,
        lastPull: Date.now(),
        syncPending: false,
      }));
    } catch (error) {
      console.error("Pull error:", error);
      showToast("❌ Pull failed - check console for details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Device",
      "Bank",
      "Balance",
      "Sent",
      "Remaining",
      "Active",
      "Monthly Received",
      "Monthly Limit",
      "Notes",
    ];
    const rows = filteredAccounts.map((acc) => {
      const device = devices.find((d) => d.id === acc.deviceId);
      const sent = acc.outs.reduce((sum, out) => sum + out.amount, 0);
      const remaining = acc.balance - sent;
      return [
        device?.name || acc.deviceId,
        acc.bank,
        acc.balance.toFixed(2),
        sent.toFixed(2),
        remaining.toFixed(2),
        acc.active ? "Yes" : "No",
        acc.monthlyReceived.toFixed(2),
        acc.monthlyLimit.toFixed(2),
        acc.notes,
      ];
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `p2p-accounts-${Date.now()}.csv`;
    a.click();
    showToast("CSV exported", "success");
  };

  const exportToJSON = () => {
    const data = { devices, accounts, exportedAt: Date.now() };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `p2p-full-backup-${Date.now()}.json`;
    a.click();
    showToast("JSON exported", "success");
  };

  const importFromJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (data.accounts) {
          data.accounts = data.accounts.map((acc: any) => {
            if (typeof acc.sent === "number" && !acc.outs) {
              return {
                ...acc,
                outs:
                  acc.sent > 0
                    ? [
                        {
                          amount: acc.sent,
                          timestamp: acc.updatedAt || Date.now(),
                        },
                      ]
                    : [],
              };
            }
            return acc;
          });
        }

        if (data.devices) setDevices(data.devices);
        if (data.accounts) setAccounts(data.accounts);
        markSyncPending();
        showToast("JSON imported successfully", "success");
      } catch (error) {
        showToast("Invalid JSON file", "error");
      }
    };
    reader.readAsText(file);
  };

  const toggleDeviceFilter = (deviceId: string) => {
    setDeviceFilter((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId],
    );
  };

  const filteredAccounts = accounts
    .filter((acc) => {
      const device = devices.find((d) => d.id === acc.deviceId);
      const matchesSearch =
        !searchTerm ||
        device?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.bank.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBank = !bankFilter || acc.bank === bankFilter;
      const matchesDevice =
        deviceFilter.length === 0 || deviceFilter.includes(acc.deviceId);
      const matchesActive = !showActiveOnly || acc.active;
      return matchesSearch && matchesBank && matchesDevice && matchesActive;
    })
    .sort((a, b) => {
      // Sort by device name first
      const deviceA = devices.find((d) => d.id === a.deviceId);
      const deviceB = devices.find((d) => d.id === b.deviceId);
      const deviceNameA = deviceA?.name || "";
      const deviceNameB = deviceB?.name || "";

      if (deviceNameA !== deviceNameB) {
        return deviceNameA.localeCompare(deviceNameB);
      }

      // Then sort by bank name
      return a.bank.localeCompare(b.bank);
    });

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalSent = accounts.reduce(
    (sum, acc) => sum + acc.outs.reduce((s, out) => s + out.amount, 0),
    0,
  );
  const totalRemaining = totalBalance - totalSent;
  const activeAccounts = accounts.filter((acc) => acc.active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 transition-all duration-500">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style>
        {`
          @keyframes slide-in {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scale-in {
            from {
              transform: scale(0.9);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          .animate-slide-in {
            animation: slide-in 0.3s ease-out;
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out;
          }
          .animate-scale-in {
            animation: scale-in 0.2s ease-out;
          }

          /* iOS-style toggle switch */
          .toggle-switch {
            position: relative;
            width: 44px;
            height: 24px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }

          .toggle-switch.checked {
            background-color: #3b82f6;
          }

          .toggle-slider {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background-color: white;
            border-radius: 50%;
            transition: transform 0.3s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .toggle-switch.checked .toggle-slider {
            transform: translateX(20px);
          }
        `}
      </style>

      <div className="max-w-[1800px] mx-auto mb-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transform transition-all duration-300 hover:shadow-purple-500/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="transform transition-all duration-300">
              <h1 className="text-3xl font-bold text-white mb-1 bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">
                P2P Ops Dashboard
              </h1>
              <p className="text-white/50 text-sm">
                Managing {accounts.length} accounts across {devices.length}{" "}
                devices
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePullFromCloud}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 disabled:bg-gray-500/10 disabled:cursor-not-allowed border border-blue-400/20 text-blue-200 disabled:text-gray-400 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              >
                <Cloud size={18} className={isLoading ? "animate-pulse" : ""} />
                {isLoading ? "Pulling..." : "Pull"}
              </button>
              <button
                onClick={handlePushToCloud}
                disabled={isLoading}
                className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 disabled:bg-gray-500/10 disabled:cursor-not-allowed border border-green-400/20 text-green-200 disabled:text-gray-400 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              >
                <Cloud size={18} className={isLoading ? "animate-pulse" : ""} />
                {isLoading ? "Pushing..." : "Push"}
                {cloudSync.syncPending && !isLoading && (
                  <Save size={14} className="animate-pulse" />
                )}
              </button>
              <label className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/20 text-purple-200 rounded-lg flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105">
                <Upload size={18} />
                Import
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && importFromJSON(e.target.files[0])
                  }
                />
              </label>
              <button
                onClick={exportToJSON}
                className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/20 text-purple-200 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
              >
                <Download size={18} />
                JSON
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/20 text-indigo-200 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
              >
                <Download size={18} />
                CSV
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm text-white/50">
            <label className="flex items-center gap-2 cursor-pointer hover:text-white/70 transition-colors">
              <input
                type="checkbox"
                checked={cloudSync.autoSyncEnabled}
                onChange={(e) =>
                  setCloudSync((prev) => ({
                    ...prev,
                    autoSyncEnabled: e.target.checked,
                  }))
                }
                className="rounded"
              />
              Auto-sync (10s)
            </label>
            {cloudSync.lastPush && (
              <span className="animate-fade-in">
                Last push: {new Date(cloudSync.lastPush).toLocaleTimeString()}
              </span>
            )}
            {cloudSync.lastPull && (
              <span className="animate-fade-in">
                Last pull: {new Date(cloudSync.lastPull).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 transform transition-all duration-300 hover:scale-105 hover:bg-white/10 animate-scale-in">
          <div className="text-white/50 text-sm mb-1">Total Balance</div>
          <div className="text-2xl font-bold text-white">
            {totalBalance.toLocaleString()} UAH
          </div>
        </div>
        <div
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 transform transition-all duration-300 hover:scale-105 hover:bg-white/10 animate-scale-in"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="text-white/50 text-sm mb-1">Total Sent</div>
          <div className="text-2xl font-bold text-red-300">
            {totalSent.toLocaleString()} UAH
          </div>
        </div>
        <div
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 transform transition-all duration-300 hover:scale-105 hover:bg-white/10 animate-scale-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="text-white/50 text-sm mb-1">Total Remaining</div>
          <div className="text-2xl font-bold text-green-300">
            {totalRemaining.toLocaleString()} UAH
          </div>
        </div>
        <div
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 transform transition-all duration-300 hover:scale-105 hover:bg-white/10 animate-scale-in"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="text-white/50 text-sm mb-1">Active Accounts</div>
          <div className="text-2xl font-bold text-blue-300">
            {activeAccounts.length} / {accounts.length}
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search device or bank..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 transition-all duration-200"
              />
            </div>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="px-4 py-2 bg-violet-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400/50 cursor-pointer transition-all duration-200"
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-violet-900 text-white">
                All Banks
              </option>
              {BANKS.map((bank) => (
                <option
                  key={bank}
                  value={bank}
                  className="bg-violet-900 text-white"
                >
                  {bank}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowDeviceFilterModal(true)}
              className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/20 text-indigo-200 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
            >
              <Filter size={18} />
              Devices {deviceFilter.length > 0 && `(${deviceFilter.length})`}
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white cursor-pointer hover:bg-white/10 transition-all duration-200">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded"
              />
              Active only
            </label>
            <button
              onClick={() => setShowResetConfirmModal(true)}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-400/20 text-red-200 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
            >
              <RefreshCw size={18} />
              Reset All
            </button>
            <button
              onClick={() => setShowAddAccount(true)}
              className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-400/20 text-green-200 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
            >
              <Plus size={18} />
              Add Account
            </button>
            <button
              onClick={() => setShowDeviceManager(true)}
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/20 text-blue-200 rounded-lg transition-all duration-200 hover:scale-105"
            >
              Manage Devices
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/70">
                  <th className="text-left p-3">Active</th>
                  <th className="text-left p-3">Device</th>
                  <th className="text-left p-3">Bank</th>
                  <th className="text-right p-3">Balance</th>
                  <th className="text-right p-3">Sent</th>
                  <th className="text-right p-3">Remaining</th>
                  <th className="text-left p-3">Monthly</th>
                  <th className="text-left p-3">Outs</th>
                  <th className="text-left p-3">Notes</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((acc) => {
                  const device = devices.find((d) => d.id === acc.deviceId);
                  const sent = acc.outs.reduce(
                    (sum, out) => sum + out.amount,
                    0,
                  );
                  const remaining = acc.balance - sent;
                  const monthlyOk = acc.monthlyReceived <= acc.monthlyLimit;

                  return (
                    <tr
                      key={acc.id}
                      className="border-b border-white/5 text-white hover:bg-white/5 transition-all duration-150 animate-fade-in"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={acc.active}
                          onChange={(e) =>
                            updateAccount(acc.id, { active: e.target.checked })
                          }
                          className="rounded transition-all duration-150 cursor-pointer w-4 h-4"
                        />
                      </td>
                      <td className="p-3 text-white/90 font-medium">
                        {device?.name}
                      </td>
                      <td className="p-3 text-white/90">{acc.bank}</td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          value={acc.balance}
                          onChange={(e) =>
                            updateAccount(acc.id, {
                              balance: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-28 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-right text-white transition-all duration-150 focus:border-purple-400/50 focus:outline-none hover:bg-white/10"
                        />
                      </td>
                      <td className="p-3 text-right text-red-300 font-medium">
                        {sent.toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-green-300 font-medium">
                        {remaining.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={acc.monthlyReceived}
                            onChange={(e) =>
                              updateAccount(acc.id, {
                                monthlyReceived:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-24 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white transition-all duration-150 focus:border-purple-400/50 focus:outline-none hover:bg-white/10"
                          />
                          <span className="text-xs text-white/40">
                            / {acc.monthlyLimit.toLocaleString()}
                          </span>
                          {monthlyOk ? (
                            <CheckCircle size={14} className="text-green-400" />
                          ) : (
                            <AlertCircle
                              size={14}
                              className="text-red-400 animate-pulse"
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {editingOutAccountId === acc.id ? (
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              value={newOutAmount}
                              onChange={(e) => setNewOutAmount(e.target.value)}
                              placeholder="Amount"
                              className="w-24 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white transition-all duration-150 focus:border-purple-400/50 focus:outline-none"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={newOutNote}
                              onChange={(e) => setNewOutNote(e.target.value)}
                              placeholder="Note (optional)"
                              className="w-32 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white transition-all duration-150 focus:border-purple-400/50 focus:outline-none"
                            />
                            <button
                              onClick={() =>
                                addOut(
                                  acc.id,
                                  parseFloat(newOutAmount) || 0,
                                  newOutNote,
                                )
                              }
                              className="p-1.5 bg-green-500/30 rounded-lg hover:bg-green-500/40 transition-all duration-150"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingOutAccountId(null);
                                setNewOutAmount("");
                                setNewOutNote("");
                              }}
                              className="p-1.5 bg-red-500/30 rounded-lg hover:bg-red-500/40 transition-all duration-150"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setEditingOutAccountId(acc.id)}
                              className="px-3 py-1.5 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 text-xs font-medium transition-all duration-150 hover:scale-105"
                            >
                              + Out
                            </button>
                            {acc.outs.length > 0 && (
                              <>
                                <button
                                  onClick={() => setShowOutsHistory(acc.id)}
                                  className="px-3 py-1.5 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 text-xs font-medium transition-all duration-150 hover:scale-105"
                                >
                                  History ({acc.outs.length})
                                </button>
                                <button
                                  onClick={() => resetOuts(acc.id)}
                                  className="px-3 py-1.5 bg-orange-500/20 rounded-lg hover:bg-orange-500/30 text-xs font-medium transition-all duration-150 hover:scale-105"
                                >
                                  Reset
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={acc.notes}
                          onChange={(e) =>
                            updateAccount(acc.id, { notes: e.target.value })
                          }
                          placeholder="Notes..."
                          className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white transition-all duration-150 focus:border-purple-400/50 focus:outline-none hover:bg-white/10"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => deleteAccount(acc.id)}
                          className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all duration-150 hover:scale-110"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAccounts.length === 0 && (
            <div className="text-center py-12 text-white/40 animate-fade-in">
              <p className="text-lg">No accounts found</p>
              <p className="text-sm mt-2">
                Add an account or adjust your filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Device Manager Modal */}
      {showDeviceManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-slate-900/98 to-purple-900/98 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Manage Devices</h2>
              <button
                onClick={() => setShowDeviceManager(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-white font-medium mb-3">Add New Device</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newDeviceName}
                  onChange={(e) => {
                    setNewDeviceName(e.target.value);
                    setDeviceError(""); // Clear error when user types
                  }}
                  placeholder="Device name (e.g., ID1, PHONE_FOP_1)"
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400/50 transition-all duration-200"
                />
                <label className="flex items-center gap-2 text-white cursor-pointer hover:text-white/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={newDeviceIsFOP}
                    onChange={(e) => setNewDeviceIsFOP(e.target.checked)}
                    className="rounded w-4 h-4"
                  />
                  <span>FOP Device (500,000 UAH monthly limit)</span>
                </label>
                <button
                  onClick={() => {
                    if (newDeviceName.trim()) {
                      addDevice(newDeviceName.trim(), newDeviceIsFOP);
                      // Only clear inputs if successful (no error)
                      if (
                        !devices.find(
                          (d) =>
                            d.name.toLowerCase() ===
                            newDeviceName.trim().toLowerCase(),
                        )
                      ) {
                        setNewDeviceName("");
                        setNewDeviceIsFOP(false);
                      }
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
                >
                  <Plus size={18} />
                  Add Device
                </button>
                {deviceError && (
                  <div className="mt-3 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200 text-sm animate-fade-in">
                    {deviceError}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-white font-medium mb-3">
                Existing Devices ({devices.length})
              </h3>
              <div className="space-y-2">
                {devices.map((device, index) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between bg-white/10 rounded-lg p-3 hover:bg-white/15 transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div>
                      <div className="text-white font-medium">
                        {device.name}
                      </div>
                      {device.monthlyLimit && (
                        <div className="text-xs text-white/60">
                          FOP • Monthly limit:{" "}
                          {device.monthlyLimit.toLocaleString()} UAH
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeDevice(device.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Delete device"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {devices.length === 0 && (
              <div className="text-center py-8 text-white/40">
                No devices yet. Add a device above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-slate-900/98 to-purple-900/98 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Add Account</h2>
              <button
                onClick={() => {
                  setShowAddAccount(false);
                  setSelectedDeviceForAccount("");
                  setSelectedBankForAccount("");
                  setAccountError("");
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Device
                </label>
                <select
                  id="device-select"
                  value={selectedDeviceForAccount}
                  onChange={(e) => {
                    setSelectedDeviceForAccount(e.target.value);
                    setAccountError(""); // Clear error when device changes
                  }}
                  className="w-full px-4 py-2.5 bg-violet-900/80 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400/50 appearance-none cursor-pointer transition-all duration-200"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="" className="bg-violet-900 text-white">
                    Select device...
                  </option>
                  {devices.map((device) => (
                    <option
                      key={device.id}
                      value={device.id}
                      className="bg-violet-900 text-white"
                    >
                      {device.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Bank</label>
                <select
                  id="bank-select"
                  value={selectedBankForAccount}
                  onChange={(e) => {
                    setSelectedBankForAccount(e.target.value);
                    setAccountError(""); // Clear error when bank changes
                  }}
                  className="w-full px-4 py-2.5 bg-violet-900/80 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400/50 appearance-none cursor-pointer transition-all duration-200"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="" className="bg-violet-900 text-white">
                    Select bank...
                  </option>
                  {BANKS.map((bank) => (
                    <option
                      key={bank}
                      value={bank}
                      className="bg-violet-900 text-white"
                    >
                      {bank}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  const deviceId = selectedDeviceForAccount;
                  const bank = selectedBankForAccount;

                  if (deviceId && bank && deviceId !== "" && bank !== "") {
                    addAccount(deviceId, bank);
                    // Only close modal if successful (no error)
                    if (
                      !accounts.find(
                        (acc) => acc.deviceId === deviceId && acc.bank === bank,
                      )
                    ) {
                      setShowAddAccount(false);
                      setSelectedDeviceForAccount("");
                      setSelectedBankForAccount("");
                      setAccountError("");
                    }
                  } else {
                    showToast("Please select both device and bank", "error");
                  }
                }}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
              >
                Add Account
              </button>

              {accountError && (
                <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200 text-sm animate-fade-in">
                  {accountError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Device Filter Modal */}
      {showDeviceFilterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-slate-900/98 to-purple-900/98 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                Filter by Devices
              </h2>
              <button
                onClick={() => setShowDeviceFilterModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {devices.map((device) => (
                <label
                  key={device.id}
                  className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all duration-200"
                >
                  <input
                    type="checkbox"
                    checked={deviceFilter.includes(device.id)}
                    onChange={() => toggleDeviceFilter(device.id)}
                    className="rounded w-4 h-4"
                  />
                  <span className="text-white font-medium">{device.name}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDeviceFilter([])}
                className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-200 rounded-lg font-medium transition-all duration-200"
              >
                Clear All
              </button>
              <button
                onClick={() => setDeviceFilter(devices.map((d) => d.id))}
                className="flex-1 px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-200 rounded-lg font-medium transition-all duration-200"
              >
                Select All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-900/98 to-purple-900/98 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full my-8 animate-scale-in shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg">
                  <AlertCircle size={24} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Reset Data</h2>
                  <p className="text-white/50 text-xs">Select what to reset</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowResetConfirmModal(false);
                  setResetOptions({
                    balance: true,
                    active: true,
                    outs: true,
                    notes: true,
                    monthlyReceived: true,
                  });
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X size={20} className="text-white/70" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all duration-200 group">
                <input
                  type="checkbox"
                  checked={resetOptions.balance}
                  onChange={(e) =>
                    setResetOptions((prev) => ({
                      ...prev,
                      balance: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded transition-all duration-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">
                    Balances → 0
                  </div>
                  <div className="text-white/40 text-xs">
                    Reset all balances
                  </div>
                </div>
                <div
                  className={`transition-all duration-300 ${resetOptions.balance ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
                >
                  <Check size={16} className="text-green-400" />
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all duration-200 group">
                <input
                  type="checkbox"
                  checked={resetOptions.active}
                  onChange={(e) =>
                    setResetOptions((prev) => ({
                      ...prev,
                      active: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded transition-all duration-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">
                    Active → OFF
                  </div>
                  <div className="text-white/40 text-xs">
                    Deactivate all accounts
                  </div>
                </div>
                <div
                  className={`transition-all duration-300 ${resetOptions.active ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
                >
                  <Check size={16} className="text-green-400" />
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all duration-200 group">
                <input
                  type="checkbox"
                  checked={resetOptions.outs}
                  onChange={(e) =>
                    setResetOptions((prev) => ({
                      ...prev,
                      outs: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded transition-all duration-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">
                    Outs → DELETED
                  </div>
                  <div className="text-white/40 text-xs">
                    Clear transaction history
                  </div>
                </div>
                <div
                  className={`transition-all duration-300 ${resetOptions.outs ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
                >
                  <Check size={16} className="text-green-400" />
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all duration-200 group">
                <input
                  type="checkbox"
                  checked={resetOptions.notes}
                  onChange={(e) =>
                    setResetOptions((prev) => ({
                      ...prev,
                      notes: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded transition-all duration-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">
                    Notes → EMPTY
                  </div>
                  <div className="text-white/40 text-xs">Clear all notes</div>
                </div>
                <div
                  className={`transition-all duration-300 ${resetOptions.notes ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
                >
                  <Check size={16} className="text-green-400" />
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all duration-200 group">
                <input
                  type="checkbox"
                  checked={resetOptions.monthlyReceived}
                  onChange={(e) =>
                    setResetOptions((prev) => ({
                      ...prev,
                      monthlyReceived: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded transition-all duration-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">
                    Monthly received → 0
                  </div>
                  <div className="text-white/40 text-xs">
                    Reset monthly amounts
                  </div>
                </div>
                <div
                  className={`transition-all duration-300 ${resetOptions.monthlyReceived ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
                >
                  <Check size={16} className="text-green-400" />
                </div>
              </label>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-green-400 text-xs">
                <CheckCircle size={14} />
                <span className="font-medium">Monthly limits preserved</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowResetConfirmModal(false);
                  setResetOptions({
                    balance: true,
                    active: true,
                    outs: true,
                    notes: true,
                    monthlyReceived: true,
                  });
                }}
                className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={executeResetAll}
                disabled={!Object.values(resetOptions).some((v) => v)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
              >
                Reset Selected
              </button>
            </div>

            <p className="text-white/30 text-xs text-center mt-3">
              Cannot be undone
            </p>
          </div>
        </div>
      )}

      {/* Outs History Modal */}
      {showOutsHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-slate-900/98 to-purple-900/98 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scale-in">
            {(() => {
              const account = accounts.find((a) => a.id === showOutsHistory);
              const device = devices.find((d) => d.id === account?.deviceId);

              return (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Outs History
                      </h2>
                      <p className="text-white/60 text-sm">
                        {device?.name} • {account?.bank}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowOutsHistory(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <X size={24} className="text-white" />
                    </button>
                  </div>

                  {account && account.outs.length > 0 ? (
                    <div className="space-y-2">
                      {account.outs.map((out, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all duration-200 animate-fade-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex-1">
                            <div className="text-white font-semibold text-lg">
                              {out.amount.toLocaleString()} UAH
                            </div>
                            <div className="text-white/50 text-xs">
                              {new Date(out.timestamp).toLocaleString()}
                            </div>
                            {out.note && (
                              <div className="text-white/70 text-sm mt-1">
                                {out.note}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => deleteOut(account.id, index)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all duration-200 hover:scale-110"
                          >
                            <Trash2 size={16} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-white/40">
                      <p>No outs recorded yet</p>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-white">
                      <span className="font-medium">Total Sent:</span>
                      <span className="font-bold text-xl">
                        {account?.outs
                          .reduce((sum, out) => sum + out.amount, 0)
                          .toLocaleString()}{" "}
                        UAH
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
