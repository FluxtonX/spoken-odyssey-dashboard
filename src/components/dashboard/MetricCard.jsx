import { formatNumber } from "../../lib/formatters.js";

export default function MetricCard({ label, value, note, icon, tone = "blue", onClick }) {
  return onClick
    ? <button type="button" className="metric-card metric-card-button" onClick={onClick} aria-label={`${label}: ${formatNumber(value)}. ${note}`}>
        <strong>{formatNumber(value)}</strong><span className="metric-label">{label}</span><span className={`metric-icon ${tone}`} aria-hidden="true">{icon}</span><span className="metric-note">{note}</span>
      </button>
    : <article className="metric-card"><div className={`metric-icon ${tone}`} aria-hidden="true">{icon}</div><p>{label}</p><strong>{formatNumber(value)}</strong><span>{note}</span></article>;
}
