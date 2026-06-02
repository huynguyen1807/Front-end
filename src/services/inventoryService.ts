import type { InventoryItem } from 'types/api';

const mockInventoryItems: InventoryItem[] = [];

export const inventoryService = {
  list: async (): Promise<InventoryItem[]> => mockInventoryItems
};
