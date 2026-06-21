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
import { t, useLang } from "../i18n";
import "../styles/persons.css";

function label(lang, fr, en) {
  return lang === "en" ? en : fr;
}

export default function Search() {
  const lang = useLang();
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
          setSource(label(lang, "Recherche globale", "Global search"));
        } catch {
          const res = await personsApi.list({
            search: q,
            query: q,
            keyword: q,
          });

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

          setSource(label(lang, "Recherche personnes", "Persons search"));
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
  }, [search, lang]);

  return (
    <>
      <Topbar title={t("search.advanced")} />

      <div className="persons-page">
        <div className="table-box pro-table-box">
          <div className="table-header">
            <div>
              <h3>{t("search.advanced")}</h3>
              <span>
                {label(
                  lang,
                  "Recherche par nom, prénom, CIN, téléphone, email ou identifiant",
                  "Search by last name, first name, ID, phone, email or identifier"
                )}
              </span>
            </div>
          </div>

          <div className="filters-bar">
            <div className="search-box">
              <FaSearch className="search-icon" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search.placeholder")}
                autoFocus
              />
            </div>
          </div>

          <div className="search-summary">
            <div>
              <FaUser />

              <span>
                {loading
                  ? label(lang, "Recherche en cours...", "Searching...")
                  : search
                  ? label(
                      lang,
                      `${rows.length} résultat(s) trouvé(s)`,
                      `${rows.length} result(s) found`
                    )
                  : label(
                      lang,
                      "Saisir un mot-clé pour lancer la recherche",
                      "Enter a keyword to start searching"
                    )}
              </span>
            </div>

            {source && <strong>{source}</strong>}
          </div>

          <div className="table-responsive">
            <table className="persons-table">
              <thead>
                <tr>
                  <th>{t("persons.person")}</th>
                  <th>{t("persons.cin")}</th>
                  <th>{t("persons.phone")}</th>
                  <th>{t("persons.birth")}</th>
                  <th className="actions-col">{t("common.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      {label(lang, "Recherche en cours...", "Searching...")}
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      {search
                        ? t("search.noResult")
                        : label(lang, "Saisir une recherche", "Enter a search")}
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
                            type="button"
                            className="icon-action view-btn"
                            data-tooltip={t("common.view")}
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
                ? label(
                    lang,
                    `Résultats affichés : ${rows.length}`,
                    `Displayed results: ${rows.length}`
                  )
                : label(
                    lang,
                    "Recherche connectée au backend SNIP",
                    "Search connected to SNIP backend"
                  )}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}