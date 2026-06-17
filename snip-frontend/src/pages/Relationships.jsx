import "../styles/relationships.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { auditApi, personsApi, relationshipsApi } from "../services/api";
import { fmtDate, number } from "../utils/format";
import {
  FaPeopleArrows,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaEye,
} from "react-icons/fa";

const emptyForm = {
  person_id: "",
  related_person_id: "",
  relationship_type: "",
  start_date: "",
  end_date: "",
  notes: "",
};

const relationTypes = [
  "Parent",
  "Enfant",
  "Conjoint",
  "Frère/Sœur",
  "Tuteur",
  "Employeur",
  "Collègue",
  "Ami",
  "Autre",
];

export default function Relationships() {
  const [relationships, setRelationships] = useState([]);
  const [persons, setPersons] = useState([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [modal, setModal] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [personSearch, setPersonSearch] = useState("");
  const [relatedSearch, setRelatedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const personName = (p) =>
    `${p.last_name || p.nom || ""} ${p.first_name || p.prenom || ""}`.trim() ||
    p.full_name ||
    p.name ||
    "Personne sans nom";

  const loadPersons = async () => {
    try {
      const logs = await auditApi.list({ page: 1, limit: 300 });

      const ids = (logs.data || [])
        .filter(
          (l) =>
            String(l.target_type || l.targetType || "").toLowerCase() ===
            "person"
        )
        .map((l) => l.target_id || l.targetId)
        .filter(Boolean);

      const uniqueIds = [...new Set(ids)];

      const people = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const res = await personsApi.get(id);
            return res?.data || res?.person || res;
          } catch {
            return null;
          }
        })
      );

      const clean = people.filter(Boolean);
      setPersons(clean);
      return clean;
    } catch {
      setPersons([]);
      return [];
    }
  };

  const normalizeRelations = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.relationships)) return res.relationships;
    if (Array.isArray(res?.results)) return res.results;
    if (Array.isArray(res?.data?.relationships)) return res.data.relationships;
    return [];
  };

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      await loadPersons();

      try {
        const res = await relationshipsApi.list({});
        setRelationships(normalizeRelations(res));
      } catch {
        setRelationships([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getPerson = (id) => persons.find((p) => p.id === id);

  const displayPerson = (id, fallback) => {
    const p = getPerson(id);
    return p ? personName(p) : fallback || id || "—";
  };

  const filteredPersons = (keyword) => {
    const k = keyword.toLowerCase();

    if (!k) return persons;

    return persons.filter((p) =>
      [
        p.last_name,
        p.first_name,
        p.nom,
        p.prenom,
        p.full_name,
        p.name,
        p.cin,
        p.phone,
        p.telephone,
        p.email,
        p.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(k)
    );
  };

  const filteredRelationships = useMemo(() => {
    const keyword = q.toLowerCase();

    return relationships.filter((r) => {
      const relationType =
        r.relationship_type || r.type || r.relation_type || "";

      const values = [
        relationType,
        r.notes,
        r.description,
        r.person_id,
        r.related_person_id,
        r.start_date,
        r.end_date,
        displayPerson(r.person_id, r.person_name),
        displayPerson(r.related_person_id, r.related_person_name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword = keyword ? values.includes(keyword) : true;

      const matchType = type
        ? String(relationType).toLowerCase() === type.toLowerCase()
        : true;

      return matchKeyword && matchType;
    });
  }, [relationships, q, type, persons]);

  const openCreate = async () => {
    setForm(emptyForm);
    setPersonSearch("");
    setRelatedSearch("");
    setError("");
    setModal("create");

    if (persons.length === 0) {
      await loadPersons();
    }
  };

  const openEdit = (r) => {
    const personId = r.person_id || "";
    const relatedId = r.related_person_id || "";

    setForm({
      person_id: personId,
      related_person_id: relatedId,
      relationship_type: r.relationship_type || r.type || r.relation_type || "",
      start_date: r.start_date ? String(r.start_date).slice(0, 10) : "",
      end_date: r.end_date ? String(r.end_date).slice(0, 10) : "",
      notes: r.notes || r.description || "",
    });

    setPersonSearch(displayPerson(personId, r.person_name));
    setRelatedSearch(displayPerson(relatedId, r.related_person_name));
    setError("");
    setModal(r.id);
  };

  const save = async () => {
    try {
      setError("");

      if (!form.person_id) return setError("Personne principale obligatoire.");
      if (!form.related_person_id) return setError("Personne liée obligatoire.");
      if (form.person_id === form.related_person_id) {
        return setError("Les deux personnes doivent être différentes.");
      }
      if (!form.relationship_type) return setError("Type de relation obligatoire.");

      const payload = {
        person_id: form.person_id,
        related_person_id: form.related_person_id,
        relationship_type: form.relationship_type,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        notes: form.notes,
      };

      if (modal === "create") {
        await relationshipsApi.create(payload);
      } else {
        await relationshipsApi.update(modal, payload);
      }

      setModal(null);
      await load();
    } catch (e) {
      setError(e.message || "Erreur lors de l’enregistrement.");
    }
  };

  const remove = async (r) => {
    if (!window.confirm("Supprimer cette relation ?")) return;

    try {
      await relationshipsApi.remove(r.id);
      await load();
    } catch (e) {
      alert(e.message || "Suppression impossible.");
    }
  };

  return (
    <>
      <Topbar title="Gestion des relations" />

      <div className="relationships-page">
        <div className="relationships-stats">
          <div className="relationship-stat-card">
            <div className="relationship-stat-icon">
              <FaPeopleArrows />
            </div>
            <div>
              <h3>Total relations</h3>
              <p>{loading ? "…" : number(filteredRelationships.length)}</p>
            </div>
          </div>
        </div>

        <div className="relationships-table-box">
          <div className="relationships-table-header">
            <div>
              <h3>Liste des relations</h3>
              <span>Relations entre personnes selon le modèle UML</span>
            </div>

            <button className="relationship-add-btn" onClick={openCreate}>
              <FaPlus /> Ajouter
            </button>
          </div>

          <div className="relationships-filters">
            <div className="relationships-search-box">
              <FaSearch className="relationships-search-icon" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher personne, relation, note..."
              />
            </div>

            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Tous les types</option>
              {relationTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="relationships-table-responsive">
            <table className="relationships-table">
              <thead>
                <tr>
                  <th>Personne</th>
                  <th>Relation</th>
                  <th>Personne liée</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Notes</th>
                  <th className="relationships-actions-col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="relationships-empty">
                      Chargement des relations...
                    </td>
                  </tr>
                )}

                {!loading && filteredRelationships.length === 0 && (
                  <tr>
                    <td colSpan="7" className="relationships-empty">
                      Aucune relation trouvée
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredRelationships.map((r) => (
                    <tr key={r.id}>
                      <td>{displayPerson(r.person_id, r.person_name)}</td>

                      <td>
                        <span className="relationship-type">
                          {r.relationship_type || r.type || r.relation_type || "—"}
                        </span>
                      </td>

                      <td>
                        {displayPerson(
                          r.related_person_id,
                          r.related_person_name
                        )}
                      </td>

                      <td>{r.start_date ? fmtDate(r.start_date) : "—"}</td>
                      <td>{r.end_date ? fmtDate(r.end_date) : "—"}</td>

                      <td className="relationship-notes">
                        {r.notes || r.description || "—"}
                      </td>

                      <td>
                        <div className="relationship-action-buttons">
                          <button
                            className="relationship-icon-action relationship-view-btn"
                            data-tooltip="Voir"
                            onClick={() => setViewItem(r)}
                          >
                            <FaEye />
                          </button>

                          <button
                            className="relationship-icon-action relationship-edit-btn"
                            data-tooltip="Modifier"
                            onClick={() => openEdit(r)}
                          >
                            <FaEdit />
                          </button>

                          <button
                            className="relationship-icon-action relationship-delete-btn"
                            data-tooltip="Supprimer"
                            onClick={() => remove(r)}
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

          <div className="relationships-pagination">
            <span>Affichage de {filteredRelationships.length} relation(s)</span>
          </div>
        </div>
      </div>

      {viewItem && (
        <div className="relationships-modal-overlay">
          <div className="relationships-modal-box">
            <button
              className="relationships-modal-close"
              onClick={() => setViewItem(null)}
            >
              <FaTimes />
            </button>

            <h3>Détail de la relation</h3>

            <div className="relationship-detail-grid">
              <Info label="Personne" value={displayPerson(viewItem.person_id)} />
              <Info
                label="Personne liée"
                value={displayPerson(viewItem.related_person_id)}
              />
              <Info
                label="Type"
                value={
                  viewItem.relationship_type ||
                  viewItem.type ||
                  viewItem.relation_type ||
                  "—"
                }
              />
              <Info
                label="Date début"
                value={viewItem.start_date ? fmtDate(viewItem.start_date) : "—"}
              />
              <Info
                label="Date fin"
                value={viewItem.end_date ? fmtDate(viewItem.end_date) : "—"}
              />
              <Info
                label="Notes"
                value={viewItem.notes || viewItem.description || "—"}
                wide
              />
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="relationships-modal-overlay">
          <div className="relationships-modal-box">
            <button
              className="relationships-modal-close"
              onClick={() => setModal(null)}
            >
              <FaTimes />
            </button>

            <h3>
              {modal === "create" ? "Ajouter une relation" : "Modifier relation"}
            </h3>

            {error && <div className="relationships-error">{error}</div>}

            <div className="relationships-form-grid">
              <PersonPicker
                label="Personne principale"
                value={personSearch}
                onChange={(value) => {
                  setPersonSearch(value);
                  setForm({ ...form, person_id: "" });
                }}
                persons={filteredPersons(personSearch)}
                selectedId={form.person_id}
                onSelect={(p) => {
                  setForm({ ...form, person_id: p.id });
                  setPersonSearch(personName(p));
                }}
                personName={personName}
              />

              <PersonPicker
                label="Personne liée"
                value={relatedSearch}
                onChange={(value) => {
                  setRelatedSearch(value);
                  setForm({ ...form, related_person_id: "" });
                }}
                persons={filteredPersons(relatedSearch)}
                selectedId={form.related_person_id}
                onSelect={(p) => {
                  setForm({ ...form, related_person_id: p.id });
                  setRelatedSearch(personName(p));
                }}
                personName={personName}
              />

              <select
                value={form.relationship_type}
                onChange={(e) =>
                  setForm({ ...form, relationship_type: e.target.value })
                }
              >
                <option value="">Type de relation</option>
                {relationTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />

              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />

              <textarea
                placeholder="Notes / description"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="relationships-modal-actions">
              <button
                className="relationships-cancel-btn"
                onClick={() => setModal(null)}
              >
                Annuler
              </button>

              <button className="relationships-save-btn" onClick={save}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PersonPicker({
  label,
  value,
  onChange,
  persons,
  selectedId,
  onSelect,
  personName,
}) {
  return (
    <div className="relationship-picker">
      <input
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="relationship-picker-list">
        {persons.length === 0 && (
          <div className="relationship-picker-empty">Aucune personne trouvée</div>
        )}

        {persons.slice(0, 8).map((p) => (
          <button
            type="button"
            key={p.id}
            className={
              selectedId === p.id
                ? "relationship-picker-item active"
                : "relationship-picker-item"
            }
            onClick={() => onSelect(p)}
          >
            <strong>{personName(p)}</strong>
            <span>{p.cin || p.phone || p.telephone || p.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value, wide }) {
  return (
    <div
      className={
        wide ? "relationship-info-card relationship-info-wide" : "relationship-info-card"
      }
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}