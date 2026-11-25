import { useEffect, useState } from "react";
import PostTypeBreakdown from "../shared/PostTypeBreakdown.jsx";
import { readJson } from "../../services/adminApi.js";
import { dateLabel, formatNumber, postCategoryIcon, prettyType } from "../../lib/formatters.js";

export default function DetailsModal({ target, onClose }) {
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
