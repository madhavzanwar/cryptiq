import { apiOptions } from "@/lib/api/instance";
import { buildUrl } from "@/lib/api/client";

/** `audioUrl` from the API is a path (`/api/audio/x.mp3`) on the backend origin: this resolves it for the browser. */
export function buildApiUrl(path: string): string {
  return buildUrl(apiOptions.baseUrl, path);
}
