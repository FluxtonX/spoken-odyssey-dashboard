import { useCallback, useEffect, useState } from "react";
import { readJson } from "../services/adminApi.js";

const viewNames = new Set(["overview", "users", "families", "content", "activity"]);
const sortNames = new Set(["recent", "oldest", "name", "active", "members"]);

function readLocationState() {
  const params = new URLSearchParams(window.location.search);
  const page = Number.parseInt(params.get("page"), 10);
  const view = viewNames.has(params.get("view")) ? params.get("view") : "overview";
  const requestedSort = params.get("sort");
  const validSorts = view === "users" ? ["recent", "oldest", "name", "active"] : view === "families" ? ["recent", "oldest", "name", "members"] : ["recent"];
  return {
    view,
    period: params.get("period") === "30d" ? "30d" : "12m",
    search: params.get("q") || "",
    directoryPage: Number.isFinite(page) && page > 0 ? page : 1,
    sort: sortNames.has(requestedSort) && validSorts.includes(requestedSort) ? requestedSort : "recent",
    familyFilter: ["all", "joined", "none"].includes(params.get("family")) ? params.get("family") : "all",
    userActivityFilter: params.get("activity") === "active30" ? "active30" : "all",
  };
}

function writeLocationState(state, mode = "replace", clearActivityFilters = false) {
  const params = new URLSearchParams(window.location.search);
  for (const key of ["view", "period", "q", "page", "sort", "family", "activity"]) params.delete(key);
  if (clearActivityFilters) for (const key of ["action", "from", "to", "logQ"]) params.delete(key);
  params.set("view", state.view);
  if (state.period !== "12m") params.set("period", state.period);
  if ((state.view === "users" || state.view === "families") && state.search) params.set("q", state.search);
  if ((state.view === "users" || state.view === "families") && state.directoryPage > 1) params.set("page", String(state.directoryPage));
  if ((state.view === "users" || state.view === "families") && state.sort !== "recent") params.set("sort", state.sort);
  if (state.view === "users" && state.familyFilter !== "all") params.set("family", state.familyFilter);
  if (state.view === "users" && state.userActivityFilter !== "all") params.set("activity", state.userActivityFilter);
  const query = params.toString();
  const target = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history[`${mode}State`]({}, "", target);
}

export function useAdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [overview, setOverview] = useState(null);
  const [view, setViewState] = useState("overview");
  const [period, setPeriod] = useState("12m");
  const [rows, setRows] = useState([]);
  const [directoryPage, setDirectoryPage] = useState(1);
  const [directoryPages, setDirectoryPages] = useState(1);
  const [directoryTotal, setDirectoryTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [familyFilter, setFamilyFilter] = useState("all");
  const [userActivityFilter, setUserActivityFilter] = useState("all");
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [urlHydrated, setUrlHydrated] = useState(false);
  const [serviceStatus, setServiceStatus] = useState("checking");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const loadOverview = useCallback(async (selectedPeriod = "12m") => {
    try {
      const result = await readJson(`/api/admin/dashboard?period=${selectedPeriod}`);
      setOverview(result.data);
      setLastUpdatedAt(result.data?.generatedAt || new Date().toISOString());
      setError("");
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const loadDirectory = useCallback(async (currentView, query, pageNumber, selectedSort, selectedFamilyFilter, selectedActivityFilter = "all") => {
    if (currentView !== "users" && currentView !== "families") return;
    setLoadingData(true);
    try {
      const endpoint = currentView === "users" ? "users" : "families";
      const params = new URLSearchParams({ page: String(pageNumber), limit: "25", search: query, sort: selectedSort });
      if (currentView === "users") {
        params.set("family", selectedFamilyFilter);
        params.set("activity", selectedActivityFilter);
      }
      const result = await readJson(`/api/admin/${endpoint}?${params}`);
      setRows(result.data || []);
      setDirectoryPages(result.pagination?.totalPages || 1);
      setDirectoryTotal(result.pagination?.total || 0);
      setLastUpdatedAt(new Date().toISOString());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally { setLoadingData(false); }
  }, []);

  const applyLocationState = useCallback(() => {
    const state = readLocationState();
    setViewState(state.view);
    setPeriod(state.period);
    setSearch(state.search);
    setDirectoryPage(state.directoryPage);
    setSort(state.sort);
    setFamilyFilter(state.familyFilter);
    setUserActivityFilter(state.userActivityFilter);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      applyLocationState();
      setUrlHydrated(true);
    });
    const onPopState = () => applyLocationState();
    window.addEventListener("popstate", onPopState);
    return () => { active = false; window.removeEventListener("popstate", onPopState); };
  }, [applyLocationState]);

  useEffect(() => {
    if (!urlHydrated) return;
    writeLocationState({ view, period, search, directoryPage, sort, familyFilter, userActivityFilter });
  }, [urlHydrated, view, period, search, directoryPage, sort, familyFilter, userActivityFilter]);

  useEffect(() => {
    const onApiStatus = (event) => {
      setServiceStatus(event.detail?.ok ? "connected" : "error");
      if (event.detail?.ok) setLastUpdatedAt(new Date(event.detail.at || Date.now()).toISOString());
    };
    window.addEventListener("admin-api-status", onApiStatus);
    return () => window.removeEventListener("admin-api-status", onApiStatus);
  }, []);

  const navigate = useCallback((nextView, options = {}) => {
    if (!viewNames.has(nextView)) return;
    const sameView = nextView === view;
    const next = {
      view: nextView,
      period,
      search: options.search ?? (sameView && (nextView === "users" || nextView === "families") ? search : ""),
      directoryPage: options.page ?? 1,
      sort: options.sort ?? (sameView && ((nextView === "users" && ["recent", "oldest", "name", "active"].includes(sort)) || (nextView === "families" && ["recent", "oldest", "name", "members"].includes(sort))) ? sort : "recent"),
      familyFilter: options.family ?? (sameView && nextView === "users" ? familyFilter : "all"),
      userActivityFilter: options.activity ?? (sameView && nextView === "users" ? userActivityFilter : "all"),
    };
    setViewState(next.view);
    setSearch(next.search);
    setDirectoryPage(next.directoryPage);
    setSort(next.sort);
    setFamilyFilter(next.familyFilter);
    setUserActivityFilter(next.userActivityFilter);
    setDetailsTarget(null);
    writeLocationState(next, "push", true);
  }, [view, period, search, sort, familyFilter, userActivityFilter]);

  useEffect(() => {
    if (!urlHydrated || !admin || (view !== "users" && view !== "families")) return undefined;
    const timer = setTimeout(() => loadDirectory(view, search, directoryPage, sort, familyFilter, userActivityFilter), 220);
    return () => clearTimeout(timer);
  }, [urlHydrated, admin, view, search, directoryPage, sort, familyFilter, userActivityFilter, loadDirectory]);

  const loadSession = useCallback(async () => {
    try {
      const result = await readJson("/api/admin/auth/me");
      setAdmin(result.data);
    } catch {
      setAdmin(null);
    } finally { setLoadingSession(false); }
  }, []);

  useEffect(() => { Promise.resolve().then(loadSession); }, [loadSession]);
  useEffect(() => {
    if (!admin || !urlHydrated) return undefined;
    let active = true;
    Promise.resolve().then(() => active ? loadOverview(period).catch(() => {}) : undefined);
    return () => { active = false; };
  }, [admin, urlHydrated, period, loadOverview]);

  async function afterLogin() {
    setError("");
    const result = await readJson("/api/admin/auth/me");
    setAdmin(result.data);
    try { await loadOverview(period); } catch {}
  }

  async function refreshCurrentView() {
    setRefreshing(true);
    try {
      if (view === "overview") {
        await loadOverview(period).catch(() => {});
      } else if (view === "content" || view === "activity") {
        await new Promise((resolve) => {
          const timeout = setTimeout(() => { window.removeEventListener("admin-api-status", onResult); resolve(); }, 12000);
          const onResult = () => { clearTimeout(timeout); window.removeEventListener("admin-api-status", onResult); resolve(); };
          window.addEventListener("admin-api-status", onResult, { once: true });
          setRefreshSignal((value) => value + 1);
        });
      } else {
        await loadDirectory(view, search, directoryPage, sort, familyFilter, userActivityFilter);
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setAdmin(null); setOverview(null); setRows([]); setViewState("overview"); setDetailsTarget(null);
    navigate("overview");
  }

  return {
    admin, overview, view, setView: navigate, period, setPeriod, rows,
    directoryPage, setDirectoryPage, directoryPages, directoryTotal, search, setSearch,
    sort, setSort, familyFilter, setFamilyFilter, userActivityFilter, setUserActivityFilter,
    detailsTarget, setDetailsTarget, loadingSession, loadingData, refreshing, error,
    setError, loadOverview, loadDirectory, afterLogin, refreshCurrentView, refreshSignal,
    serviceStatus, lastUpdatedAt, logout,
  };
}
