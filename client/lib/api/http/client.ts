import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { ApiEnvelope, ApiError } from "./envelope";

import {
  getAccessTokenCookie,
  setAccessTokenCookie,
  clearAccessTokenCookie,
} from "./cookies";
import { refreshResponseSchema } from "../auth/schema";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const clientHttp = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// ---------------------------------------------------------
// Refresh state
// ---------------------------------------------------------

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      /*
       * IMPORTANT:
       *
       * We intentionally use axios directly here rather than
       * clientHttp because clientHttp has the 401 interceptor.
       *
       * Otherwise:
       *
       * 401
       *  -> refresh
       *  -> 401
       *  -> refresh
       *  -> 401
       *  -> infinite loop
       */

      const { data } = await axios.post<ApiEnvelope>(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {},
        {
          withCredentials: true,
        },
      );

      if (!data.success) {
        throw new Error(data.message ?? "Failed to refresh token");
      }

      const parsed = refreshResponseSchema.parse(data.response);

      setAccessTokenCookie(parsed.accessToken);

      return parsed.accessToken;
    } catch {
      clearAccessTokenCookie();

      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

// ---------------------------------------------------------
// Request interceptor
// ---------------------------------------------------------

clientHttp.interceptors.request.use(
  (config) => {
    const token = getAccessTokenCookie();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------
// Response interceptor
// ---------------------------------------------------------

clientHttp.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope;

    if (!envelope.success) {
      throw new ApiError(envelope.message ?? "Request failed", response.status);
    }

    /*
     * Your API format is:

     * {
     *   success: true,
     *   response: {...}
     * }
     *
     * So unwrap it here.
     */
    response.data = envelope.response;

    return response;
  },

  async (error: AxiosError<ApiEnvelope>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // -----------------------------------------------------
    // Handle 401
    // -----------------------------------------------------

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        /*
         * The request interceptor would also pick this up,
         * but explicitly setting it here makes the retry
         * deterministic.
         */
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return clientHttp(originalRequest);
      }

      /*
       * Refresh failed.
       *
       * Clear the access token and send the user to login.
       */
      clearAccessTokenCookie();

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    const message =
      error.response?.data?.message ?? error.message ?? "Something went wrong";

    return Promise.reject(new ApiError(message, error.response?.status));
  },
);
