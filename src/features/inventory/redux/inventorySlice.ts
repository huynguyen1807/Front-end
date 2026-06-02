import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { inventoryMock } from "../data/inventoryMock";
import { InventoryFilter, InventoryItem } from "../types/inventory";

type InventoryState = {
  items: InventoryItem[];
  activeFilter: InventoryFilter;
};

const initialState: InventoryState = {
  items: inventoryMock,
  activeFilter: "all",
};

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    setActiveFilter: (state, action: PayloadAction<InventoryFilter>) => {
      state.activeFilter = action.payload;
    },

    addInventoryItem: (state, action: PayloadAction<InventoryItem>) => {
      state.items.unshift(action.payload);
    },
  },
});

export const { setActiveFilter, addInventoryItem } = inventorySlice.actions;

export default inventorySlice.reducer;