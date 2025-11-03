export interface Device {
  id: string;
  name: string;
  monthlyLimit?: number | null;
  createdAt: number;
}

export interface PartialOut {
  amount: number;
  timestamp: number;
  note?: string;
}

export interface Account {
  id: string;
  deviceId: string;
  bank: string;
  balance: number;
  previousBalance?: number; // For change detection (green/red animations)
  notes: string;
  active: boolean;
  blocked: boolean; // NEW: Blocked status
  blockedAmount?: number; // NEW: Amount when blocked (IMMUTABLE - never changes)
  dropName?: string; // NEW: Person's name (Viktor, Mike, etc.)
  pin?: string; // NEW: PIN code for the account
  blockedReason?: string; // NEW: Why it's blocked
  outs: PartialOut[];
  monthlyReceived: number;
  monthlyLimit: number;
  hasError?: boolean; // NEW: For error indicator
  createdAt: number;
  updatedAt: number;
}

export interface CloudSyncState {
  lastPush: number | null;
  lastPull: number | null;
  autoSyncEnabled: boolean;
  syncPending: boolean;
}

export interface ResetOptions {
  balance: boolean;
  active: boolean;
  outs: boolean;
  notes: boolean;
  monthlyReceived: boolean;
}

export interface ToastMessage {
  message: string;
  type: "success" | "error";
}
```

### Step 3: Commit
```
Commit message: "Add blockedAmount field to Account type"
Click: Commit changes
