import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, extractErrorMessage } from "@/lib/api";
import type { AuthResponse, User } from "@/types";
import type { LoginInput, ProfileInput, RegisterInput } from "@/lib/validation";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;
}

const initialState: AuthState = { user: null, status: "idle", error: null };

export const login = createAsyncThunk<User, LoginInput, { rejectValue: string }>(
  "auth/login",
  async (input, { rejectWithValue }) => {
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", input);
      return data.user;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

export const register = createAsyncThunk<User, RegisterInput, { rejectValue: string }>(
  "auth/register",
  async (input, { rejectWithValue }) => {
    try {
      const { data } = await api.post<AuthResponse>("/auth/register", input);
      return data.user;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

export const fetchMe = createAsyncThunk<User, void, { rejectValue: string }>(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<User>("/auth/me");
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logoutUser",
  async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Best-effort — cookies are cleared server-side on success; continue regardless
    }
  },
);

export const updateProfile = createAsyncThunk<User, ProfileInput, { rejectValue: string }>(
  "auth/updateProfile",
  async (input, { rejectWithValue }) => {
    try {
      const payload: Record<string, string> = { full_name: input.full_name };
      if (input.password) payload.password = input.password;
      const { data } = await api.patch<User>("/auth/me", payload);
      return data;
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.status = "unauthenticated";
      state.error = null;
    },
    _resetToUnauthenticated(state) {
      state.user = null;
      state.status = "unauthenticated";
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    for (const thunk of [login, register]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.status = "loading";
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.user = action.payload;
          state.status = "authenticated";
        })
        .addCase(thunk.rejected, (state, action) => {
          state.status = "unauthenticated";
          state.error = action.payload ?? "Authentication failed";
        });
    }
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authenticated";
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.status = "unauthenticated";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = "unauthenticated";
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = action.payload ?? "Profile update failed";
      });
  },
});

export const { logout, clearAuthError, _resetToUnauthenticated } = authSlice.actions;
export default authSlice.reducer;
