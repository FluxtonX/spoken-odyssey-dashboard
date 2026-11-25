import { formatNumber } from "../../lib/formatters.js";

export default function PostTypeBreakdown({ types }) {
  const names = [["image", "Images", "#8b7cff"], ["voice", "Voice", "#24b89a"], ["video", "Video", "#e2a353"], ["text", "Text", "#6998f4"], ["other", "Other", "#a6afc3"]];
  return <div className="type-breakdown">{names.map(([key, label, color]) => <div className="type-item" key={key}><span className="type-dot" style={{ background: color }} /><span>{label}</span><strong>{formatNumber(types?.[key])}</strong></div>)}</div>;
}
