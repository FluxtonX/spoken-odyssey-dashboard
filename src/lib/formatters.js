export const formatNumber = (value) => new Intl.NumberFormat("en").format(value || 0);
export const prettyType = (type) => String(type || "Other").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export const dateLabel = (date) => date ? new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

export function postCategoryIcon(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("photo") || value.includes("image")) return "▧";
  if (value.includes("voice") || value.includes("audio")) return "♫";
  if (value.includes("video")) return "▶";
  return "▤";
}
