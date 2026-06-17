import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaSearch,
  FaEye,
  FaIdCard,
  FaPhone,
  FaCalendarAlt,
  FaUser,
} from "react-icons/fa";
import Topbar from "../components/Topbar";
import { personsApi, searchApi } from "../services/api";
import { fullName, nationalId, phone, fmtDate } from "../utils/format";
import "../styles/persons.css";

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = search.trim();

      if (!q) {
        setRows([]);
        setSource("");
        return;
      }

      setLoading(true);

      try {
        let result = [];

        try {
          const res = await searchApi.global(q);
          result = res.data || res.results || res.persons || [];
          setSource("Recherche globale");
        } catch {
          const res = await personsApi.list({ search: q, query: q, keyword: q });
          const all = res.data || res.persons || [];

          const qLower = q.toLowerCase();

          result = all.filter((p) => {
            const values = [
              p.first_name,
              p.last_name,
              p.nom,
              p.prenom,
              p.cin,
              p.national_id,
              p.phone,
              p.telephone,
              p.email,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return values.includes(qLower);
          });
          setSource("Recherche personnes");
        }

        setRows(Array.isArray(result) ? result : []);
      } catch {
        setRows([]);
        setSource("");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  return (
    <>
      <Topbar title="Recherche avancée" />

      <div className="persons-page">
        <div className="table-box pro-table-box">
          <div className="table-header">
            <div>
              <h3>Recherche rapide</h3>
              <span>
                Recherche par nom, prénom, CIN, téléphone, email ou identifiant
              </span>
            </div>
          </div>

          <div className="filters-bar">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Saisir un nom, CIN, téléphone..."
                autoFocus
              />
            </div>
          </div>

          <div className="search-summary">
            <div>
              <FaUser />
              <span>
                {loading
                  ? "Recherche en cours..."
                  : search
                  ? `${rows.length} résultat(s) trouvé(s)`
                  : "Saisir un mot-clé pour lancer la recherche"}
              </span>
            </div>

            {source && <strong>{source}</strong>}
          </div>

          <div className="table-responsive">
            <table className="persons-table">
              <thead>
                <tr>
                  <th>Personne</th>
                  <th>CIN</th>
                  <th>Téléphone</th>
                  <th>Naissance</th>
                  <th className="actions-col">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      Recherche en cours...
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      {search
                        ? "Aucun résultat trouvé"
                        : "Saisir une recherche"}
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="person-info">
                          <div className="person-avatar">
                            {fullName(p).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4>{fullName(p)}</h4>
                            <span>ID : {String(p.id || "").slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="mini-info">
                          <FaIdCard /> {nationalId(p)}
                        </span>
                      </td>

                      <td>
                        <span className="mini-info">
                          <FaPhone /> {phone(p)}
                        </span>
                      </td>

                      <td>
                        <span className="mini-info">
                          <FaCalendarAlt />{" "}
                          {fmtDate(p.birth_date || p.birthDate)}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="icon-action view-btn"
                            data-tooltip="Voir"
                            onClick={() => navigate(`/persons/${p.id}`)}
                          >
                            <FaEye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span>
              {search
                ? `Résultats affichés : ${rows.length}`
                : "Recherche connectée au backend SNIP"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}