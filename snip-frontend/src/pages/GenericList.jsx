import "../styles/persons.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { auditApi, usersApi } from "../services/api";
import { fmtDate } from "../utils/format";
import { FaSearch } from "react-icons/fa";

const config = {
  users: { title: "Utilisateurs & rôles", api: usersApi, columns: ["username", "full_name", "email", "role_name", "status", "last_login"] },
  audit: { title: "Audit logs", api: auditApi, columns: ["id", "username", "action", "target_type", "target_id", "method", "status_code", "created_at"] },
  files: { title: "Fichiers", message: "Le backend actuel expose les fichiers par personne seulement. Ouvrez une fiche personne pour voir/upload ses fichiers." },
  documents: { title: "Documents", message: "Le backend actuel n'a pas d'endpoint global documents. Les fichiers/documents sont accessibles depuis le détail d'une personne." },
};
export default function GenericList({ type }) {
  const cfg = useMemo(() => config[type] || config.files, [type]);
  const [rows, setRows] = useState([]); const [q, setQ] = useState("");
  const load = async () => { if (!cfg.api) return; try { const r = await cfg.api.list({ q, page: 1, limit: 50 }); setRows(r.data || []); } catch { setRows([]); } };
  useEffect(() => { load(); }, [cfg]); useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [q]);
  const read = (row, key) => { const v = row[key]; if (key.includes("date") || key.includes("created") || key.includes("login")) return fmtDate(v); if (typeof v === "object" && v) return JSON.stringify(v); return v ?? "—"; };
  return <><Topbar title={cfg.title} /><div className="table-box"><div className="table-header"><div><h3>{cfg.title}</h3><span>{cfg.message || "Données chargées depuis le backend"}</span></div></div>{cfg.message ? <div style={{ padding: 28, color: "#64748b" }}>{cfg.message}</div> : <><div className="filters-bar"><div className="search-box"><FaSearch className="search-icon" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer..." /></div></div><table><thead><tr>{cfg.columns.map((c) => <th key={c}>{c.replaceAll("_", " ").toUpperCase()}</th>)}</tr></thead><tbody>{rows.length === 0 && <tr><td colSpan={cfg.columns.length} style={{ textAlign: "center", padding: 28 }}>Aucune donnée trouvée</td></tr>}{rows.map((row, i) => <tr key={row.id || i}>{cfg.columns.map((c) => <td key={c}>{read(row, c)}</td>)}</tr>)}</tbody></table></>}</div></>;
}
