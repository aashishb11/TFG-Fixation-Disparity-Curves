import type { ComputeResponse } from "../types/fdc";

type ErrorResponse = {
  detail?: string;
};

/**
 * Calls the backend `/api/v1/compute` endpoint with the seven measured
 * fixation-disparity y-values and returns the full fitting result.
 *
 * We read the response as text first rather than calling `.json()` directly
 * because FastAPI error bodies may be JSON *or* plain strings, and we want
 * to surface `error.detail` (FastAPI's standard error field) when available
 * instead of a generic "HTTP 422" message.
 */
export async function computeFits(yValues: number[]): Promise<ComputeResponse> {
  const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  const response = await fetch(`${base}/api/v1/compute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ y: yValues }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    let message = `HTTP ${response.status}`;

    if (responseText.trim()) {
      try {
        const errorResponse = JSON.parse(responseText) as ErrorResponse;
        if (typeof errorResponse.detail === "string" && errorResponse.detail) {
          message = errorResponse.detail;
        } else {
          message = responseText;
        }
      } catch {
        message = responseText;
      }
    }

    throw new Error(message);
  }

  return JSON.parse(responseText) as ComputeResponse;
}
