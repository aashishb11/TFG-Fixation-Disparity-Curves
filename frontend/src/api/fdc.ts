import type { ComputeResponse } from "../types/fdc";

type ErrorResponse = {
  detail?: string;
};

export async function computeFits(yValues: number[]): Promise<ComputeResponse> {
  const response = await fetch("/api/v1/compute", {
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
