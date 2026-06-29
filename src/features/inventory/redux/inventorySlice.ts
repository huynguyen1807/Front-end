import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getFoodsApi,
  getFoodSummaryApi,
  deleteFoodApi,
  consumeFoodApi,
} from '../services/foodApi';
import { FoodItem, FoodSummary, InventoryFilter } from '../types/inventory';

// ─── Async Thunks ─────────────────────────────────────────────────────────────
export const fetchFoods = createAsyncThunk(
  'inventory/fetchFoods',
  async (filter?: 'SAFE' | 'NEAR_EXPIRY' | 'EXPIRED') => {
    return getFoodsApi(filter);
  }
);

export const fetchSummary = createAsyncThunk(
  'inventory/fetchSummary',
  async () => getFoodSummaryApi()
);

export const deleteFood = createAsyncThunk(
  'inventory/deleteFood',
  async (id: string) => {
    await deleteFoodApi(id);
    return id;
  }
);

export const consumeFood = createAsyncThunk(
  'inventory/consumeFood',
  async (id: string) => {
    await consumeFoodApi(id);
    return id;
  }
);

// ─── State ────────────────────────────────────────────────────────────────────
type InventoryState = {
  items: FoodItem[];
  summary: FoodSummary;
  activeFilter: InventoryFilter;
  loading: boolean;
  error: string | null;
};

const initialState: InventoryState = {
  items: [],
  summary: { total: 0, safe: 0, nearExpiry: 0, expired: 0 },
  activeFilter: 'all',
  loading: false,
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setActiveFilter: (state, action: PayloadAction<InventoryFilter>) => {
      state.activeFilter = action.payload;
    },
    addFoodItem: (state, action: PayloadAction<FoodItem>) => {
      state.items.unshift(action.payload);
      state.summary.total += 1;
      if (action.payload.status === 'SAFE') state.summary.safe += 1;
      if (action.payload.status === 'NEAR_EXPIRY') state.summary.nearExpiry += 1;
      if (action.payload.status === 'EXPIRED') state.summary.expired += 1;
    },
    updateFoodItem: (state, action: PayloadAction<FoodItem>) => {
      const idx = state.items.findIndex((i) => i._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchFoods
      .addCase(fetchFoods.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFoods.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFoods.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load foods';
      })
      // fetchSummary
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      // deleteFood
      .addCase(deleteFood.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i._id !== action.payload);
      })
      // consumeFood
      .addCase(consumeFood.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i._id !== action.payload);
      });
  },
});

export const { setActiveFilter, addFoodItem, updateFoodItem } = inventorySlice.actions;
export default inventorySlice.reducer;