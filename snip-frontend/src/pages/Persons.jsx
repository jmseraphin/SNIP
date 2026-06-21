import "../styles/persons.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import { personsApi } from "../services/api";
import { fmtDate, fullName, nationalId, phone, number } from "../utils/format";
import { t, useLang } from "../i18n";
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaUsers,
  FaIdCard,
  FaPhone,
  FaVenusMars,
} from "react-icons/fa";

const emptyForm = {
  last_name: "",
  first_name: "",
  cin: "",
  phone: "",
  gender: "",
  nationality: "Malagasy",
  birth_date: "",
  birth_place: "",
  status: "active",
};

function replaceValue(text, values = {}) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{{${key}}}`, value),
    text
  );
}

function translateStatus(status) {
  const value = status || "active";

  if (value === "active") return t("persons.active");
  if (value === "inactive") return t("persons.inactive");

  return value;
}

function translateGender(value) {
  if (!value) return t("common.none");

  const gender = String(value).toLowerCase();

  if (gender === "m" || gender === "masculin" || gender === "male") {
    return t("persons.male");
  }

  if (gender === "f" || gender === "féminin" || gender === "feminin" || gender === "female") {
    return t("persons.female");
  }

  if (gender === "homme" || gender === "man") {
    return t("persons.man");
  }

  if (gender === "femme" || gender === "woman") {
    return t("persons.woman");
  }

  return value;
}

export default function Persons() {
  const lang = useLang();
  const navigate = useNavigate();

  const [persons, setPersons] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await personsApi.list({ page: 1, limit: 100 });
      setPersons(res.data || []);
      setTotal(res.total || 0);
    } catch {
      setPersons([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredPersons = useMemo(() => {
    const keyword = String(query || "").toLowerCase().trim();

    return persons.filter((p) => {
      const matchGender = gender
        ? String(p.gender || p.sexe || "").toLowerCase() === gender.toLowerCase()
        : true;

      const values = [
        p.id,
        p.last_name,
        p.first_name,
        p.nom,
        p.prenom,
        p.full_name,
        p.name,
        p.cin,
        p.passport_number,
        p.phone,
        p.telephone,
        p.email,
        p.birth_place,
        p.nationality,
        p.status,
        fullName(p),
        nationalId(p),
        phone(p),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword = keyword ? values.includes(keyword) : true;

      return matchKeyword && matchGender;
    });
  }, [persons, query, gender, lang]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal("create");
    setError("");
  };

  const openEdit = (p) => {
    setForm({
      ...emptyForm,
      ...p,
      cin: p.cin || "",
      birth_date: p.birth_date ? String(p.birth_date).slice(0, 10) : "",
    });
    setModal(p.id);
    setError("");
  };

  const save = async () => {
    try {
      setError("");

      if (!form.last_name || !form.first_name) {
        setError(t("persons.requiredName"));
        return;
      }

      if (modal === "create") {
        await personsApi.create(form);
      } else {
        await personsApi.update(modal, form);
      }

      setModal(null);
      await load();
    } catch (e) {
      setError(e.message || t("persons.saveError"));
    }
  };

  const remove = async (p) => {
    const message = replaceValue(t("persons.deleteConfirm"), {
      name: fullName(p),
    });

    if (!window.confirm(message)) return;

    try {
      await personsApi.remove(p.id);
      await load();
    } catch (e) {
      alert(e.message || t("persons.deleteError"));
    }
  };

  return (
    <>
      <Topbar title={t("persons.title")} />

      <div className="persons-page">
        <div className="persons-stats">
          <div className="stats-card compact">
            <div className="stats-icon">
              <FaUsers />
            </div>

            <div>
              <h3>{t("persons.total")}</h3>
              <p>{loading ? "…" : number(total)}</p>
            </div>
          </div>
        </div>

        <div className="table-box pro-table-box">
          <div className="table-header">
            <div>
              <h3>{t("persons.list")}</h3>
              <span>{t("persons.subtitle")}</span>
            </div>

            <button type="button" className="add-btn" onClick={openCreate}>
              <FaPlus /> {t("common.add")}
            </button>
          </div>

          <div className="filters-bar">
            <div className="search-box">
              <FaSearch className="search-icon" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("persons.searchPlaceholder")}
              />
            </div>

            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">{t("persons.allGenders")}</option>
              <option value="M">{t("persons.male")}</option>
              <option value="F">{t("persons.female")}</option>
              <option value="Homme">{t("persons.man")}</option>
              <option value="Femme">{t("persons.woman")}</option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="persons-table">
              <thead>
                <tr>
                  <th>{t("persons.person")}</th>
                  <th>{t("persons.cin")}</th>
                  <th>{t("persons.phone")}</th>
                  <th>{t("persons.gender")}</th>
                  <th>{t("persons.birth")}</th>
                  <th>{t("persons.status")}</th>
                  <th className="actions-col">{t("common.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      {t("persons.loadingData")}
                    </td>
                  </tr>
                )}

                {!loading && filteredPersons.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      {t("persons.notFound")}
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredPersons.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="person-info">
                          <div className="person-avatar">
                            {fullName(p).charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <h4>{fullName(p)}</h4>
                            <span>ID : {String(p.id).slice(0, 8)}...</span>
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
                          <FaVenusMars /> {translateGender(p.gender || p.sexe)}
                        </span>
                      </td>

                      <td>{fmtDate(p.birth_date || p.birthDate)}</td>

                      <td>
                        <span
                          className={
                            (p.status || "active") === "active"
                              ? "status active"
                              : "status inactive"
                          }
                        >
                          {translateStatus(p.status)}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="icon-action view-btn"
                            data-tooltip={t("persons.view")}
                            onClick={() => navigate(`/persons/${p.id}`)}
                          >
                            <FaEye />
                          </button>

                          <button
                            type="button"
                            className="icon-action edit-btn"
                            data-tooltip={t("common.edit")}
                            onClick={() => openEdit(p)}
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="icon-action delete-btn"
                            data-tooltip={t("common.delete")}
                            onClick={() => remove(p)}
                          >
                            <FaTrash />
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
              {replaceValue(t("persons.display"), {
                shown: filteredPersons.length,
                total: number(total),
              })}
            </span>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box wide pro-modal">
            <h3>{modal === "create" ? t("persons.add") : t("persons.edit")}</h3>

            {error && <div className="login-error">{error}</div>}

            <div className="form-grid">
              <input
                placeholder={t("persons.lastName")}
                value={form.last_name || ""}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
              />

              <input
                placeholder={t("persons.firstName")}
                value={form.first_name || ""}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
              />

              <input
                placeholder={t("persons.nationalId")}
                value={form.cin || ""}
                onChange={(e) => setForm({ ...form, cin: e.target.value })}
              />

              <input
                placeholder={t("persons.phone")}
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <input
                type="date"
                value={form.birth_date || ""}
                onChange={(e) =>
                  setForm({ ...form, birth_date: e.target.value })
                }
              />

              <select
                value={form.gender || ""}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">{t("persons.gender")}</option>
                <option value="M">{t("persons.male")}</option>
                <option value="F">{t("persons.female")}</option>
              </select>

              <input
                placeholder={t("persons.birthPlace")}
                value={form.birth_place || ""}
                onChange={(e) =>
                  setForm({ ...form, birth_place: e.target.value })
                }
              />

              <input
                placeholder={t("persons.nationality")}
                value={form.nationality || ""}
                onChange={(e) =>
                  setForm({ ...form, nationality: e.target.value })
                }
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setModal(null)}
              >
                {t("common.cancel")}
              </button>

              <button type="button" className="save-btn" onClick={save}>
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}