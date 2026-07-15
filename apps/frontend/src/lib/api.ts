const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  success: false;
  message: string;
  statusCode: number;
  errors?: unknown;
};

export async function apiGet<T>(path: string): Promise<ApiSuccess<T>> {
  const res = await fetch(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const body = (await res.json()) as ApiSuccess<T> | ApiError;
  if (!res.ok || body.success === false) {
    const message =
      "message" in body ? body.message : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

export { API_URL };
