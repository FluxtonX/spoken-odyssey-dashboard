import { formatNumber } from "../../lib/formatters.js";

export default function MetricCard({ label, value, note, icon, tone = "blue" }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><p>{label}</p><strong>{formatNumber(value)}</strong><span>{note}</span></article>;
}
