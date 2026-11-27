import Image from "next/image";
import AdminProfileMenu from "./AdminProfileMenu.jsx";
import DetailsModal from "../directory/DetailsModal.jsx";

export default function AdminShell({
  admin, view, onNavigate, onRefresh, refreshing, onLogout, error,
  onDismissError, detailsTarget, onCloseDetails, children, onDataChanged, refreshSignal,
  serviceStatus = "checking", lastUpdatedAt,
}) {
  return (
    <>
      <div className="admin-app">
        <aside className="sidebar">
          <a className="sidebar-brand" href="#overview">
            <span className="sidebar-logo-window"><Image className="sidebar-brand-logo" src="/odysseyLogo.png" alt="Spoken Odyssey" width={2092} height={752} priority /></span>
            <span className="sidebar-brand-copy">ADMIN CONSOLE</span>
          </a>
          <div className="workspace-label">WORKSPACE</div>
          <nav className="side-nav">
            {[["overview", "\u25eb", "Overview"], ["users", "\u25ce", "Users"], ["families", "\u2302", "Families"]].map(([key, icon, label]) => <button key={key} className={view === key ? "nav-item selected" : "nav-item"} onClick={() => onNavigate(key)}><span className="nav-icon">{icon}</span>{label}{view === key && <i />}</button>)}
          </nav>
          <nav className="side-nav" aria-label="Management">
            {["content", "activity"].map((key) => <button key={key} className={view === key ? "nav-item selected" : "nav-item"} onClick={() => onNavigate(key)}><span className="nav-icon">{key === "content" ? "▤" : "↻"}</span>{key === "content" ? "Content" : "Admin activity"}{view === key && <i />}</button>)}
          </nav>
          <div className="sidebar-bottom">
            <div className="secure-note"><span>✳</span><div><strong>Private workspace</strong><small>Admin access only</small></div></div>
            <div className="sidebar-account">
              <div className="account-profile"><span className="avatar admin-avatar">{(admin.displayName || admin.email).slice(0, 1).toUpperCase()}</span><span><strong>{admin.displayName || "Administrator"}</strong><small>{admin.email}</small></span></div>
              <button className="logout-button" onClick={onLogout}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 3.5H4.8A1.8 1.8 0 0 0 3 5.3v9.4a1.8 1.8 0 0 0 1.8 1.8H8M11.5 6.5 15 10l-3.5 3.5M15 10H7" /></svg><span>Sign out</span></button>
            </div>
          </div>
        </aside>
        <main className="main-area">
          <header className="topbar">
            <div className="breadcrumbs">Workspace <span>/</span> <strong>{{ overview: "Overview", users: "Users", families: "Families", content: "Content", activity: "Admin activity" }[view] || "Overview"}</strong></div>
            <div className="topbar-right"><button className="refresh-button" onClick={onRefresh} disabled={refreshing}><span className={refreshing ? "refresh-symbol spinning" : "refresh-symbol"}>↻</span>{refreshing ? "Refreshing" : "Refresh"}</button><span className={`status-pill status-pill-${serviceStatus}`} title={lastUpdatedAt ? `Last successful admin API response: ${new Date(lastUpdatedAt).toLocaleString()}` : "Checking admin API"}><i />{serviceStatus === "connected" ? "API connected" : serviceStatus === "error" ? "API issue" : "Checking"}</span><span className="top-date">{lastUpdatedAt ? `Updated ${new Date(lastUpdatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : "No data yet"}</span><AdminProfileMenu admin={admin} onLogout={onLogout}/></div>
          </header>
          <div className="content-area">
            {error && <div className="notice-error">{error}<button onClick={onDismissError}>×</button></div>}
            {children}
            <footer className="page-footer"><span>Spoken Odyssey Admin</span><span>Secure administrator workspace <i /></span></footer>
          </div>
        </main>
      </div>
      {detailsTarget && <DetailsModal target={detailsTarget} onClose={onCloseDetails} onDataChanged={onDataChanged} refreshSignal={refreshSignal}/>}
    </>
  );
}
