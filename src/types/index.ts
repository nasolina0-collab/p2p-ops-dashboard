export interface Device {
  id: string;
  name: string;
  monthlyLimit?: number;
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
  notes: string;
  active: boolean;
  outs: PartialOut[];
  monthlyReceived: number;
  monthlyLimit: number;
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
  type: 'success' | 'error';
}
