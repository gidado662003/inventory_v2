import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiEnvelope, ApiError } from "./envelope";
import { ACCESS_TOKEN_COOKIE } from "./cookies";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/`;

type ServerFetchOptions = Omit<RequestInit, "body"> & {
  // Passed straight through to fetch's `next` option: { revalidate, tags }
  next?: NextFetchRequestConfig;
  params?: Record<string, string | number | boolean | undefined>;
};

function buildUrl(path: string, params?: ServerFetchOptions["params"]): string {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

// GET-only wrapper — server.ts files never mutate (see client.ts for that).
export async function serverGet<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const { params, headers, next, ...rest } = options;

  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  const res = await fetch(buildUrl(path, params), {
    ...rest,
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    next, // { revalidate: 60 } or { tags: ['users'] } — opt in per call
  });

  if (res.status === 401) {
    // proxy.ts should have kept the token fresh before render.
    // Landing here means it didn't catch it in time.
    redirect("/login");
  }

  const envelope = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || !envelope.success) {
    throw new ApiError(envelope.message ?? "Request failed", res.status);
  }

  return envelope.response;
}
