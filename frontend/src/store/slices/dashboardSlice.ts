import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, extractErrorMessage } from "@/lib/api";
import type { DashboardMetrics } from "@/types";

interface DashboardState {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = { metrics: null, loading: false, error: null };

export const fetchMetrics = createAsyncThunk<DashboardMetrics, void, { rejectValue: string }>(
  "dashboard/fetchMetrics",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<DashboardMetrics>("/dashboard/metrics");
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.metrics = action.payload;
        state.loading = false;
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load dashboard";
      });
  },
});

export default dashboardSlice.reducer;
