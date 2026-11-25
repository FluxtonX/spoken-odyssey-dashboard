export async function readJson(url, options) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) throw new Error(payload.message || "The request could not be completed.");
  return payload;
}
