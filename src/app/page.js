"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

async function readJson(url, options) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) throw new Error(payload.message || "The request could not be completed.");
  return payload;
}

const formatNumber = (value) => new Intl.NumberFormat("en").format(value || 0);
const prettyType = (type) => String(type || "Other").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateLabel = (date) => date ? new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

function Login({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await readJson("/api/admin/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      await onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <div className="login-art" aria-hidden="true">
        <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <div className="art-glow" /><div className="art-caption"><span className="live-dot" /> SPOKEN ODYSSEY <span>ADMINISTRATION</span></div>
      </div>
      <section className="login-panel">
        <Image className="login-brand-logo" src="/odysseyLogo.png" alt="Spoken Odyssey" width={2092} height={752} priority />
        <p className="eyebrow">ADMINISTRATION PORTAL</p>
        <h1>Welcome back</h1>
        <p className="login-subtitle">Sign in with your designated administrator email and password.</p>
        <form onSubmit={submit} className="login-form">
          <label>Email address<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button login-submit" disabled={busy}>{busy ? "Please wait…" : "Sign in securely"}<span>↗</span></button>
        </form>
        <p className="login-footnote"><span className="lock-symbol">◆</span> Restricted to the designated administrator account</p>
      </section>
    </main>
  );
}

function MetricCard({ label, value, note, icon, tone = "blue" }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><p>{label}</p><strong>{formatNumber(value)}</strong><span>{note}</span></article>;
}

function MiniChart({ rows = [], period = "12m" }) {
  const max = Math.max(1, ...rows.map((row) => row.users));
  return <div className={`chart-wrap ${period === "30d" ? "daily-chart" : ""}`}><div className="chart-y-labels"><span>{formatNumber(max)}</span><span>{formatNumber(Math.round(max / 2))}</span><span>0</span></div><div className="chart-bars">{rows.map((row, index) => { const date = new Date(`${row.bucket}${period === "12m" ? "-01" : ""}T00:00:00`); const showLabel = period === "12m" || index % 5 === 0 || index === rows.length - 1; const label = period === "12m" ? date.toLocaleDateString(undefined, { month: "short" }) : date.toLocaleDateString(undefined, { month: "numeric", day: "numeric" }); return <div className="chart-column" key={row.bucket} title={`${row.bucket}: ${row.users} new users, ${row.families} families`}><div className="chart-bar-track"><span className="chart-bar" style={{ height: `${Math.max(3, (row.users / max) * 100)}%` }} /></div><small>{showLabel ? label : ""}</small></div>; })}</div></div>;
}

function PostTypeBreakdown({ types }) {
  const names = [["image", "Images", "#8b7cff"], ["voice", "Voice", "#24b89a"], ["video", "Video", "#e2a353"], ["text", "Text", "#6998f4"], ["other", "Other", "#a6afc3"]];
  return <div className="type-breakdown">{names.map(([key, label, color]) => <div className="type-item" key={key}><span className="type-dot" style={{ background: color }} /><span>{label}</span><strong>{formatNumber(types?.[key])}</strong></div>)}</div>;
}

function Dropdown({ value, onChange, options, label, icon }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    rootRef.current?.querySelector('[aria-checked="true"]')?.focus();
    const closeOutside = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function handleMenuKeyDown(event) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(rootRef.current?.querySelectorAll('[role="menuitemradio"]') || []);
    const currentIndex = items.indexOf(document.activeElement);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : currentIndex < 0 ? (event.key === "ArrowDown" ? 0 : items.length - 1) : (currentIndex + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
    items[nextIndex]?.focus();
  }

  return <div className={`custom-dropdown ${open ? "is-open" : ""}`} ref={rootRef}>
    <button ref={triggerRef} type="button" className="dropdown-trigger" aria-label={`${label}: ${selected?.label}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      {icon && <span className="dropdown-leading" aria-hidden="true">{icon}</span>}
      <span className="dropdown-current">{selected?.label}</span>
      <svg className="dropdown-caret" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
    </button>
    {open && <div className="dropdown-menu" role="menu" aria-label={label} onKeyDown={handleMenuKeyDown}>
      <p className="dropdown-menu-label">{label}</p>
      {options.map((option) => <button key={option.value} type="button" role="menuitemradio" aria-checked={option.value === value} className={`dropdown-option ${option.value === value ? "selected" : ""}`} onClick={() => { onChange(option.value); setOpen(false); triggerRef.current?.focus(); }}>
        <span className="dropdown-option-copy"><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
        <span className="dropdown-check" aria-hidden="true">{option.value === value ? "✓" : ""}</span>
      </button>)}
    </div>}
  </div>;
}

function DataTable({ view, rows, onSearch, search, loading, page, totalPages, onPage, sort, onSort, familyFilter, onFamilyFilter, onOpenDetails }) {
  const userView = view === "users";
  const familyOptions = [{ value: "all", label: "All users", description: "Show every account" }, { value: "joined", label: "In a family", description: "Has an active family membership" }, { value: "none", label: "No family", description: "No active family membership" }];
  const sortOptions = userView ? [{ value: "recent", label: "Newest first", description: "Recently registered accounts" }, { value: "oldest", label: "Oldest first", description: "Earliest registered accounts" }, { value: "name", label: "Name A–Z", description: "Alphabetical by display name" }, { value: "active", label: "Recently active", description: "Latest account activity" }] : [{ value: "recent", label: "Newest first", description: "Recently created family spaces" }, { value: "oldest", label: "Oldest first", description: "Earliest family spaces" }, { value: "name", label: "Name A–Z", description: "Alphabetical by family name" }, { value: "members", label: "Most members", description: "Largest active family circles" }];
  return <section className="panel table-panel"><div className="panel-heading directory-heading"><div><p className="eyebrow">DIRECTORY</p><h2>{userView ? "Users" : "Family circles"}</h2><p className="panel-subtitle">{userView ? "Account activity, family membership and post mix." : "Family membership and shared post activity."}</p></div><div className="directory-tools"><div className="search-box"><span>⌕</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={userView ? "Search users" : "Search families"} /></div>{userView && <Dropdown label="Filter by family" icon="◉" value={familyFilter} onChange={onFamilyFilter} options={familyOptions}/>}<Dropdown label="Sort results" icon="⇅" value={sort} onChange={onSort} options={sortOptions}/></div></div>
    {loading ? <div className="table-message">Loading records…</div> : rows.length === 0 ? <div className="table-message">No matching records.</div> : <div className="table-scroll"><table><thead><tr>{userView ? <><th>USER</th><th>JOINED</th><th>LAST ACTIVE</th><th>FAMILIES</th><th>POSTS</th><th>POST MIX</th></> : <><th>FAMILY</th><th>CREATED</th><th>CREATOR</th><th>MEMBERS</th><th>SHARED POSTS</th><th>POST MIX</th></>}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="clickable-row">{userView ? <><td><button className="person-cell person-link" onClick={() => onOpenDetails(row.id)}><div className="avatar">{(row.displayName || row.email || "?").slice(0, 1).toUpperCase()}</div><span><strong>{row.displayName || "Unnamed user"}</strong><small>{row.email}</small></span></button></td><td>{dateLabel(row.createdAt)}</td><td>{dateLabel(row.lastActive)}</td><td><div className="family-tags">{row.familyMemberships?.length ? row.familyMemberships.map((item) => <span key={item.familyCircle.id}>{item.familyCircle.name}</span>) : <span className="muted">No family</span>}</div></td><td><strong>{formatNumber(row._count?.memories)}</strong></td><td><PostTypeBreakdown types={row.postTypes} /></td></> : <><td><button className="person-cell person-link" onClick={() => onOpenDetails(row.id)}><div className="avatar family-avatar">⌂</div><span><strong>{row.name}</strong><small>{row.description || "Family space"}</small></span></button></td><td>{dateLabel(row.createdAt)}</td><td>{row.createdBy?.displayName || row.createdBy?.email || "—"}</td><td>{formatNumber(row._count?.members)}</td><td><strong>{formatNumber(row._count?.memoryLinks)}</strong></td><td><PostTypeBreakdown types={row.postTypes} /></td></>}</tr>)}</tbody></table></div>}
    {!loading && totalPages > 1 && <div className="pagination"><span>Page {page} of {totalPages}</span><div><button disabled={page <= 1} onClick={() => onPage(page - 1)}>← Previous</button><button disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next →</button></div></div>}
  </section>;
}

function DetailsModal({ target, onClose }) {
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const isUser = target.type === "users";
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    readJson(`/api/admin/${target.type}/${encodeURIComponent(target.id)}`)
      .then((result) => { if (active) setRecord(result.data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [target.id, target.type]);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title"><button className="modal-close" onClick={onClose} aria-label="Close details">×</button>{busy ? <div className="table-message">Loading details…</div> : error ? <div className="table-message form-error">{error}</div> : record && <>
    <div className="detail-heading"><div className={`avatar detail-avatar ${isUser ? "" : "family-avatar"}`}>{isUser ? (record.displayName || record.email || "?").slice(0, 1).toUpperCase() : "⌂"}</div><div><p className="eyebrow">{isUser ? "USER PROFILE" : "FAMILY SPACE"}</p><h2 id="detail-title">{isUser ? record.displayName || "Unnamed user" : record.name}</h2><p>{isUser ? record.email : record.description || "Family circle"}</p></div></div>
    <div className="detail-stats"><div><span>{isUser ? "Joined" : "Created"}</span><strong>{dateLabel(record.createdAt)}</strong></div><div><span>{isUser ? "Total posts" : "Active members"}</span><strong>{formatNumber(isUser ? record._count?.memories : record._count?.members)}</strong></div><div><span>{isUser ? "Last active" : "Shared posts"}</span><strong>{isUser ? dateLabel(record.lastActive) : formatNumber(record._count?.memoryLinks)}</strong></div></div>
    <div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">POST ACTIVITY</p><h3>{isUser ? "Posts by type" : "Shared memories by type"}</h3></div></div><PostTypeBreakdown types={record.postTypes}/></div>
    {isUser ? <><div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">FAMILY MEMBERSHIPS</p><h3>{record.familyMemberships?.length || 0} active family spaces</h3></div></div>{record.familyMemberships?.length ? <div className="detail-memberships">{record.familyMemberships.map((item) => <div key={item.id}><span className="avatar family-avatar">⌂</span><span><strong>{item.familyCircle.name}</strong><small>{prettyType(item.role)} · {item.relationship} · joined {dateLabel(item.joinedAt)}</small></span></div>)}</div> : <p className="detail-empty">This user has not joined a family circle.</p>}</div><div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h3>Latest posts</h3></div></div>{record.recentPosts?.length ? <div className="detail-posts">{record.recentPosts.map((post) => <div key={post.id}><span className="post-type-icon">{postCategoryIcon(post.type)}</span><span><strong>{post.title || "Untitled post"}</strong><small>{prettyType(post.type)} · {prettyType(post.status)} · {dateLabel(post.createdAt)}</small></span></div>)}</div> : <p className="detail-empty">No posts yet.</p>}</div></> : <><div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">MEMBERS</p><h3>{record.members?.length || 0} family members</h3></div><span className="detail-meta">Created by {record.createdBy?.displayName || record.createdBy?.email || "—"}</span></div>{record.members?.length ? <div className="detail-memberships">{record.members.map((membership) => <div key={membership.id}><span className="avatar">{(membership.user.displayName || membership.user.email || "?").slice(0, 1).toUpperCase()}</span><span><strong>{membership.user.displayName || "Unnamed user"}</strong><small>{membership.user.email} · {prettyType(membership.role)} · {membership.status === "ACTIVE" ? "Joined" : membership.status.toLowerCase()} {dateLabel(membership.joinedAt)} · {formatNumber(membership.user._count?.memories)} personal posts</small></span></div>)}</div> : <p className="detail-empty">No members yet.</p>}</div><div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">FAMILY TIMELINE</p><h3>Recent shared memories</h3></div></div>{record.memoryLinks?.length ? <div className="detail-posts">{record.memoryLinks.map((link) => <div key={link.id}><span className="post-type-icon">{postCategoryIcon(link.memory.type)}</span><span><strong>{link.memory.title || "Untitled memory"}</strong><small>{prettyType(link.memory.type)} · by {link.memory.owner?.displayName || link.memory.owner?.email || "Unknown member"} · {dateLabel(link.occurredAt)}</small></span></div>)}</div> : <p className="detail-empty">No memories shared with this family yet.</p>}</div></>}
    </>}
  </section></div>;
}

function postCategoryIcon(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("photo") || value.includes("image")) return "▧";
  if (value.includes("voice") || value.includes("audio")) return "♫";
  if (value.includes("video")) return "▶";
  return "▤";
}

function AdminProfileMenu({ admin, onLogout }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return <div className="profile-menu-wrap" ref={rootRef}>
    <button ref={triggerRef} className="top-avatar profile-trigger" type="button" aria-label="Open administrator account menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      {(admin.displayName || admin.email).slice(0, 1).toUpperCase()}
    </button>
    {open && <div className="profile-popover">
      <p className="profile-popover-label">SIGNED IN AS</p>
      <strong>{admin.displayName || "Administrator"}</strong>
      <span className="profile-popover-email">{admin.email}</span>
      <span className="profile-role"><i /> Administrator</span>
      <button className="profile-logout" type="button" onClick={onLogout}>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 3.5H4.8A1.8 1.8 0 0 0 3 5.3v9.4a1.8 1.8 0 0 0 1.8 1.8H8M11.5 6.5 15 10l-3.5 3.5M15 10H7" /></svg>
        Sign out
      </button>
    </div>}
  </div>;
}

export default function Home() {
  const [admin, setAdmin] = useState(null);
  const [overview, setOverview] = useState(null);
  const [view, setView] = useState("overview");
  const [period, setPeriod] = useState("12m");
  const [rows, setRows] = useState([]);
  const [directoryPage, setDirectoryPage] = useState(1);
  const [directoryPages, setDirectoryPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [familyFilter, setFamilyFilter] = useState("all");
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async (selectedPeriod = "12m") => {
    try {
      const result = await readJson(`/api/admin/dashboard?period=${selectedPeriod}`);
      setOverview(result.data);
      setError("");
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const loadDirectory = useCallback(async (currentView, query, pageNumber, selectedSort, selectedFamilyFilter) => {
    if (currentView !== "users" && currentView !== "families") return;
    setLoadingData(true);
    try {
      const endpoint = currentView === "users" ? "users" : "families";
      const params = new URLSearchParams({ page: String(pageNumber), limit: "25", search: query, sort: selectedSort });
      if (currentView === "users") params.set("family", selectedFamilyFilter);
      const result = await readJson(`/api/admin/${endpoint}?${params}`);
      setRows(result.data || []);
      setDirectoryPages(result.pagination?.totalPages || 1);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally { setLoadingData(false); }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const result = await readJson("/api/admin/auth/me");
      setAdmin(result.data);
      try { await loadOverview("12m"); } catch {}
    } catch {
      setAdmin(null);
    } finally { setLoadingSession(false); }
  }, [loadOverview]);

  useEffect(() => { loadSession(); }, [loadSession]);
  useEffect(() => {
    if (!admin || (view !== "users" && view !== "families")) return undefined;
    const timer = setTimeout(() => loadDirectory(view, search, directoryPage, sort, familyFilter), 220);
    return () => clearTimeout(timer);
  }, [admin, view, search, directoryPage, sort, familyFilter, loadDirectory]);

  async function afterLogin() {
    setError("");
    const result = await readJson("/api/admin/auth/me");
    setAdmin(result.data);
    try { await loadOverview(period); } catch {}
  }

  async function refreshCurrentView() {
    setRefreshing(true);
    if (view === "overview") {
      try { await loadOverview(period); } catch {}
    } else {
      await loadDirectory(view, search, directoryPage, sort, familyFilter);
    }
    setRefreshing(false);
  }

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setAdmin(null); setOverview(null); setRows([]); setView("overview"); setDetailsTarget(null);
  }

  if (loadingSession) return <main className="loading-screen"><div className="spinner" />Loading secure admin session…</main>;
  if (!admin) return <Login onSuccess={afterLogin} />;

  const userGrowth = overview?.users?.inPeriod ?? 0;
  const postTypes = { image: 0, voice: 0, video: 0, text: 0, other: 0 };
  for (const item of overview?.posts?.byType || []) {
    const key = item.type?.toLowerCase().includes("photo") || item.type?.toLowerCase().includes("image") ? "image" : item.type?.toLowerCase().includes("voice") || item.type?.toLowerCase().includes("audio") ? "voice" : item.type?.toLowerCase().includes("video") ? "video" : item.type?.toLowerCase().includes("text") || item.type?.toLowerCase().includes("milestone") ? "text" : "other";
    postTypes[key] += item.count;
  }

  return <div className="admin-app">
    <aside className="sidebar"><a className="sidebar-brand" href="#overview"><span className="sidebar-logo-window"><Image className="sidebar-brand-logo" src="/odysseyLogo.png" alt="Spoken Odyssey" width={2092} height={752} priority /></span><span className="sidebar-brand-copy">ADMIN CONSOLE</span></a><div className="workspace-label">WORKSPACE</div><nav className="side-nav">{[["overview", "◫", "Overview"], ["users", "◎", "Users"], ["families", "⌂", "Families"]].map(([key, icon, label]) => <button key={key} className={view === key ? "nav-item selected" : "nav-item"} onClick={() => { setView(key); setDirectoryPage(1); setError(""); }}><span className="nav-icon">{icon}</span>{label}{view === key && <i />}</button>)}</nav><div className="sidebar-bottom"><div className="secure-note"><span>✳</span><div><strong>Private workspace</strong><small>Admin access only</small></div></div><div className="sidebar-account"><div className="account-profile"><span className="avatar admin-avatar">{(admin.displayName || admin.email).slice(0, 1).toUpperCase()}</span><span><strong>{admin.displayName || "Administrator"}</strong><small>{admin.email}</small></span></div><button className="logout-button" onClick={logout}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 3.5H4.8A1.8 1.8 0 0 0 3 5.3v9.4a1.8 1.8 0 0 0 1.8 1.8H8M11.5 6.5 15 10l-3.5 3.5M15 10H7" /></svg><span>Sign out</span></button></div></div></aside>
    <main className="main-area"><header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> <strong>{view === "overview" ? "Overview" : view === "users" ? "Users" : "Families"}</strong></div><div className="topbar-right"><button className="refresh-button" onClick={refreshCurrentView} disabled={refreshing}><span className={refreshing ? "refresh-symbol spinning" : "refresh-symbol"}>↻</span>{refreshing ? "Refreshing" : "Refresh"}</button><span className="status-pill"><i /> Live data</span><span className="top-date">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span><AdminProfileMenu admin={admin} onLogout={logout}/></div></header>
      <div className="content-area">{error && <div className="notice-error">{error}<button onClick={() => setError("")}>×</button></div>}
        {view === "overview" && <>
          <div className="page-heading"><div><p className="eyebrow">YOUR PLATFORM AT A GLANCE</p><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {admin.displayName?.split(" ")[0] || "Admin"}<span className="heading-wave">✦</span></h1><p>Here’s what’s happening across Spoken Odyssey.</p></div><Dropdown label="Reporting period" icon="◷" value={period} onChange={(value) => { setPeriod(value); loadOverview(value).catch(() => {}); }} options={[{ value: "30d", label: "Last 30 days", description: "Daily user and family growth" }, { value: "12m", label: "Last 12 months", description: "Monthly user and family growth" }]}/></div>
          {!overview && !error ? <div className="panel table-message">Loading dashboard data…</div> : <><div className="metric-grid"><MetricCard label="Total users" value={overview?.users?.total} note={`${formatNumber(overview?.users?.thisMonth)} joined this month`} icon="◎" tone="purple"/><MetricCard label="Active users" value={overview?.users?.activeLast30Days} note="Active in the last 30 days" icon="↗" tone="green"/><MetricCard label="Family circles" value={overview?.families?.total} note={`${formatNumber(overview?.families?.activeMemberships)} active members`} icon="⌂" tone="orange"/><MetricCard label="Total posts" value={overview?.posts?.total} note={`${formatNumber(overview?.families?.familyPosts)} shared with families`} icon="▤" tone="blue"/></div>
          <div className="dashboard-grid"><section className="panel growth-panel"><div className="panel-heading"><div><p className="eyebrow">AUDIENCE</p><h2>User growth</h2></div><span className="chart-legend"><i /> New users</span></div><div className="growth-stat"><strong>{formatNumber(userGrowth)}</strong><span>new accounts in the selected period</span></div><MiniChart rows={overview?.monthly || []} period={period}/></section><section className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">CONTENT</p><h2>Post breakdown</h2></div><span className="subtle-icon">◉</span></div><p className="activity-total">{formatNumber(overview?.posts?.total)}<span>total posts</span></p><PostTypeBreakdown types={postTypes}/><div className="activity-divider"/><div className="activity-foot"><span>Media assets saved</span><strong>{formatNumber(overview?.mediaAssets?.total)}</strong></div><div className="activity-foot"><span>Family shared posts</span><strong>{formatNumber(overview?.families?.familyPosts)}</strong></div></section></div>
          <div className="lower-grid"><section className="panel lower-panel"><div className="panel-heading"><div><p className="eyebrow">COMMUNITY</p><h2>Family growth</h2></div><button className="link-button" onClick={() => setView("families")}>View families ↗</button></div><div className="family-growth-list">{(overview?.monthly || []).slice(-5).map((row) => { const date = new Date(`${row.bucket}${period === "12m" ? "-01" : ""}T00:00:00`); const label = period === "12m" ? date.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : date.toLocaleDateString(undefined, { month: "short", day: "numeric" }); return <div key={row.bucket}><span>{label}</span><div className="family-track"><i style={{ width: `${Math.max(3, (row.families / Math.max(1, ...overview.monthly.map((item) => item.families))) * 100)}%` }}/></div><strong>{row.families}</strong></div>; })}</div></section><section className="panel lower-panel insight-panel"><div className="insight-symbol">✳</div><div><p className="eyebrow">PLATFORM SNAPSHOT</p><h2>Stories connect generations.</h2><p>{formatNumber(overview?.families?.activeMemberships)} people are preserving memories together in {formatNumber(overview?.families?.total)} family spaces.</p><button className="link-button" onClick={() => setView("users")}>Explore your community ↗</button></div></section></div></>}
        </>}
        {(view === "users" || view === "families") && <><div className="page-heading directory-page-heading"><div><p className="eyebrow">COMMUNITY MANAGEMENT</p><h1>{view === "users" ? "Users" : "Families"}</h1><p>{view === "users" ? "Browse accounts, family memberships, and each user’s post activity." : "Explore family circles and the memories shared in each space."}</p></div><span className="directory-total">{formatNumber(view === "users" ? overview?.users?.total : overview?.families?.total)} total</span></div><DataTable view={view} rows={rows} search={search} onSearch={(value) => { setSearch(value); setDirectoryPage(1); }} loading={loadingData} page={directoryPage} totalPages={directoryPages} onPage={setDirectoryPage} sort={sort} onSort={(value) => { setSort(value); setDirectoryPage(1); }} familyFilter={familyFilter} onFamilyFilter={(value) => { setFamilyFilter(value); setDirectoryPage(1); }} onOpenDetails={(id) => setDetailsTarget({ type: view, id })}/></>}
        <footer className="page-footer"><span>Spoken Odyssey Admin</span><span>Secure administrator workspace <i /></span></footer>
      </div>
    </main>{detailsTarget && <DetailsModal target={detailsTarget} onClose={() => setDetailsTarget(null)}/>}
  </div>;
}
