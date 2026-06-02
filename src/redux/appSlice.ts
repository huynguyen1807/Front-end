import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TabKey = "home" | "scan" | "meal" | "shopping" | "menu";

interface AppState {
  activeTab: TabKey;
}

const initialState: AppState = {
  activeTab: "home",
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<TabKey>) => {
      state.activeTab = action.payload;
    },
  },
});

export const { setActiveTab } = appSlice.actions;
export default appSlice.reducer;
