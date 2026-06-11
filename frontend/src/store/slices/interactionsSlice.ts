import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api, extractErrorMessage } from "@/lib/api";
import type { Interaction, InteractionType, Page } from "@/types";
import type { InteractionInput } from "@/lib/validation";

export interface InteractionFilters {
  customerId: string;
  type: InteractionType | "";
  page: number;
  pageSize: number;
}

interface InteractionsState {
  page: Page<Interaction> | null;
  selected: Interaction | null;
  filters: InteractionFilters;
  loading: boolean;
  mutating: boolean;
  generatingInsight: boolean;
  error: string | null;
}

const initialState: InteractionsState = {
  page: null,
  selected: null,
  filters: { customerId: "", type: "", page: 1, pageSize: 10 },
  loading: false,
  mutating: false,
  generatingInsight: false,
  error: null,
};

function toQuery(filters: InteractionFilters): string {
  const params = new URLSearchParams({
    page: String(filters.page),
    page_size: String(filters.pageSize),
  });
  if (filters.customerId) params.set("customer_id", filters.customerId);
  if (filters.type) params.set("type", filters.type);
  return params.toString();
}

export const fetchInteractions = createAsyncThunk<
  Page<Interaction>,
  InteractionFilters,
  { rejectValue: string }
>("interactions/fetch", async (filters, { rejectWithValue }) => {
  try {
    const { data } = await api.get<Page<Interaction>>(`/interactions?${toQuery(filters)}`);
    return data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const fetchInteraction = createAsyncThunk<Interaction, string, { rejectValue: string }>(
  "interactions/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get<Interaction>(`/interactions/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

export const createInteraction = createAsyncThunk<Interaction, InteractionInput, { rejectValue: string }>(
  "interactions/create",
  async (input, { rejectWithValue }) => {
    try {
      const { data } = await api.post<Interaction>("/interactions", {
        ...input,
        occurred_at: new Date(input.occurred_at).toISOString(),
      });
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

export const updateInteraction = createAsyncThunk<
  Interaction,
  { id: string; input: Omit<InteractionInput, "customer_id"> },
  { rejectValue: string }
>("interactions/update", async ({ id, input }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch<Interaction>(`/interactions/${id}`, {
      ...input,
      occurred_at: new Date(input.occurred_at).toISOString(),
    });
    return data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const generateInsight = createAsyncThunk<Interaction, string, { rejectValue: string }>(
  "interactions/generateInsight",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.post<Interaction>(`/interactions/${id}/insight`);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

const interactionsSlice = createSlice({
  name: "interactions",
  initialState,
  reducers: {
    setInteractionFilters(state, action: PayloadAction<Partial<InteractionFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearInteractionError(state) {
      state.error = null;
    },
    clearSelectedInteraction(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.page = action.payload;
        state.loading = false;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load interactions";
      })
      .addCase(fetchInteraction.pending, (state) => {
        state.loading = true;
        state.selected = null;
        state.error = null;
      })
      .addCase(fetchInteraction.fulfilled, (state, action) => {
        state.selected = action.payload;
        state.loading = false;
      })
      .addCase(fetchInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load interaction";
      })
      .addCase(generateInsight.pending, (state) => {
        state.generatingInsight = true;
        state.error = null;
      })
      .addCase(generateInsight.fulfilled, (state, action) => {
        state.generatingInsight = false;
        state.selected = action.payload;
      })
      .addCase(generateInsight.rejected, (state, action) => {
        state.generatingInsight = false;
        state.error = action.payload ?? "Insight generation failed";
      });

    for (const thunk of [createInteraction, updateInteraction]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.mutating = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.mutating = false;
          state.selected = action.payload;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.mutating = false;
          state.error = action.payload ?? "Operation failed";
        });
    }
  },
});

export const { setInteractionFilters, clearInteractionError, clearSelectedInteraction } =
  interactionsSlice.actions;
export default interactionsSlice.reducer;
