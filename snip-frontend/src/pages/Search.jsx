import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaSearch, FaEye } from "react-icons/fa";
import Topbar from "../components/Topbar";
import { searchApi } from "../services/api";
import { fullName, nationalId, phone, fmtDate } from "../utils/format";
import "../styles/persons.css";

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!search.trim()) return setRows([]);
      setLoading(true);
      try { const r = await searchApi.global(search); setRows(r.data || []); } catch { setRows([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [search]);
  return <><Topbar title="Recherche avancée" /><div className="table-box"><div className="table-header"><div><h3>Recherche personne</h3><span>Recherche connectée au backend SNIP : nom, prénom, CIN, email, téléphone</span></div></div><div className="filters-bar"><div className="search-box"><FaSearch className="search-icon" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." /></div></div><table><thead><tr><th>Nom complet</th><th>CIN</th><th>Téléphone</th><th>Naissance</th><th>Action</th></tr></thead><tbody>{!loading && rows.length === 0 && <tr><td colSpan="5" style={{ textAlign: "center", padding: 28 }}>{search ? "Aucun résultat trouvé" : "Saisir une recherche"}</td></tr>}{rows.map((p) => <tr key={p.id}><td>{fullName(p)}</td><td>{nationalId(p)}</td><td>{phone(p)}</td><td>{fmtDate(p.birth_date)}</td><td><button className="view-btn" onClick={() => navigate(`/persons/${p.id}`)}><FaEye /></button></td></tr>)}</tbody></table></div></>;
}
