import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/authSlice";
import customersReducer from "@/store/slices/customersSlice";
import interactionsReducer from "@/store/slices/interactionsSlice";
import dashboardReducer from "@/store/slices/dashboardSlice";
import usersReducer from "@/store/slices/usersSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      customers: customersReducer,
      interactions: interactionsReducer,
      dashboard: dashboardReducer,
      users: usersReducer,
    },
  });

export const store = makeStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
