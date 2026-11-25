import DirectoryTable from "./DirectoryTable.jsx";
import { formatNumber } from "../../lib/formatters.js";

export default function CommunityDirectory({
  view, overview, rows, search, setSearch, loadingData, directoryPage,
  directoryPages, setDirectoryPage, sort, setSort, familyFilter,
  setFamilyFilter, setDetailsTarget,
}) {
  return (
    <>
      {(view === "users" || view === "families") && <><div className="page-heading directory-page-heading"><div><p className="eyebrow">COMMUNITY MANAGEMENT</p><h1>{view === "users" ? "Users" : "Families"}</h1><p>{view === "users" ? "Browse accounts, family memberships, and each user’s post activity." : "Explore family circles and the memories shared in each space."}</p></div><span className="directory-total">{formatNumber(view === "users" ? overview?.users?.total : overview?.families?.total)} total</span></div><DirectoryTable view={view} rows={rows} search={search} onSearch={(value) => { setSearch(value); setDirectoryPage(1); }} loading={loadingData} page={directoryPage} totalPages={directoryPages} onPage={setDirectoryPage} sort={sort} onSort={(value) => { setSort(value); setDirectoryPage(1); }} familyFilter={familyFilter} onFamilyFilter={(value) => { setFamilyFilter(value); setDirectoryPage(1); }} onOpenDetails={(id) => setDetailsTarget({ type: view, id })}/></>}
    </>
  );
}
