import { useEffect, useRef, useState } from "react";

export default function AdminProfileMenu({ admin, onLogout }) {
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
