export const BANKS = [
  "Monobank",
  "PUMB",
  "Alliance",
  "Izi",
  "Privat",
  "Agricole",
  "Freebank",
  "CA",
  "Sky",
] as const;

export const BANK_LIMITS: Record<string, number> = {
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

export const FOP_MONTHLY_LIMIT = 500000;
export const AUTO_PUSH_DELAY = 10000;
export const TOAST_DURATION = 3000;
