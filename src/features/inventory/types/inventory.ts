export type StorageType = "fridge" | "outside" | "freezer";

export type InventoryItem = {
  id: string;
  name: string;
  quantity: string;
  storageLabel: string;
  storageType: StorageType;
  daysLeft: number;
  freshnessPercent: number;
  imageUrl: string;
};

export type InventoryFilter = "all" | "fridge" | "outside" | "expiring";