function notifyStatus(ok) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("admin-api-status", { detail: { ok, at: Date.now() } }));
}

export async function readJson(url, options) {
  try {
    const response = await fetch(url, { cache: "no-store", ...options });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) throw new Error(payload.message || "The request could not be completed.");
    notifyStatus(true);
    return payload;
  } catch (error) {
    notifyStatus(false);
    throw error;
  }
}
