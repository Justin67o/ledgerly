export async function apiFetch(url: string, options?: RequestInit) {
  const { headers: optHeaders, ...restOptions } = options ?? {};
  const res = await fetch(url, {
    credentials: "include", // important for auth
    headers: {
      "Content-Type": "application/json",
      "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...(optHeaders as Record<string, string>),
    },
    ...restOptions,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}