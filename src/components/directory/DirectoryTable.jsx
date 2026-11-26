import Dropdown from "../shared/Dropdown.jsx";
import PostTypeBreakdown from "../shared/PostTypeBreakdown.jsx";
import { dateLabel, formatNumber } from "../../lib/formatters.js";

const restrictionNames = {
  NONE: "Active",
  POSTING_RESTRICTED: "Posting restricted",
  TEMPORARY_SUSPENDED: "Temporarily suspended",
  PERMANENTLY_SUSPENDED: "Suspended",
};

export default function DirectoryTable({ view, rows, onSearch, search, loading, page, totalPages, onPage, sort, onSort, familyFilter, onFamilyFilter, onOpenDetails }) {
  const userView = view === "users";
  const familyOptions = [
    { value: "all", label: "All users", description: "Show every account" },
    { value: "joined", label: "In a family", description: "Has an active family membership" },
    { value: "none", label: "No family", description: "No active family membership" },
  ];
  const sortOptions = userView
    ? [{ value: "recent", label: "Newest first", description: "Recently registered accounts" }, { value: "oldest", label: "Oldest first", description: "Earliest registered accounts" }, { value: "name", label: "Name A–Z", description: "Alphabetical by display name" }, { value: "active", label: "Recently active", description: "Latest account activity" }]
    : [{ value: "recent", label: "Newest first", description: "Recently created family spaces" }, { value: "oldest", label: "Oldest first", description: "Earliest family spaces" }, { value: "name", label: "Name A–Z", description: "Alphabetical by family name" }, { value: "members", label: "Most members", description: "Largest active family circles" }];
  return <section className="panel table-panel">
    <div className="panel-heading directory-heading">
      <div><p className="eyebrow">DIRECTORY</p><h2>{userView ? "Users" : "Family circles"}</h2><p className="panel-subtitle">{userView ? "Account activity, access status, family membership and post mix." : "Family membership and shared post activity."}</p></div>
      <div className="directory-tools"><div className="search-box"><span>⌕</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={userView ? "Search users" : "Search families"} /></div>{userView && <Dropdown label="Filter by family" icon="◉" value={familyFilter} onChange={onFamilyFilter} options={familyOptions} />}<Dropdown label="Sort results" icon="⇅" value={sort} onChange={onSort} options={sortOptions} /></div>
    </div>
    {loading ? <div className="table-message">Loading records…</div> : rows.length === 0 ? <div className="table-message">No matching records.</div> : <div className="table-scroll"><table>
      <thead><tr>{userView ? <><th>USER</th><th>ACCESS</th><th>JOINED</th><th>LAST ACTIVE</th><th>FAMILIES</th><th>POSTS</th><th>POST MIX</th></> : <><th>FAMILY</th><th>CREATED</th><th>CREATOR</th><th>MEMBERS</th><th>SHARED POSTS</th><th>POST MIX</th></>}</tr></thead>
      <tbody>{rows.map((row) => userView ? <tr key={row.id}>
        <td><button className="person-cell person-link" onClick={() => onOpenDetails(row.id)}><div className="avatar">{(row.displayName || row.email || "?").slice(0, 1).toUpperCase()}</div><span><strong>{row.displayName || "Unnamed user"}</strong><small>{row.email}</small></span></button></td>
        <td><span className={`status-tag ${row.restrictionStatus === "NONE" ? "" : "status-tag-muted"}`}>{restrictionNames[row.restrictionStatus] || (row.isActive ? "Active" : "Suspended")}</span>{row.adminRestrictionEndsAt && row.restrictionStatus === "TEMPORARY_SUSPENDED" && <small className="table-subline">Until {dateLabel(row.adminRestrictionEndsAt)}</small>}</td>
        <td>{dateLabel(row.createdAt)}</td><td>{dateLabel(row.lastActive)}</td>
        <td><div className="family-tags">{row.familyMemberships?.length ? row.familyMemberships.map((item) => <span key={item.familyCircle.id}>{item.familyCircle.name}</span>) : <span className="muted">No family</span>}</div></td>
        <td><strong>{formatNumber(row._count?.memories)}</strong></td><td><PostTypeBreakdown types={row.postTypes} /></td>
      </tr> : <tr key={row.id}>
        <td><button className="person-cell person-link" onClick={() => onOpenDetails(row.id)}><div className="avatar family-avatar">⌂</div><span><strong>{row.name}</strong><small>{row.description || "Family space"}</small></span></button></td>
        <td>{dateLabel(row.createdAt)}</td><td>{row.createdBy?.displayName || row.createdBy?.email || "—"}</td><td>{formatNumber(row._count?.members)}</td>
        <td><strong>{formatNumber(row._count?.memoryLinks)}</strong></td><td><PostTypeBreakdown types={row.postTypes} /></td>
      </tr>)}</tbody>
    </table></div>}
    {!loading && totalPages > 1 && <div className="pagination"><span>Page {page} of {totalPages}</span><div><button disabled={page <= 1} onClick={() => onPage(page - 1)}>← Previous</button><button disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next →</button></div></div>}
  </section>;
}
