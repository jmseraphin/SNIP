import "../styles/persons.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import { personsApi } from "../services/api";
import { fmtDate, fullName, nationalId, phone, number } from "../utils/format";
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

export default function Persons() {
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
  }, [persons, query, gender]);

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
        setError("Nom et prénom obligatoires.");
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
      setError(e.message || "Erreur lors de l'enregistrement.");
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Supprimer ${fullName(p)} ?`)) return;

    try {
      await personsApi.remove(p.id);
      await load();
    } catch (e) {
      alert(e.message || "Suppression impossible.");
    }
  };

  return (
    <>
      <Topbar title="Gestion des personnes" />

      <div className="persons-page">
        <div className="persons-stats">
          <div className="stats-card compact">
            <div className="stats-icon">
              <FaUsers />
            </div>
            <div>
              <h3>Total personnes</h3>
              <p>{loading ? "…" : number(total)}</p>
            </div>
          </div>
        </div>

        <div className="table-box pro-table-box">
          <div className="table-header">
            <div>
              <h3>Liste des personnes</h3>
              <span>Consultation, ajout, modification et suppression</span>
            </div>

            <button className="add-btn" onClick={openCreate}>
              <FaPlus /> Ajouter
            </button>
          </div>

          <div className="filters-bar">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher nom, CIN, téléphone..."
              />
            </div>

            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Tous les sexes</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="persons-table">
              <thead>
                <tr>
                  <th>Personne</th>
                  <th>CIN</th>
                  <th>Téléphone</th>
                  <th>Sexe</th>
                  <th>Naissance</th>
                  <th>Statut</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      Chargement des données...
                    </td>
                  </tr>
                )}

                {!loading && filteredPersons.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      Aucune personne trouvée
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
                          <FaVenusMars /> {p.gender || p.sexe || "—"}
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
                          {p.status || "active"}
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

                          <button
                            className="icon-action edit-btn"
                            data-tooltip="Modifier"
                            onClick={() => openEdit(p)}
                          >
                            <FaEdit />
                          </button>

                          <button
                            className="icon-action delete-btn"
                            data-tooltip="Supprimer"
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
              Affichage de {filteredPersons.length} sur {number(total)} personnes
            </span>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box wide pro-modal">
            <h3>
              {modal === "create"
                ? "Ajouter une personne"
                : "Modifier une personne"}
            </h3>

            {error && <div className="login-error">{error}</div>}

            <div className="form-grid">
              <input
                placeholder="Nom de famille"
                value={form.last_name || ""}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
              />

              <input
                placeholder="Prénom"
                value={form.first_name || ""}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
              />

              <input
                placeholder="CIN / Identifiant national"
                value={form.cin || ""}
                onChange={(e) => setForm({ ...form, cin: e.target.value })}
              />

              <input
                placeholder="Téléphone"
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
                <option value="">Sexe</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>

              <input
                placeholder="Lieu de naissance"
                value={form.birth_place || ""}
                onChange={(e) =>
                  setForm({ ...form, birth_place: e.target.value })
                }
              />

              <input
                placeholder="Nationalité"
                value={form.nationality || ""}
                onChange={(e) =>
                  setForm({ ...form, nationality: e.target.value })
                }
              />
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setModal(null)}>
                Annuler
              </button>
              <button className="save-btn" onClick={save}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}