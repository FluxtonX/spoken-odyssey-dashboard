import { useEffect, useState } from "react";
import PostTypeBreakdown from "../shared/PostTypeBreakdown.jsx";
import { readJson } from "../../services/adminApi.js";
import { dateLabel, formatNumber, postCategoryIcon, prettyType } from "../../lib/formatters.js";

const restrictionLabels = {
  NONE: "Active",
  POSTING_RESTRICTED: "Posting restricted",
  TEMPORARY_SUSPENDED: "Temporarily suspended",
  PERMANENTLY_SUSPENDED: "Permanently suspended",
};

const toLocalDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function DetailsModal({ target, onClose, onDataChanged, refreshSignal }) {
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [actionTarget, setActionTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const isUser = target.type === "users";

  useEffect(() => {
    let active = true;
    readJson(`/api/admin/${target.type}/${encodeURIComponent(target.id)}`)
      .then((result) => { if (active) setRecord(result.data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [target.id, target.type, refreshSignal]);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function submitAdminAction(event) {
    event.preventDefault();
    if (!actionTarget || reason.trim().length < 3 || !record) return;
    setSaving(true);
    try {
      const isAccountAction = actionTarget.kind === "user-status";
      const path = isAccountAction
        ? `/api/admin/users/${encodeURIComponent(record.id)}/status`
        : `/api/admin/families/${encodeURIComponent(record.id)}/invitations/${encodeURIComponent(actionTarget.id)}`;
      const body = isAccountAction
        ? { status: actionTarget.status, endsAt: actionTarget.endsAt ? new Date(actionTarget.endsAt).toISOString() : undefined, reason: reason.trim() }
        : { action: "revoke", reason: reason.trim() };
      const result = await readJson(path, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (isAccountAction) setRecord((value) => ({ ...value, ...result.data }));
      else setRecord((value) => ({ ...value, invitations: value.invitations.map((invite) => invite.id === actionTarget.id ? { ...invite, status: result.data.status } : invite) }));
      setActionTarget(null); setReason("");
      setError(result.data.firebaseAuthSynced === false ? "Access was updated, but Firebase could not sync the sign-in block. Backend access is still restricted; check the backend Firebase Admin connection." : "");
      const refreshed = await readJson(`/api/admin/${target.type}/${encodeURIComponent(record.id)}`);
      setRecord(refreshed.data);
      onDataChanged?.();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <button className="modal-close" onClick={onClose} aria-label="Close details">×</button>
      {busy ? <div className="table-message">Loading details…</div> : error && !record ? <div className="table-message form-error">{error}</div> : record && <>
        {error && <div className="notice-error">{error}<button onClick={() => setError("")}>×</button></div>}
        <div className="detail-heading"><div className={`avatar detail-avatar ${isUser ? "" : "family-avatar"}`}>{isUser ? (record.displayName || record.email || "?").slice(0, 1).toUpperCase() : "⌂"}</div><div><p className="eyebrow">{isUser ? "USER PROFILE" : "FAMILY SPACE"}</p><h2 id="detail-title">{isUser ? record.displayName || "Unnamed user" : record.name}</h2><p>{isUser ? record.email : record.description || "Family circle"}</p></div></div>
        <div className="detail-stats"><div><span>{isUser ? "Joined" : "Created"}</span><strong>{dateLabel(record.createdAt)}</strong></div><div><span>{isUser ? "Total posts" : "Active members"}</span><strong>{formatNumber(isUser ? record._count?.memories : record._count?.members)}</strong></div><div><span>{isUser ? "Last active" : "Shared posts"}</span><strong>{isUser ? dateLabel(record.lastActive) : formatNumber(record._count?.memoryLinks)}</strong></div></div>
        {isUser && <section className="access-control-card"><div><p className="eyebrow">ACCOUNT ACCESS</p><h3>{restrictionLabels[record.restrictionStatus || (record.isActive ? "NONE" : "PERMANENTLY_SUSPENDED")] || "Review access"}</h3><p>{record.adminRestrictionReason || "No admin restriction is currently applied."}{record.adminRestrictionEndsAt && record.restrictionStatus === "TEMPORARY_SUSPENDED" ? ` · Ends ${dateLabel(record.adminRestrictionEndsAt)}` : ""}</p></div><button className="table-action" onClick={() => setActionTarget({ kind: "user-status", status: record.restrictionStatus || (record.isActive ? "NONE" : "PERMANENTLY_SUSPENDED"), endsAt: toLocalDateTimeInput(record.adminRestrictionEndsAt) })}>Manage access</button></section>}
        {isUser && <div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">ACCOUNT HISTORY</p><h3>Access changes</h3></div></div>{record.restrictionHistory?.length ? <div className="admin-history-list">{record.restrictionHistory.map((entry) => { const meta = entry.metadata || {}; const previous = restrictionLabels[meta.previousStatus] || prettyType(meta.previousStatus || "Unknown"); const current = restrictionLabels[meta.status] || prettyType(meta.status || entry.action); return <article key={entry.id}><div><strong>{previous} → {current}</strong><time>{new Date(entry.createdAt).toLocaleString()}</time></div><p>{meta.reason || "No reason recorded."}</p>{meta.endsAt && <small>Suspension ends {new Date(meta.endsAt).toLocaleString()}</small>}</article>; })}</div> : <p className="detail-empty">No administrator access changes recorded.</p>}</div>}
        <div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">POST ACTIVITY</p><h3>{isUser ? "Posts by type" : "Shared memories by type"}</h3></div></div><PostTypeBreakdown types={record.postTypes}/></div>
        {isUser ? <>
          <div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">FAMILY MEMBERSHIPS</p><h3>{record.familyMemberships?.length || 0} active family spaces</h3></div></div>{record.familyMemberships?.length ? <div className="detail-memberships">{record.familyMemberships.map((item) => <div key={item.id}><span className="avatar family-avatar">⌂</span><span><strong>{item.familyCircle.name}</strong><small>{prettyType(item.role)} · {item.relationship} · joined {dateLabel(item.joinedAt)}</small></span></div>)}</div> : <p className="detail-empty">This user has not joined a family circle.</p>}</div>
          <div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h3>Latest posts</h3></div></div>{record.recentPosts?.length ? <div className="detail-posts">{record.recentPosts.map((post) => <div key={post.id}><span className="post-type-icon">{postCategoryIcon(post.type)}</span><span><strong>{post.title || "Untitled post"}</strong><small>{prettyType(post.type)} · {prettyType(post.status)} · {dateLabel(post.createdAt)}</small></span></div>)}</div> : <p className="detail-empty">No posts yet.</p>}</div>
        </> : <>
          <div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">MEMBERS</p><h3>{record.members?.length || 0} family members</h3></div><span className="detail-meta">Created by {record.createdBy?.displayName || record.createdBy?.email || "—"}</span></div>{record.members?.length ? <div className="detail-memberships">{record.members.map((membership) => <div key={membership.id}><span className="avatar">{(membership.user.displayName || membership.user.email || "?").slice(0, 1).toUpperCase()}</span><span><strong>{membership.user.displayName || "Unnamed user"}</strong><small>{membership.user.email} · {prettyType(membership.role)} · {membership.status === "ACTIVE" ? "Joined" : membership.status.toLowerCase()} {dateLabel(membership.joinedAt)} · {formatNumber(membership.user._count?.memories)} personal posts</small></span></div>)}</div> : <p className="detail-empty">No members yet.</p>}</div>
          <div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">FAMILY TIMELINE</p><h3>Recent shared memories</h3></div></div>{record.memoryLinks?.length ? <div className="detail-posts">{record.memoryLinks.map((link) => <div key={link.id}><span className="post-type-icon">{postCategoryIcon(link.memory.type)}</span><span><strong>{link.memory.title || "Untitled memory"}</strong><small>{prettyType(link.memory.type)} · by {link.memory.owner?.displayName || link.memory.owner?.email || "Unknown member"} · {dateLabel(link.occurredAt)}</small></span></div>)}</div> : <p className="detail-empty">No memories shared with this family yet.</p>}</div>
          <div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">INVITATIONS</p><h3>Recent family invitations</h3></div></div>{record.invitations?.length ? <div className="detail-invitations">{record.invitations.map((invite) => <div key={invite.id}><span><strong>{invite.email || invite.phoneNumber || "Invite link"}</strong><small>{prettyType(invite.status)} · {prettyType(invite.method)} · {dateLabel(invite.createdAt)}</small></span>{["PENDING", "ACCEPTED"].includes(invite.status) && <button className="table-action table-action-danger" onClick={() => setActionTarget({ kind: "invitation", id: invite.id, contact: invite.email || invite.phoneNumber || "Invite link" })}>Revoke</button>}</div>)}</div> : <p className="detail-empty">No invitations found.</p>}</div>
          <div className="detail-section"><div className="panel-heading"><div><p className="eyebrow">ADMIN HISTORY</p><h3>Invitation actions</h3></div></div>{record.adminHistory?.length ? <div className="admin-history-list">{record.adminHistory.map((entry) => { const meta = entry.metadata || {}; return <article key={entry.id}><div><strong>Invitation revoked</strong><time>{new Date(entry.createdAt).toLocaleString()}</time></div><p>{meta.email || "Family invitation"} · {meta.reason || "No reason recorded."}</p></article>; })}</div> : <p className="detail-empty">No administrator family actions recorded.</p>}</div>
        </>}
      </>}
    </section>
    {actionTarget && <div className="modal-backdrop action-backdrop"><form className="admin-action-dialog" onSubmit={submitAdminAction}><button type="button" className="modal-close" onClick={() => { setActionTarget(null); setReason(""); }} aria-label="Close">×</button><p className="eyebrow">{actionTarget.kind === "user-status" ? "ACCOUNT ACCESS" : "FAMILY INVITATION"}</p><h2>{actionTarget.kind === "user-status" ? "Manage account access" : "Revoke this invitation?"}</h2><p className="dialog-copy">{actionTarget.kind === "user-status" ? record?.email : actionTarget.contact}. The user will receive an in-app notice and an email when configured.</p>{actionTarget.kind === "user-status" && <><label>Access level<select value={actionTarget.status} onChange={(event) => setActionTarget((value) => ({ ...value, status: event.target.value }))}><option value="NONE">Active — full access</option><option value="POSTING_RESTRICTED">Posting restricted — can still view</option><option value="TEMPORARY_SUSPENDED">Temporary suspension</option><option value="PERMANENTLY_SUSPENDED">Permanent suspension</option></select></label>{actionTarget.status === "TEMPORARY_SUSPENDED" && <label>Suspension ends<input type="datetime-local" required value={actionTarget.endsAt || ""} onChange={(event) => setActionTarget((value) => ({ ...value, endsAt: event.target.value }))} /></label>}<p className="dialog-hint">Posting restrictions block new posts, edits, uploads, comments, and family story contributions. Suspensions block sign-in and protected API access.</p></>}<label>Reason shown to the user<textarea required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain the access change in clear language" /></label><div className="dialog-actions"><button type="button" className="secondary-button" onClick={() => { setActionTarget(null); setReason(""); }}>Cancel</button><button className="primary-button" disabled={saving || reason.trim().length < 3}>{saving ? "Saving…" : actionTarget.kind === "user-status" ? "Save access change" : "Revoke invitation"}</button></div></form></div>}
  </div>;
}
