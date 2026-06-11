import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, extractErrorMessage } from "@/lib/api";
import type { User, UserRole } from "@/types";

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

interface UsersState {
  users: User[];
  loading: boolean;
  mutating: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  mutating: false,
  error: null,
};

export const fetchUsers = createAsyncThunk<User[], void, { rejectValue: string }>(
  "users/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<User[]>("/users");
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

export const createUser = createAsyncThunk<User, CreateUserInput, { rejectValue: string }>(
  "users/create",
  async (input, { rejectWithValue }) => {
    try {
      const { data } = await api.post<User>("/users", input);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

export const updateUserRole = createAsyncThunk<
  User,
  { userId: string; role: UserRole },
  { rejectValue: string }
>(
  "users/updateRole",
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<User>(`/users/${userId}/role`, { role });
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUsersError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load users";
      })
      .addCase(createUser.pending, (state) => {
        state.mutating = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.mutating = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.mutating = false;
        state.error = action.payload ?? "Failed to create user";
      })
      .addCase(updateUserRole.pending, (state) => {
        state.mutating = true;
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.mutating = false;
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = action.payload;
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.mutating = false;
        state.error = action.payload ?? "Failed to update role";
      });
  },
});

export const { clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;
