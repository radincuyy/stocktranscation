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

async function parseResponse<T>(res: Response): Promise<ApiSuccess<T>> {
  const body = (await res.json()) as ApiSuccess<T> | ApiError;
  if (!res.ok || body.success === false) {
    const message =
      "message" in body ? body.message : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

function url(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiGet<T>(path: string): Promise<ApiSuccess<T>> {
  const res = await fetch(url(path), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return parseResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
): Promise<ApiSuccess<T>> {
  const res = await fetch(url(path), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
): Promise<ApiSuccess<T>> {
  const res = await fetch(url(path), {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

export async function apiDelete<T>(path: string): Promise<ApiSuccess<T>> {
  const res = await fetch(url(path), {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  return parseResponse<T>(res);
}

export { API_URL };
