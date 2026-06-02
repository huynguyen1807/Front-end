import { configureStore } from "@reduxjs/toolkit";
import inventoryReducer from "../features/inventory/redux/inventorySlice";
import appReducer from "./appSlice";

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    app: appReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;