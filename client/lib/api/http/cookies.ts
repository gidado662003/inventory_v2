export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

const isProduction = process.env.NODE_ENV === "production";

export function setAccessTokenCookie(token: string) {
  if (typeof document === "undefined") return;

  document.cookie = [
    `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `SameSite=${isProduction ? "Lax" : "Lax"}`,
    ...(isProduction ? ["Secure"] : []),
  ].join("; ");
}

export function getAccessTokenCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ACCESS_TOKEN_COOKIE}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : undefined;
}

export function clearAccessTokenCookie() {
  if (typeof document === "undefined") return;

  document.cookie = [
    `${ACCESS_TOKEN_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "SameSite=Lax",
    ...(isProduction ? ["Secure"] : []),
  ].join("; ");
}
