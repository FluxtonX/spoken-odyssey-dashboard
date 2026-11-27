import { useEffect, useState } from "react";
import { prettyType } from "../../lib/formatters.js";
import { readJson } from "../../services/adminApi.js";

const actionLabel = (action) => prettyType(String(action || "").replace(/^ADMIN_/, "").toLowerCase());
const activityOptions = [
  ["all", "All actions"],
  ["user_restriction", "Account access changes"],
  ["content_removed", "Content removed"],
  ["content_restored", "Content restored"],
  ["content_viewed", "Public content reviewed"],
  ["family_invitation", "Family invitations revoked"],
];

function initialFilters() {
  if (typeof window === "undefined") return { action: "all", from: "", to: "", search: "" };
  const params = new URLSearchParams(window.location.search);
  return { action: params.get("action") || "all", from: params.get("from") || "", to: params.get("to") || "", search: params.get("logQ") || "" };
}

function writeActivityFilters(filters) {
  const params = new URLSearchParams(window.location.search);
  for (const key of ["action", "from", "to", "logQ"]) params.delete(key);
  if (filters.action !== "all") params.set("action", filters.action);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.search.trim()) params.set("logQ", filters.search.trim());
  const query = params.toString();
  window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
}

export default function AdminActivity({ refreshSignal = 0 }) {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setFilters({ action: params.get("action") || "all", from: params.get("from") || "", to: params.get("to") || "", search: params.get("logQ") || "" });
      setPage(1);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    writeActivityFilters(filters);
  }, [filters]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ page: String(page), limit: "25", action: filters.action });
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.search.trim()) params.set("search", filters.search.trim());
      setLoading(true);
      readJson(`/api/admin/activity?${params}`)
        .then((result) => {
          if (!active) return;
          setEntries(result.data || []);
          setTotalPages(result.pagination?.totalPages || 1);
          setTotalEntries(result.pagination?.total || 0);
          setError("");
        })
        .catch((err) => { if (active) setError(err.message); })
        .finally(() => { if (active) setLoading(false); });
    }, 160);
    return () => { active = false; clearTimeout(timer); };
  }, [page, filters, refreshSignal]);

  function updateFilters(changes) {
    setFilters((current) => ({ ...current, ...changes }));
    setPage(1);
  }

  return <>
    <div className="page-heading directory-page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>Admin activity</h1><p>Search and filter audited account, content, and family actions.</p></div><span className="directory-total">{loading ? "Updating…" : `${totalEntries.toLocaleString()} matching actions`}</span></div>
    {error && <div className="notice-error" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
    <section className="panel table-panel">
      <div className="panel-heading directory-heading activity-filter-heading">
        <div><p className="eyebrow">AUDIT HISTORY</p><h2>Recent actions</h2><p className="panel-subtitle">Records include the administrator, reason, timestamp, and request IP.</p></div>
        <div className="activity-filters">
          <label><span>Action</span><select value={filters.action} onChange={(event) => updateFilters({ action: event.target.value })}>{activityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>From</span><input type="date" value={filters.from} onChange={(event) => updateFilters({ from: event.target.value })} /></label>
          <label><span>To</span><input type="date" value={filters.to} onChange={(event) => updateFilters({ to: event.target.value })} /></label>
          <label className="activity-search"><span>Search admin, user, post, or reason</span><input type="search" value={filters.search} onChange={(event) => updateFilters({ search: event.target.value })} placeholder="Search audit history" /></label>
        </div>
      </div>
      {loading ? <div className="table-message">Loading activity…</div> : entries.length === 0 ? <div className="table-message">No actions match these filters.</div> : <div className="table-scroll"><table><thead><tr><th>ACTION</th><th>ADMIN</th><th>RECORD</th><th>REASON</th><th>DATE AND TIME</th><th>IP ADDRESS</th></tr></thead><tbody>{entries.map((entry) => { const meta = entry.metadata || {}; const record = meta.targetEmail || meta.title || meta.email || meta.invitationId || meta.memoryId || meta.targetUserId || meta.familyCircleId || "—"; return <tr key={entry.id}><td><span className="status-tag">{actionLabel(entry.action)}</span></td><td>{meta.adminEmail || "Administrator"}</td><td className="activity-record">{record}</td><td className="activity-reason">{meta.reason || "—"}</td><td>{new Date(entry.createdAt).toLocaleString()}</td><td>{entry.ipAddress || "—"}</td></tr>; })}</tbody></table></div>}
      {!loading && totalPages > 1 && <div className="pagination"><span>Page {page} of {totalPages}</span><div><button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button></div></div>}
    </section>
  </>;
}
