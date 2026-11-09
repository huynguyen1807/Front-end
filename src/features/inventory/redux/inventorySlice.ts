import { createSlice, createAsyncThunk, PayloadAction, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import {
  getFoodsApi,
  getFoodSummaryApi,
  deleteFoodApi,
  consumeFoodApi,
} from '../services/foodApi';
import { FoodItem, FoodStatus, FoodSummary, InventoryFilter } from '../types/inventory';

type ReadFailure = { status?: number; message: string };
type ReadThunkApi = { getState: () => unknown; signal: AbortSignal; rejectWithValue: (failure: ReadFailure) => any };
type AsyncAction<T> = PayloadAction<T, string, { requestId: string; aborted?: boolean }>;
type ReadRejection = AsyncAction<ReadFailure | undefined> & { error: { message?: string } };
const readFailure = (error: any): ReadFailure => ({ status: error?.response?.status, message: error?.response?.data?.message || error?.message || 'Không tải được dữ liệu.' });

// ─── Async Thunks ─────────────────────────────────────────────────────────────
export const fetchFoods = createAsyncThunk<FoodItem[], Exclude<InventoryFilter, 'all'> | undefined, { rejectValue: ReadFailure }>(
  'inventory/fetchFoods',
  async (filter: Exclude<InventoryFilter, 'all'> | undefined, { getState, signal, rejectWithValue }: ReadThunkApi) => {
    const state = getState() as any;
    const { ownerType, householdId } = state.inventory.context;
    try { return await getFoodsApi(filter, ownerType, householdId, { signal, timeout: 10000 }); }
    catch (error) { return rejectWithValue(readFailure(error)); }
  }
);

export const fetchSummary = createAsyncThunk<FoodSummary, void, { rejectValue: ReadFailure }>(
  'inventory/fetchSummary',
  async (_: void, { getState, signal, rejectWithValue }: ReadThunkApi) => {
    const state = getState() as any;
    const { ownerType, householdId } = state.inventory.context;
    try { return await getFoodSummaryApi(ownerType, householdId, { signal, timeout: 10000 }); }
    catch (error) { return rejectWithValue(readFailure(error)); }
  }
);

export const deleteFood = createAsyncThunk(
  'inventory/deleteFood',
  async (id: string, { getState }: { getState: () => unknown }) => {
    const state = getState() as any;
    const { ownerType, householdId } = state.inventory.context;
    await deleteFoodApi(id, ownerType, householdId);
    return id;
  }
);

export const consumeFood = createAsyncThunk(
  'inventory/consumeFood',
  async (id: string, { getState }: { getState: () => unknown }) => {
    const state = getState() as any;
    const { ownerType, householdId } = state.inventory.context;
    await consumeFoodApi(id, ownerType, householdId);
    return id;
  }
);

// ─── State ────────────────────────────────────────────────────────────────────
type InventoryState = {
  items: FoodItem[];
  summary: FoodSummary;
  activeFilter: InventoryFilter;
  context: {
    ownerType: 'USER' | 'HOUSEHOLD';
    householdId?: string;
  };
  loading: boolean;
  error: string | null;
  foodsRequest: string | null;
  summaryRequest: string | null;
  contextRevision: number;
  mutations: Record<string, number>;
};

const initialState: InventoryState = {
  items: [],
  summary: { total: 0, safe: 0, nearExpiry: 0, expired: 0, needCheck: 0 },
  activeFilter: 'all',
  context: { ownerType: 'USER' },
  loading: false,
  error: null,
  foodsRequest: null,
  summaryRequest: null,
  contextRevision: 0,
  mutations: {},
};

function invalidateReads(state: InventoryState) {
  state.foodsRequest = null; state.summaryRequest = null; state.loading = false;
}

function clearInventory(state: InventoryState) {
  invalidateReads(state);
  state.items = [];
  state.summary = { total: 0, safe: 0, nearExpiry: 0, expired: 0, needCheck: 0 };
}

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
    setActiveFilter: (state: InventoryState, action: PayloadAction<InventoryFilter>) => {
      if (state.activeFilter !== action.payload) { state.foodsRequest = null; state.loading = false; state.items = []; }
      state.activeFilter = action.payload;
    },
    invalidateInventoryAccess: (state: InventoryState, action: PayloadAction<string>) => {
      clearInventory(state); state.error = action.payload;
    },
    setInventoryContext: (state: InventoryState, action: PayloadAction<{ ownerType: 'USER' | 'HOUSEHOLD', householdId?: string }>) => {
      if (
        state.context.ownerType !== action.payload.ownerType ||
        state.context.householdId !== action.payload.householdId
      ) {
        clearInventory(state); state.contextRevision++; state.mutations = {}; state.error = null;
      }
      state.context = action.payload;
    },
    addFoodItem: (state: InventoryState, action: PayloadAction<FoodItem>) => {
      invalidateReads(state);
      state.items.unshift(action.payload);
      state.summary.total += 1;
      updateSummaryByStatus(state.summary, action.payload.status, 1);
    },
    updateFoodItem: (state: InventoryState, action: PayloadAction<FoodItem>) => {
      invalidateReads(state);
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
  extraReducers: (builder: ActionReducerMapBuilder<InventoryState>) => {
    builder
      // fetchFoods
      .addCase(fetchFoods.pending, (state: InventoryState, action: AsyncAction<undefined>) => { state.loading = true; state.error = null; state.foodsRequest = action.meta.requestId; })
      .addCase(fetchFoods.fulfilled, (state: InventoryState, action: AsyncAction<FoodItem[]>) => {
        if (state.foodsRequest !== action.meta.requestId) return;
        state.foodsRequest = null;
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFoods.rejected, (state: InventoryState, action: ReadRejection) => {
        if (state.foodsRequest !== action.meta.requestId) return;
        state.foodsRequest = null;
        state.loading = false;
        if (action.meta.aborted) return;
        if ([401, 403].includes(action.payload?.status ?? 0)) clearInventory(state);
        state.error = action.payload?.message ?? action.error.message ?? 'Failed to load foods';
      })
      // fetchSummary
      .addCase(fetchSummary.pending, (state: InventoryState, action: AsyncAction<undefined>) => { state.summaryRequest = action.meta.requestId; })
      .addCase(fetchSummary.fulfilled, (state: InventoryState, action: AsyncAction<FoodSummary>) => {
        if (state.summaryRequest !== action.meta.requestId) return;
        state.summaryRequest = null;
        state.summary = action.payload;
      })
      .addCase(fetchSummary.rejected, (state: InventoryState, action: ReadRejection) => {
        if (state.summaryRequest !== action.meta.requestId) return;
        state.summaryRequest = null;
        if (action.meta.aborted) return;
        if ([401, 403].includes(action.payload?.status ?? 0)) clearInventory(state);
        state.error = action.payload?.message ?? action.error.message ?? 'Failed to load summary';
      })
      // deleteFood
      .addCase(deleteFood.pending, (state: InventoryState, action: AsyncAction<undefined>) => { invalidateReads(state); state.mutations[action.meta.requestId] = state.contextRevision; })
      .addCase(deleteFood.fulfilled, (state: InventoryState, action: AsyncAction<string>) => {
        const revision = state.mutations[action.meta.requestId]; delete state.mutations[action.meta.requestId];
        if (revision !== state.contextRevision) return;
        invalidateReads(state);
        const removed = state.items.find((i) => i._id === action.payload);
        if (removed) {
          state.summary.total = Math.max(0, state.summary.total - 1);
          updateSummaryByStatus(state.summary, removed.status, -1);
        }
        state.items = state.items.filter((i) => i._id !== action.payload);
      })
      .addCase(deleteFood.rejected, (state: InventoryState, action: AsyncAction<unknown>) => { delete state.mutations[action.meta.requestId]; })
      // consumeFood
      .addCase(consumeFood.pending, (state: InventoryState, action: AsyncAction<undefined>) => { invalidateReads(state); state.mutations[action.meta.requestId] = state.contextRevision; })
      .addCase(consumeFood.fulfilled, (state: InventoryState, action: AsyncAction<string>) => {
        const revision = state.mutations[action.meta.requestId]; delete state.mutations[action.meta.requestId];
        if (revision !== state.contextRevision) return;
        invalidateReads(state);
        const consumed = state.items.find((i) => i._id === action.payload);
        if (consumed) {
          state.summary.total = Math.max(0, state.summary.total - 1);
          updateSummaryByStatus(state.summary, consumed.status, -1);
        }
        state.items = state.items.filter((i) => i._id !== action.payload);
      })
      .addCase(consumeFood.rejected, (state: InventoryState, action: AsyncAction<unknown>) => { delete state.mutations[action.meta.requestId]; });
  },
});

export const { setActiveFilter, setInventoryContext, addFoodItem, updateFoodItem, invalidateInventoryAccess } = inventorySlice.actions;
export default inventorySlice.reducer;
