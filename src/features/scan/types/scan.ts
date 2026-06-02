export type ScanResult = {
  id: string;
  productName: string;
  aiPredictedDays: number;
  imageUrl: string;
  confidence: number;
};

export type StorageLocation = "fridge" | "outside" | "freezer";

export const STORAGE_LOCATIONS = {
  fridge: "Tủ lạnh",
  outside: "Bên ngoài",
  freezer: "Ngăn đông",
} as const;
