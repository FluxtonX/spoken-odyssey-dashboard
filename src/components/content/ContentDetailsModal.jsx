import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { dateLabel, prettyType } from "../../lib/formatters.js";
import { readJson } from "../../services/adminApi.js";

function MediaPreview({ item }) {
  const mime = String(item.mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return <Image className="review-image" src={item.url} alt={item.originalName || "Post attachment"} width={900} height={700} unoptimized />;
  if (mime.startsWith("video/")) return <video className="review-video" src={item.url} poster={item.thumbnailUrl || undefined} controls preload="metadata" />;
  if (mime.startsWith("audio/")) return <audio className="review-audio" src={item.url} controls preload="metadata" />;
  return <a className="review-file-link" href={item.url} target="_blank" rel="noreferrer">Open attachment · {item.originalName || prettyType(mime)}</a>;
}

export default function ContentDetailsModal({ id, onClose, onChanged }) {
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRecord = useCallback(async () => {
    const result = await readJson(`/api/admin/content/${encodeURIComponent(id)}`);
    setRecord(result.data);
    setError("");
  }, [id]);

  useEffect(() => {
    let active = true;
    readJson(`/api/admin/content/${encodeURIComponent(id)}`)
      .then((result) => { if (active) setRecord(result.data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === "Escape" && !action) onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [action, onClose]);

  async function refreshMedia() {
    setRefreshing(true);
    try { await fetchRecord(); } catch (err) { setError(err.message); }
    finally { setRefreshing(false); }
  }

  async function submitModeration(event) {
    event.preventDefault();
    if (!action || reason.trim().length < 3) return;
    setSaving(true);
    try {
      const result = await readJson(`/api/admin/content/${encodeURIComponent(id)}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason.trim() }),
      });
      setRecord((current) => ({ ...current, status: result.data.status }));
      setAction(null); setReason("");
      await onChanged?.();
      if (action === "remove") setError("Post removed. The author has an in-app notice and an email will be sent if email delivery is configured.");
      else setError("Post restored to its previous status.");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return <div className="modal-backdrop review-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !action) onClose(); }}>
    <section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <header className="review-header"><div><p className="eyebrow">READ-ONLY MODERATION</p><h2 id="review-title">Post review</h2></div><button className="modal-close" onClick={onClose} aria-label="Close review">×</button></header>
      {busy ? <div className="table-message">Loading post and secure media…</div> : error && !record ? <div className="table-message form-error">{error}</div> : record && <>
        {error && <div className="notice-error">{error}<button onClick={() => setError("")}>×</button></div>}
        <div className="review-privacy-note"><strong>Public post review</strong><span>Opening this public post is recorded in admin activity. Private and family posts are not available here. Media links expire after five minutes; refresh if playback expires.</span></div>
        <div className="review-post-heading"><div><span className={`status-tag ${["archived", "removed"].includes(record.status) ? "status-tag-muted" : ""}`}>{record.status === "removed" ? "Admin removed" : prettyType(record.status)}</span><span className="review-type">{prettyType(record.type)} · {prettyType(record.privacy)}</span><h3>{record.title || "Untitled post"}</h3><p>By {record.owner?.displayName || record.owner?.email || "Unknown user"} · {record.owner?.email} · {dateLabel(record.createdAt)}</p></div><button className="secondary-button" type="button" onClick={refreshMedia} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh media"}</button></div>
        <section className="review-content-block"><h4>Post text</h4><p className="review-text">{record.description || "This post has no text description."}</p>{record.tags?.length > 0 && <div className="review-tags">{record.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}</section>
        {record.isVaultLocked && <div className="review-vault-note">Time capsule content · unlock date {dateLabel(record.unlockAt)}. Attachments are shown here only for this audited admin review.</div>}
        <section className="review-content-block"><div className="review-section-heading"><div><h4>Attachments</h4><p>{record.mediaList?.length || 0} files attached</p></div></div>{record.mediaList?.length ? <div className="review-media-grid">{record.mediaList.map((item) => <article className="review-media-card" key={item.id}><MediaPreview item={item} /><div className="review-media-meta"><strong>{item.originalName || "Media file"}</strong><small>{item.mimeType || "Unknown type"}{item.fileSize ? ` · ${(item.fileSize / 1024 / 1024).toFixed(1)} MB` : ""}</small>{item.transcriptText && <details><summary>View transcript</summary><p>{item.transcriptText}</p></details>}</div></article>)}</div> : <p className="review-empty">No media attachments.</p>}</section>
        {record.storyLayers?.length > 0 && <section className="review-content-block"><h4>Family story contributions</h4><div className="review-story-list">{record.storyLayers.map((layer) => <article key={layer.id}><p>{layer.text || "Voice contribution"}</p>{layer.audioUrl && <audio src={layer.audioUrl} controls preload="metadata" />}{layer.transcriptText && <details><summary>View transcript</summary><p>{layer.transcriptText}</p></details>}<small>{layer.author?.displayName || layer.author?.email || "Family member"} · {dateLabel(layer.createdAt)}</small></article>)}</div></section>}
        <footer className="review-actions">{["archived", "removed"].includes(record.status) ? <><span>This post is hidden from users. Its media is retained for review and restoration.</span><button className="table-action" onClick={() => { setReason(""); setAction("restore"); }}>Restore post</button></> : <><span>Removal hides the post from all user views, blocks further edits and interactions, and notifies its author with your reason. The media is retained.</span><button className="table-action table-action-danger" onClick={() => { setReason(""); setAction("remove"); }}>Remove post</button></>}</footer>
      </>}
    </section>
    {action && <div className="modal-backdrop action-backdrop"><form className="admin-action-dialog" onSubmit={submitModeration}><button type="button" className="modal-close" onClick={() => { setAction(null); setReason(""); }} aria-label="Close">×</button><p className="eyebrow">{action === "remove" ? "USER NOTICE REQUIRED" : "RESTORE POST"}</p><h2>{action === "remove" ? "Remove this post?" : "Restore this post?"}</h2><p className="dialog-copy">{record?.title || "Untitled post"}. {action === "remove" ? "The author will receive this reason in an in-app notification and by email when configured." : "The post will return to its previous status."}</p><label>{action === "remove" ? "Reason shown to the author" : "Reason for audit history"}<textarea required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Use clear, respectful language" /></label><div className="dialog-actions"><button type="button" className="secondary-button" onClick={() => setAction(null)}>Cancel</button><button className="primary-button" disabled={saving || reason.trim().length < 3}>{saving ? "Saving…" : action === "remove" ? "Remove post" : "Restore post"}</button></div></form></div>}
  </div>;
}
