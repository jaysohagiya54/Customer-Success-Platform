import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/**
 * Returns true when the non-HttpOnly presence cookie is set, indicating the user
 * has an active session. The actual auth tokens live in HttpOnly cookies — this
 * flag only tells JS whether to attempt a /auth/me call or redirect to /login.
 */
export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith("csp_logged_in="));
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000,
  withCredentials: true,
});

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  try {
    await axios.post(`${BASE_URL}/auth/refresh`, null, { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const url = original?.url ?? "";
    // These calls manage auth state themselves — never run refresh/redirect for them.
    // /auth/me is a session probe (used by guards); letting it trigger refresh + a
    // hard window redirect causes an infinite reload loop on the login page.
    const isAuthProbe =
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/register") ||
      url.includes("/auth/me");

    if (error.response?.status === 401 && original && !original._retried && !isAuthProbe) {
      original._retried = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const ok = await refreshPromise;
      refreshPromise = null;
      if (ok) {
        return api(original);
      }
      // Refresh failed — bounce to login, but only if we're not already on an auth page
      // (otherwise the redirect reloads the page that just made the call → loop).
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/register") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d: { loc?: (string | number)[]; msg?: string }) =>
          d.loc && d.msg ? `${d.loc.slice(1).join(".")}: ${d.msg}` : (d.msg ?? ""),
        )
        .filter(Boolean)
        .join("; ");
    }
    if (!error.response) return "Network error - please check your connection";
  }
  return "Something went wrong. Please try again.";
}
