import { useCallback, useEffect, useState } from "react";
import { readJson } from "../services/adminApi.js";

export function useAdminDashboard() {
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

  return {
    admin, overview, view, setView, period, setPeriod, rows,
    directoryPage, setDirectoryPage, directoryPages, search, setSearch,
    sort, setSort, familyFilter, setFamilyFilter, detailsTarget,
    setDetailsTarget, loadingSession, loadingData, refreshing, error,
    setError, loadOverview, loadDirectory, afterLogin, refreshCurrentView, logout,
  };
}
