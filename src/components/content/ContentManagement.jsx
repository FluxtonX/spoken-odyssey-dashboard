import { useCallback, useEffect, useState } from "react";
import { dateLabel, formatNumber, prettyType } from "../../lib/formatters.js";
import { readJson } from "../../services/adminApi.js";
import ContentDetailsModal from "./ContentDetailsModal.jsx";

export default function ContentManagement({ refreshSignal = 0 }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [privacySummary, setPrivacySummary] = useState({ publicPosts: 0, privateAndFamilyPosts: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25", search, type, status });
      const result = await readJson(`/api/admin/content?${params}`);
      setRows(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setPrivacySummary(result.summary || { publicPosts: 0, privateAndFamilyPosts: 0 });
      setError("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [page, search, status, type]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 180);
    return () => clearTimeout(timer);
  }, [load, refreshSignal]);

  return <>
    <div className="page-heading directory-page-heading">
      <div><p className="eyebrow">TRUST & SAFETY</p><h1>Content review</h1><p>Review public posts and their attachments. Removal requires a user-facing reason.</p></div>
    </div>
    <section className="content-privacy-summary" aria-label="Post privacy summary">
      <article><span>Public posts available for review</span><strong>{formatNumber(privacySummary.publicPosts)}</strong></article>
      <article><span>Private and family posts · count only</span><strong>{formatNumber(privacySummary.privateAndFamilyPosts)}</strong><small>Their titles, media, and details are not available to admins.</small></article>
    </section>
    {error && <div className="notice-error">{error}<button onClick={() => setError("")}>×</button></div>}
    <section className="panel table-panel">
      <div className="panel-heading directory-heading">
        <div><p className="eyebrow">PUBLIC POST LIBRARY</p><h2>Posts</h2><p className="panel-subtitle">Search public posts by title or owner, then open one for its text, transcripts, and media preview.</p></div>
        <div className="directory-tools">
          <div className="search-box"><span>⌕</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search title or owner" /></div>
          <select aria-label="Filter by type" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}><option value="all">All types</option>{["Text", "Image", "Photo", "Voice", "Audio", "Video"].map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">User archived</option><option value="removed">Admin removed</option></select>
        </div>
      </div>
      {loading ? <div className="table-message">Loading posts…</div> : rows.length === 0 ? <div className="table-message">No posts match these filters.</div> : <div className="table-scroll"><table><thead><tr><th>POST</th><th>TYPE</th><th>STATUS</th><th>PRIVACY</th><th>OWNER</th><th>CREATED</th><th>MEDIA</th><th>REVIEW</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>
        <td><strong>{row.title || "Untitled post"}</strong></td><td>{prettyType(row.type)}</td><td><span className={`status-tag ${["archived", "removed"].includes(row.status) ? "status-tag-muted" : ""}`}>{row.status === "removed" ? "Admin removed" : prettyType(row.status)}</span></td><td>{prettyType(row.privacy)}</td>
        <td>{row.owner?.displayName || row.owner?.email || "Unknown user"}<small className="table-subline">{row.owner?.email}</small></td><td>{dateLabel(row.createdAt)}</td><td>{row._count?.mediaAssets || 0}</td><td><button className="table-action" onClick={() => setSelectedId(row.id)}>Review post</button></td>
      </tr>)}</tbody></table></div>}
      {!loading && <div className="pagination"><span>Page {page} of {totalPages}</span><div><button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button></div></div>}
    </section>
    {selectedId && <ContentDetailsModal id={selectedId} onClose={() => setSelectedId(null)} onChanged={load} />}
  </>;
}
