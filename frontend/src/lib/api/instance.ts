import { API_BASE_URL, USE_MOCKS } from "@/lib/env";
import { mockFetch } from "@/lib/mocks";
import { createApiClient, type ApiClientOptions } from "./client";

/**
 * The one API client the app uses. Switching between the real backend and the built-in mock data is a
 * single environment variable: NEXT_PUBLIC_USE_MOCKS=true|false. Streaming (`streamCheck`) takes the same
 * options object, so it follows the switch too.
 */
export const apiOptions: ApiClientOptions = {
  baseUrl: API_BASE_URL,
  ...(USE_MOCKS ? { fetchImpl: mockFetch } : {}),
};

export const api = createApiClient(apiOptions);
