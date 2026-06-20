import "../styles/relationships.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { personsApi, relationshipsApi } from "../services/api";
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
  { value: "parent", label: "Parent" },
  { value: "child", label: "Enfant" },
  { value: "spouse", label: "Conjoint" },
  { value: "sibling", label: "Frère / Sœur" },
  { value: "relative", label: "Famille" },
  { value: "guardian", label: "Tuteur" },
  { value: "professional", label: "Professionnel" },
  { value: "legal", label: "Légal" },
];

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("fr-FR");
  } catch {
    return String(value);
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(value || 0);
}

function relationLabel(value) {
  return relationTypes.find((item) => item.value === value)?.label || value || "—";
}

function normalizeRelations(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.relationships)) return payload.relationships;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.relationships)) return payload.data.relationships;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function normalizePersons(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.persons)) return payload.persons;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.persons)) return payload.data.persons;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function getRelationType(item) {
  return item.relationship_type || item.relation_type || item.type || "";
}

function getRelationNotes(item) {
  return item.notes || item.description || "";
}

function cleanDateForInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const personName = (person) => {
    if (!person) return "—";

    const fullName =
      person.full_name ||
      person.fullName ||
      person.name ||
      `${person.last_name || person.nom || ""} ${
        person.first_name || person.prenom || ""
      }`.trim();

    const cin = person.cin || person.national_id || person.nationalId || "";

    return cin ? `${fullName || "Personne sans nom"} — ${cin}` : fullName || "Personne sans nom";
  };

  const getPerson = (id) => {
    if (!id) return null;
    return persons.find((person) => String(person.id) === String(id));
  };

  const displayPerson = (id, fallback = "") => {
    const person = getPerson(id);
    if (person) return personName(person);
    if (fallback) return fallback;
    return id || "—";
  };

  const getPersonFallbackFromRelation = (relation, side) => {
    if (side === "main") {
      if (relation.person_name) return relation.person_name;
      if (relation.person?.full_name) return relation.person.full_name;
      if (relation.person?.name) return relation.person.name;

      return `${relation.person_last_name || relation.last_name || ""} ${
        relation.person_first_name || relation.first_name || ""
      }`.trim();
    }

    if (relation.related_person_name) return relation.related_person_name;
    if (relation.related_person?.full_name) return relation.related_person.full_name;
    if (relation.related_person?.name) return relation.related_person.name;

    return `${relation.related_last_name || ""} ${
      relation.related_first_name || ""
    }`.trim();
  };

  const loadPersons = async () => {
    try {
      const response = await personsApi.list();
      const data = normalizePersons(response);
      setPersons(data);
      return data;
    } catch (error) {
      console.error("Erreur chargement personnes:", error);
      setPersons([]);
      return [];
    }
  };

  const loadRelationshipsDirectly = async () => {
    try {
      const response = await relationshipsApi.list({ page: 1, limit: 100 });
      return normalizeRelations(response);
    } catch {
      return null;
    }
  };

  const loadRelationshipsByPersons = async (people) => {
    const allRelations = [];

    for (const person of people) {
      try {
        const response = await relationshipsApi.listByPerson(person.id, {
          page: 1,
          limit: 100,
        });

        const rows = normalizeRelations(response);

        rows.forEach((relation) => {
          allRelations.push({
            ...relation,
            person_id: relation.person_id || person.id,
            person_name: relation.person_name || personName(person),
          });
        });
      } catch {
        // Tsy ajanona ny page raha olona iray tsy manana relation.
      }
    }

    return allRelations;
  };

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const people = await loadPersons();
      let rows = await loadRelationshipsDirectly();

      if (!rows || rows.length === 0) {
        rows = await loadRelationshipsByPersons(people);
      }

      setRelationships(rows || []);
    } catch (error) {
      setError(error.message || "Erreur lors du chargement des relations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredPersons = (keyword, excludedId = "") => {
    const search = String(keyword || "").toLowerCase().trim();

    if (!search) return [];

    return persons.filter((person) => {
      if (excludedId && String(person.id) === String(excludedId)) return false;

      const values = [
        person.id,
        person.first_name,
        person.last_name,
        person.prenom,
        person.nom,
        person.full_name,
        person.fullName,
        person.name,
        person.cin,
        person.national_id,
        person.nationalId,
        person.phone,
        person.telephone,
        person.email,
        personName(person),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(search);
    });
  };

  const filteredRelationships = useMemo(() => {
    const keyword = String(q || "").toLowerCase().trim();

    return relationships.filter((relation) => {
      const relationType = getRelationType(relation);

      const values = [
        relation.id,
        relation.person_id,
        relation.related_person_id,
        relationType,
        relationLabel(relationType),
        getRelationNotes(relation),
        relation.start_date,
        relation.end_date,
        displayPerson(relation.person_id, getPersonFallbackFromRelation(relation, "main")),
        displayPerson(
          relation.related_person_id,
          getPersonFallbackFromRelation(relation, "related")
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword = keyword ? values.includes(keyword) : true;
      const matchType = type ? relationType === type : true;

      return matchKeyword && matchType;
    });
  }, [relationships, q, type, persons]);

  const openCreate = async () => {
    setForm(emptyForm);
    setPersonSearch("");
    setRelatedSearch("");
    setError("");
    setModal("create");

    if (persons.length === 0) await loadPersons();
  };

  const openEdit = (relation) => {
    const personId = relation.person_id || "";
    const relatedPersonId = relation.related_person_id || "";

    setForm({
      person_id: personId,
      related_person_id: relatedPersonId,
      relationship_type: getRelationType(relation),
      start_date: cleanDateForInput(relation.start_date),
      end_date: cleanDateForInput(relation.end_date),
      notes: getRelationNotes(relation),
    });

    setPersonSearch(displayPerson(personId, getPersonFallbackFromRelation(relation, "main")));
    setRelatedSearch(
      displayPerson(relatedPersonId, getPersonFallbackFromRelation(relation, "related"))
    );

    setError("");
    setModal(relation.id);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");

      if (!form.person_id) return setError("Veuillez sélectionner la personne principale.");
      if (!form.related_person_id) return setError("Veuillez sélectionner la personne liée.");

      if (String(form.person_id) === String(form.related_person_id)) {
        return setError("La personne principale et la personne liée doivent être différentes.");
      }

      if (!form.relationship_type) return setError("Veuillez choisir le type de relation.");

      const payload = {
        person_id: form.person_id,
        related_person_id: form.related_person_id,
        relationship_type: form.relationship_type,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: true,
        notes: form.notes || "",
      };

      if (modal === "create") {
        await relationshipsApi.create(payload);
      } else {
        await relationshipsApi.update(modal, payload);
      }

      setModal(null);
      await load();
    } catch (error) {
      setError(error.message || "Erreur lors de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (relation) => {
    const confirmation = window.confirm("Voulez-vous vraiment supprimer cette relation ?");
    if (!confirmation) return;

    try {
      await relationshipsApi.remove(relation.id);
      await load();
    } catch (error) {
      alert(error.message || "Suppression impossible.");
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
              <p>{loading ? "…" : formatNumber(filteredRelationships.length)}</p>
            </div>
          </div>
        </div>

        <div className="relationships-table-box">
          <div className="relationships-table-header">
            <div>
              <h3>Liste des relations</h3>
              <span>Relations entre personnes selon le modèle UML du SNIP</span>
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
                onChange={(event) => setQ(event.target.value)}
                placeholder="Rechercher une personne, un type de relation, une note..."
              />
            </div>

            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="">Tous les types</option>
              {relationTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {error && !modal && <div className="relationships-error">{error}</div>}

          <div className="relationships-table-responsive">
            <table className="relationships-table">
              <thead>
                <tr>
                  <th>Personne principale</th>
                  <th>Type de relation</th>
                  <th>Personne liée</th>
                  <th>Date début de la relation</th>
                  <th>Date fin de la relation</th>
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
                  filteredRelationships.map((relation) => {
                    const relationType = getRelationType(relation);

                    return (
                      <tr key={relation.id}>
                        <td>
                          {displayPerson(
                            relation.person_id,
                            getPersonFallbackFromRelation(relation, "main")
                          )}
                        </td>

                        <td>
                          <span className="relationship-type">
                            {relationLabel(relationType)}
                          </span>
                        </td>

                        <td>
                          {displayPerson(
                            relation.related_person_id,
                            getPersonFallbackFromRelation(relation, "related")
                          )}
                        </td>

                        <td>{formatDate(relation.start_date)}</td>
                        <td>{formatDate(relation.end_date)}</td>
                        <td className="relationship-notes">{getRelationNotes(relation) || "—"}</td>

                        <td>
                          <div className="relationship-action-buttons">
                            <button
                              type="button"
                              className="relationship-icon-action relationship-view-btn"
                              title="Voir"
                              onClick={() => setViewItem(relation)}
                            >
                              <FaEye />
                            </button>

                            <button
                              type="button"
                              className="relationship-icon-action relationship-edit-btn"
                              title="Modifier"
                              onClick={() => openEdit(relation)}
                            >
                              <FaEdit />
                            </button>

                            <button
                              type="button"
                              className="relationship-icon-action relationship-delete-btn"
                              title="Supprimer"
                              onClick={() => remove(relation)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
              type="button"
              className="relationships-modal-close"
              onClick={() => setViewItem(null)}
            >
              <FaTimes />
            </button>

            <h3>Détail de la relation</h3>

            <div className="relationship-detail-grid">
              <Info
                label="Personne principale"
                value={displayPerson(
                  viewItem.person_id,
                  getPersonFallbackFromRelation(viewItem, "main")
                )}
              />

              <Info
                label="Personne liée"
                value={displayPerson(
                  viewItem.related_person_id,
                  getPersonFallbackFromRelation(viewItem, "related")
                )}
              />

              <Info label="Type de relation" value={relationLabel(getRelationType(viewItem))} />
              <Info label="Date début de la relation" value={formatDate(viewItem.start_date)} />
              <Info label="Date fin de la relation" value={formatDate(viewItem.end_date)} />
              <Info label="Notes" value={getRelationNotes(viewItem) || "—"} wide />
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="relationships-modal-overlay">
          <div className="relationships-modal-box">
            <button
              type="button"
              className="relationships-modal-close"
              onClick={() => setModal(null)}
            >
              <FaTimes />
            </button>

            <h3>{modal === "create" ? "Ajouter une relation" : "Modifier la relation"}</h3>

            {error && <div className="relationships-error">{error}</div>}

            <div className="relationships-form-grid">
              <PersonPicker
                label="Personne principale"
                value={personSearch}
                onChange={(value) => {
                  setPersonSearch(value);
                  setForm((previous) => ({ ...previous, person_id: "" }));
                }}
                persons={filteredPersons(personSearch, form.related_person_id)}
                selectedId={form.person_id}
                onSelect={(person) => {
                  setForm((previous) => ({ ...previous, person_id: person.id }));
                  setPersonSearch(personName(person));
                }}
                personName={personName}
              />

              <PersonPicker
                label="Personne liée"
                value={relatedSearch}
                onChange={(value) => {
                  setRelatedSearch(value);
                  setForm((previous) => ({ ...previous, related_person_id: "" }));
                }}
                persons={filteredPersons(relatedSearch, form.person_id)}
                selectedId={form.related_person_id}
                onSelect={(person) => {
                  setForm((previous) => ({ ...previous, related_person_id: person.id }));
                  setRelatedSearch(personName(person));
                }}
                personName={personName}
              />

              <div className="relationship-field">
                <label>Type de relation</label>
                <select
                  value={form.relationship_type}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      relationship_type: event.target.value,
                    }))
                  }
                >
                  <option value="">Sélectionner un type</option>
                  {relationTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <DateField
                label="Date début de la relation"
                value={form.start_date}
                onChange={(value) =>
                  setForm((previous) => ({ ...previous, start_date: value }))
                }
              />

              <DateField
                label="Date fin de la relation"
                value={form.end_date}
                onChange={(value) =>
                  setForm((previous) => ({ ...previous, end_date: value }))
                }
              />

              <div className="relationship-field relationship-field-wide">
                <label>Notes / description</label>
                <textarea
                  placeholder="Exemple : relation familiale confirmée, lien légal, tuteur officiel..."
                  value={form.notes}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, notes: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="relationships-modal-actions">
              <button
                type="button"
                className="relationships-cancel-btn"
                onClick={() => setModal(null)}
                disabled={saving}
              >
                Annuler
              </button>

              <button
                type="button"
                className="relationships-save-btn"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
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
      <label>{label}</label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Rechercher : ${label.toLowerCase()}`}
      />

      {value && !selectedId && (
        <div className="relationship-picker-list">
          {persons.length === 0 && (
            <div className="relationship-picker-empty">Aucune personne trouvée</div>
          )}

          {persons.slice(0, 8).map((person) => (
            <button
              type="button"
              key={person.id}
              className="relationship-picker-item"
              onClick={() => onSelect(person)}
            >
              <strong>{personName(person)}</strong>

              <span>
                {person.cin ||
                  person.national_id ||
                  person.nationalId ||
                  person.phone ||
                  person.telephone ||
                  person.email ||
                  person.id}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <div className="relationship-field relationship-date-field">
      <label className="relationship-date-label">{label}</label>

      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Info({ label, value, wide }) {
  return (
    <div
      className={
        wide
          ? "relationship-info-card relationship-info-wide"
          : "relationship-info-card"
      }
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}