const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function apiUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}
