"use client";

import AdminLogin from "./auth/AdminLogin.jsx";
import AdminShell from "./layout/AdminShell.jsx";
import OverviewDashboard from "./dashboard/OverviewDashboard.jsx";
import CommunityDirectory from "./directory/CommunityDirectory.jsx";
import ContentManagement from "./content/ContentManagement.jsx";
import AdminActivity from "./activity/AdminActivity.jsx";
import { useAdminDashboard } from "../hooks/useAdminDashboard.js";

export default function AdminApp() {
  const {
    admin, overview, view, setView, period, setPeriod, rows, directoryPage,
    setDirectoryPage, directoryPages, search, setSearch, sort, setSort,
    familyFilter, setFamilyFilter, detailsTarget, setDetailsTarget,
    loadingSession, loadingData, refreshing, error, setError, loadOverview,
    afterLogin, refreshCurrentView, refreshSignal, logout, loadDirectory,
  } = useAdminDashboard();

  if (loadingSession) return <main className="loading-screen"><div className="spinner" />Loading secure admin session…</main>;
  if (!admin) return <AdminLogin onSuccess={afterLogin} />;

  return (
    <AdminShell
      admin={admin}
      view={view}
      onNavigate={(nextView) => { setView(nextView); setDirectoryPage(1); setError(""); }}
      onRefresh={refreshCurrentView}
      refreshing={refreshing}
      onLogout={logout}
      error={error}
      onDismissError={() => setError("")}
      onDataChanged={() => loadDirectory(view, search, directoryPage, sort, familyFilter)}
      refreshSignal={refreshSignal}
      detailsTarget={detailsTarget}
      onCloseDetails={() => setDetailsTarget(null)}
    >
      {view === "overview" && <OverviewDashboard view={view} overview={overview} admin={admin} period={period} setPeriod={setPeriod} loadOverview={loadOverview} setView={setView} error={error} />}
      {(view === "users" || view === "families") && <CommunityDirectory view={view} overview={overview} rows={rows} search={search} setSearch={setSearch} loadingData={loadingData} directoryPage={directoryPage} directoryPages={directoryPages} setDirectoryPage={setDirectoryPage} sort={sort} setSort={setSort} familyFilter={familyFilter} setFamilyFilter={setFamilyFilter} setDetailsTarget={setDetailsTarget} />}
      {view === "content" && <ContentManagement refreshSignal={refreshSignal} />}
      {view === "activity" && <AdminActivity refreshSignal={refreshSignal} />}
    </AdminShell>
  );
}
