import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getFoodsApi,
  getFoodSummaryApi,
  deleteFoodApi,
  consumeFoodApi,
} from '../services/foodApi';
import { FoodItem, FoodStatus, FoodSummary, InventoryFilter } from '../types/inventory';

// ─── Async Thunks ─────────────────────────────────────────────────────────────
export const fetchFoods = createAsyncThunk(
  'inventory/fetchFoods',
  async (filter?: Exclude<InventoryFilter, 'all'>) => {
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
  summary: { total: 0, safe: 0, nearExpiry: 0, expired: 0, needCheck: 0 },
  activeFilter: 'all',
  loading: false,
  error: null,
};

function updateSummaryByStatus(summary: FoodSummary, status: FoodStatus, delta: number) {
  if (status === 'SAFE') summary.safe = Math.max(0, summary.safe + delta);
  if (status === 'NEAR_EXPIRY') summary.nearExpiry = Math.max(0, summary.nearExpiry + delta);
  if (status === 'EXPIRED') summary.expired = Math.max(0, summary.expired + delta);
  if (status === 'NEED_CHECK') summary.needCheck = Math.max(0, (summary.needCheck ?? 0) + delta);
}

function isVisibleInventoryItem(item: FoodItem) {
  return !item.isConsumed && Number(item.quantity) > 0;
}

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
      updateSummaryByStatus(state.summary, action.payload.status, 1);
    },
    updateFoodItem: (state, action: PayloadAction<FoodItem>) => {
      const idx = state.items.findIndex((i) => i._id === action.payload._id);
      if (idx !== -1) {
        updateSummaryByStatus(state.summary, state.items[idx].status, -1);
        if (isVisibleInventoryItem(action.payload)) {
          state.items[idx] = action.payload;
          updateSummaryByStatus(state.summary, action.payload.status, 1);
        } else {
          state.items.splice(idx, 1);
          state.summary.total = Math.max(0, state.summary.total - 1);
        }
      }
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
        const removed = state.items.find((i) => i._id === action.payload);
        if (removed) {
          state.summary.total = Math.max(0, state.summary.total - 1);
          updateSummaryByStatus(state.summary, removed.status, -1);
        }
        state.items = state.items.filter((i) => i._id !== action.payload);
      })
      // consumeFood
      .addCase(consumeFood.fulfilled, (state, action) => {
        const consumed = state.items.find((i) => i._id === action.payload);
        if (consumed) {
          state.summary.total = Math.max(0, state.summary.total - 1);
          updateSummaryByStatus(state.summary, consumed.status, -1);
        }
        state.items = state.items.filter((i) => i._id !== action.payload);
      });
  },
});

export const { setActiveFilter, addFoodItem, updateFoodItem } = inventorySlice.actions;
export default inventorySlice.reducer;
