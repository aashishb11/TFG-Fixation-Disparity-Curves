import type { ComputeResponse } from "../types/fdc";

type ErrorResponse = {
  detail?: string;
};

/**
 * Sends the 7 y-values to the backend and returns the curve fitting results.
 *
 * We read response as text before parsing because FastAPI error bodies
 * have a "detail" field we want to show to the user instead of a
 * generic HTTP error message.
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
