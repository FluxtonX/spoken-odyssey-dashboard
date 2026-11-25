import { formatNumber } from "../../lib/formatters.js";

export default function GrowthChart({ rows = [], period = "12m" }) {
  const max = Math.max(1, ...rows.map((row) => row.users));
  return <div className={`chart-wrap ${period === "30d" ? "daily-chart" : ""}`}><div className="chart-y-labels"><span>{formatNumber(max)}</span><span>{formatNumber(Math.round(max / 2))}</span><span>0</span></div><div className="chart-bars">{rows.map((row, index) => { const date = new Date(`${row.bucket}${period === "12m" ? "-01" : ""}T00:00:00`); const showLabel = period === "12m" || index % 5 === 0 || index === rows.length - 1; const label = period === "12m" ? date.toLocaleDateString(undefined, { month: "short" }) : date.toLocaleDateString(undefined, { month: "numeric", day: "numeric" }); return <div className="chart-column" key={row.bucket} title={`${row.bucket}: ${row.users} new users, ${row.families} families`}><div className="chart-bar-track"><span className="chart-bar" style={{ height: `${Math.max(3, (row.users / max) * 100)}%` }} /></div><small>{showLabel ? label : ""}</small></div>; })}</div></div>;
}
