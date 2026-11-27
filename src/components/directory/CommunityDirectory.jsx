import DirectoryTable from "./DirectoryTable.jsx";
import { formatNumber } from "../../lib/formatters.js";

export default function CommunityDirectory({
  view, directoryTotal, rows, search, setSearch, loadingData, directoryPage,
  directoryPages, setDirectoryPage, sort, setSort, familyFilter,
  setFamilyFilter, userActivityFilter, setUserActivityFilter, setDetailsTarget,
}) {
  const userView = view === "users";
  return <>
    <div className="page-heading directory-page-heading">
      <div><p className="eyebrow">COMMUNITY MANAGEMENT</p><h1>{userView ? "Users" : "Families"}</h1><p>{userView ? "Browse accounts, family memberships, and each user’s post activity." : "Explore family circles and the memories shared in each space."}</p></div>
      <span className="directory-total">{formatNumber(directoryTotal)} matching</span>
    </div>
    <DirectoryTable
      view={view} rows={rows} search={search}
      onSearch={(value) => { setSearch(value); setDirectoryPage(1); }}
      loading={loadingData} page={directoryPage} totalPages={directoryPages}
      onPage={setDirectoryPage} sort={sort}
      onSort={(value) => { setSort(value); setDirectoryPage(1); }}
      familyFilter={familyFilter}
      onFamilyFilter={(value) => { setFamilyFilter(value); setDirectoryPage(1); }}
      userActivityFilter={userActivityFilter}
      onUserActivityFilter={(value) => { setUserActivityFilter(value); setDirectoryPage(1); }}
      onOpenDetails={(id) => setDetailsTarget({ type: view, id })}
    />
  </>;
}
