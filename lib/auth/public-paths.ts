export const PUBLIC_AUTH_PATHS = ["/login", "/privacy", "/terms"] as const;

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
