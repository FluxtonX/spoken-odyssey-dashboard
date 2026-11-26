import { useEffect, useState } from "react";
import { dateLabel, prettyType } from "../../lib/formatters.js";
import { readJson } from "../../services/adminApi.js";

const actionLabel = (action) => prettyType(String(action || "").replace(/^ADMIN_/, "").toLowerCase());

export default function AdminActivity({ refreshSignal = 0 }) {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    readJson(`/api/admin/activity?page=${page}&limit=25`)
      .then((result) => {
        if (!active) return;
        setEntries(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setError("");
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, refreshSignal]);

  return <>
    <div className="page-heading directory-page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>Admin activity</h1><p>Review account, content, and family-management actions taken in this workspace.</p></div></div>
    {error && <div className="notice-error">{error}<button onClick={() => setError("")}>×</button></div>}
    <section className="panel table-panel"><div className="panel-heading directory-heading"><div><p className="eyebrow">AUDIT HISTORY</p><h2>Recent actions</h2><p className="panel-subtitle">Action, administrator, reason, and timestamp are recorded together with each change.</p></div></div>
      {loading ? <div className="table-message">Loading activity…</div> : entries.length === 0 ? <div className="table-message">No admin actions have been recorded yet.</div> : <div className="table-scroll"><table><thead><tr><th>ACTION</th><th>ADMIN</th><th>RECORD</th><th>REASON</th><th>DATE</th><th>IP ADDRESS</th></tr></thead><tbody>{entries.map((entry) => { const meta = entry.metadata || {}; const record = meta.targetEmail || meta.title || meta.email || meta.invitationId || meta.memoryId || meta.targetUserId || meta.familyCircleId || "—"; return <tr key={entry.id}><td><span className="status-tag">{actionLabel(entry.action)}</span></td><td>{meta.adminEmail || "Administrator"}</td><td className="activity-record">{record}</td><td className="activity-reason">{meta.reason || "—"}</td><td>{dateLabel(entry.createdAt)}</td><td>{entry.ipAddress || "—"}</td></tr>; })}</tbody></table></div>}
      {!loading && totalPages > 1 && <div className="pagination"><span>Page {page} of {totalPages}</span><div><button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button></div></div>}
    </section>
  </>;
}
