export type ApiHealthResponse = {
  status: 'ok';
  service: 'backend';
  version: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate?: string | null;
  location?: string | null;
};
