import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeFits } from "./fdc";

type FetchArgs = Parameters<typeof fetch>;

function mockFetchResponse(
  body: string,
  init: { status?: number; ok?: boolean } = {},
): Response {
  const status = init.status ?? 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

describe("computeFits", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("POSTs the y-vector to /v1/compute with JSON content-type", async () => {
    const payload = {
      x: [],
      measured: [],
      models: {},
      classification: { best_by_sse: "T1", best_by_rmse: "T1" },
    };
    const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
    mock.mockResolvedValueOnce(mockFetchResponse(JSON.stringify(payload)));

    const result = await computeFits([1, 2, 3, 4, 5, 6, 7]);

    expect(result).toEqual(payload);
    expect(mock).toHaveBeenCalledOnce();

    const [url, init] = mock.mock.calls[0] as FetchArgs;
    expect(url).toBe("/v1/compute");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(init?.body).toBe(JSON.stringify({ y: [1, 2, 3, 4, 5, 6, 7] }));
  });

  it("surfaces the backend `detail` message from JSON error bodies", async () => {
    const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
    mock.mockResolvedValueOnce(
      mockFetchResponse(JSON.stringify({ detail: "Bad input" }), {
        status: 400,
        ok: false,
      }),
    );

    await expect(computeFits([1, 2, 3, 4, 5, 6, 7])).rejects.toThrow(
      "Bad input",
    );
  });

  it("falls back to the raw response text when the error body is not JSON", async () => {
    const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
    mock.mockResolvedValueOnce(
      mockFetchResponse("Internal Server Error", {
        status: 500,
        ok: false,
      }),
    );

    await expect(computeFits([1, 2, 3, 4, 5, 6, 7])).rejects.toThrow(
      "Internal Server Error",
    );
  });

  it("falls back to an HTTP status message when the error body is empty", async () => {
    const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
    mock.mockResolvedValueOnce(
      mockFetchResponse("", { status: 503, ok: false }),
    );

    await expect(computeFits([1, 2, 3, 4, 5, 6, 7])).rejects.toThrow(
      "HTTP 503",
    );
  });
});
