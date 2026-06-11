import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api, extractErrorMessage } from "@/lib/api";
import type { Customer, CustomerStatus, Page } from "@/types";
import type { CustomerInput } from "@/lib/validation";

export interface CustomerFilters {
  search: string;
  status: CustomerStatus | "";
  page: number;
  pageSize: number;
}

interface CustomersState {
  page: Page<Customer> | null;
  selected: Customer | null;
  filters: CustomerFilters;
  loading: boolean;
  mutating: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  lastFetchedKey: string | null;
}

const initialState: CustomersState = {
  page: null,
  selected: null,
  filters: { search: "", status: "", page: 1, pageSize: 10 },
  loading: false,
  mutating: false,
  error: null,
  lastFetchedAt: null,
  lastFetchedKey: null,
};

function toQuery(filters: CustomerFilters): string {
  const params = new URLSearchParams({
    page: String(filters.page),
    page_size: String(filters.pageSize),
  });
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  return params.toString();
}

export const fetchCustomers = createAsyncThunk<Page<Customer>, CustomerFilters, { rejectValue: string }>(
  "customers/fetch",
  async (filters, { rejectWithValue }) => {
    try {
      const { data } = await api.get<Page<Customer>>(`/customers?${toQuery(filters)}`);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

export const fetchCustomer = createAsyncThunk<Customer, string, { rejectValue: string }>(
  "customers/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get<Customer>(`/customers/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

export const createCustomer = createAsyncThunk<Customer, CustomerInput, { rejectValue: string }>(
  "customers/create",
  async (input, { rejectWithValue }) => {
    try {
      const { data } = await api.post<Customer>("/customers", { ...input, phone: input.phone || null });
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

export const updateCustomer = createAsyncThunk<
  Customer,
  { id: string; input: CustomerInput },
  { rejectValue: string }
>("customers/update", async ({ id, input }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch<Customer>(`/customers/${id}`, { ...input, phone: input.phone || null });
    return data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const deleteCustomer = createAsyncThunk<string, string, { rejectValue: string }>(
  "customers/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/customers/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<CustomerFilters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCustomerError(state) {
      state.error = null;
    },
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.page = action.payload;
        state.loading = false;
        state.lastFetchedAt = Date.now();
        state.lastFetchedKey = action.meta.arg
          ? `${action.meta.arg.search}|${action.meta.arg.status}|${action.meta.arg.page}|${action.meta.arg.pageSize}`
          : null;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load customers";
      })
      .addCase(fetchCustomer.pending, (state) => {
        state.loading = true;
        state.selected = null;
        state.error = null;
      })
      .addCase(fetchCustomer.fulfilled, (state, action) => {
        state.selected = action.payload;
        state.loading = false;
      })
      .addCase(fetchCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load customer";
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.mutating = false;
        state.selected = action.payload;
      })
      .addCase(deleteCustomer.fulfilled, (state) => {
        state.mutating = false;
        state.selected = null;
      });

    for (const thunk of [createCustomer, updateCustomer, deleteCustomer]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.mutating = true;
          state.error = null;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.mutating = false;
          state.error = action.payload ?? "Operation failed";
        });
    }
    builder.addCase(createCustomer.fulfilled, (state) => {
      state.mutating = false;
    });
  },
});

export const { setFilters, clearCustomerError, clearSelected } = customersSlice.actions;
export default customersSlice.reducer;
