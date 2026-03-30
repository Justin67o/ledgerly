export async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    credentials: "include", // important for auth
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}