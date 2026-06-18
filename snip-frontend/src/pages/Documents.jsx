import "../styles/documents.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { personsApi } from "../services/api";
import { fmtDate, number } from "../utils/format";
import {
  FaIdCard,
  FaSearch,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
} from "react-icons/fa";

const emptyForm = {
  person_id: "",
  document_type: "CIN",
  cin: "",
  passport_number: "",
  issued_by: "",
  issue_date: "",
  expiry_date: "",
  is_valid: true,
};

export default function Documents() {
  const [persons, setPersons] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [personSearch, setPersonSearch] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const personName = (p) =>
    `${p.last_name || p.nom || ""} ${p.first_name || p.prenom || ""}`.trim() ||
    p.full_name ||
    p.name ||
    "Personne sans nom";

  const getPerson = (id) =>
    persons.find((person) => String(person.id) === String(id));

  const buildDocuments = (people) => {
    const list = [];

    people.forEach((p) => {
      if (p.cin) {
        list.push({
          id: `${p.id}-cin`,
          person: p,
          type: "CIN",
          number: p.cin,
          issued_by: p.issued_by || "—",
          issue_date: p.issue_date || null,
          expiry_date: p.expiry_date || null,
          is_valid: p.is_valid ?? true,
          raw: p,
        });
      }

      if (p.passport_number) {
        list.push({
          id: `${p.id}-passport`,
          person: p,
          type: "Passeport",
          number: p.passport_number,
          issued_by: p.passport_issued_by || p.issued_by || "—",
          issue_date: p.passport_issue_date || p.issue_date || null,
          expiry_date: p.passport_expiry_date || p.expiry_date || null,
          is_valid: p.passport_is_valid ?? p.is_valid ?? true,
          raw: p,
        });
      }
    });

    return list;
  };

  const loadPersons = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await personsApi.list({
        page: 1,
        limit: 100,
      });

      setPersons(response.data || []);
    } catch (e) {
      setPersons([]);
      setError(e.message || "Erreur lors du chargement des personnes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersons();
  }, []);

  const documents = useMemo(() => {
    const list = buildDocuments(persons);
    const keyword = String(q || "").toLowerCase().trim();

    if (!keyword) return list;

    return list.filter((d) =>
      [
        d.type,
        d.number,
        d.issued_by,
        d.issue_date,
        d.expiry_date,
        personName(d.person),
        d.person?.id,
        d.person?.cin,
        d.person?.phone,
        d.person?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [persons, q]);

  const filteredPersonsForPicker = (keyword) => {
    const search = String(keyword || "").toLowerCase().trim();

    if (!search) return persons;

    return persons.filter((person) => {
      const values = [
        person.id,
        person.last_name,
        person.first_name,
        person.nom,
        person.prenom,
        person.full_name,
        person.name,
        person.cin,
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

  const openCreate = () => {
    setForm(emptyForm);
    setPersonSearch("");
    setError("");
    setModal("create");
  };

  const openEdit = (doc) => {
    const person = doc.person;

    setForm({
      person_id: person.id || "",
      document_type: doc.type === "Passeport" ? "PASSPORT" : "CIN",
      cin: person.cin || "",
      passport_number: person.passport_number || "",
      issued_by: person.issued_by || "",
      issue_date: person.issue_date ? String(person.issue_date).slice(0, 10) : "",
      expiry_date: person.expiry_date
        ? String(person.expiry_date).slice(0, 10)
        : "",
      is_valid: doc.is_valid !== false,
    });

    setPersonSearch(personName(person));
    setError("");
    setModal(person.id);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");

      if (!form.person_id) {
        setError("Veuillez sélectionner la personne concernée.");
        return;
      }

      if (!form.document_type) {
        setError("Veuillez choisir le type de document.");
        return;
      }

      const person = getPerson(form.person_id);

      if (!person) {
        setError("Personne introuvable.");
        return;
      }

      if (form.document_type === "CIN" && !form.cin) {
        setError("Le numéro CIN est obligatoire.");
        return;
      }

      if (form.document_type === "PASSPORT" && !form.passport_number) {
        setError("Le numéro passeport est obligatoire.");
        return;
      }

      const payload = {
        ...person,
        issued_by: form.issued_by,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        is_valid: form.is_valid,
      };

      if (form.document_type === "CIN") {
        payload.cin = form.cin;
      }

      if (form.document_type === "PASSPORT") {
        payload.passport_number = form.passport_number;
      }

      await personsApi.update(form.person_id, payload);

      setModal(null);
      await loadPersons();
    } catch (e) {
      setError(e.message || "Erreur lors de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar title="Gestion des documents d’identité" />

      <div className="documents-page">
        <div className="documents-stats">
          <div className="document-stat-card">
            <div className="document-stat-icon">
              <FaIdCard />
            </div>

            <div>
              <h3>Total documents</h3>
              <p>{loading ? "…" : number(documents.length)}</p>
            </div>
          </div>
        </div>

        <div className="documents-table-box">
          <div className="documents-table-header">
            <div>
              <h3>Documents d’identité</h3>
              <span>CIN, passeport, autorité, délivrance, expiration et validité</span>
            </div>

            <button className="document-add-btn" onClick={openCreate}>
              <FaPlus /> Ajouter
            </button>
          </div>

          <div className="documents-filters">
            <div className="documents-search-box">
              <FaSearch className="documents-search-icon" />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher type, numéro, personne, autorité..."
              />
            </div>
          </div>

          {error && !modal && <div className="documents-error">{error}</div>}

          <div className="documents-table-responsive">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Numéro</th>
                  <th>Personne</th>
                  <th>Délivré par</th>
                  <th>Date délivrance</th>
                  <th>Expiration</th>
                  <th>Validité</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="8" className="documents-empty">
                      Chargement...
                    </td>
                  </tr>
                )}

                {!loading && documents.length === 0 && (
                  <tr>
                    <td colSpan="8" className="documents-empty">
                      Aucun document trouvé
                    </td>
                  </tr>
                )}

                {!loading &&
                  documents.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <span className="document-type">{d.type || "—"}</span>
                      </td>

                      <td>{d.number || "—"}</td>

                      <td>{personName(d.person)}</td>

                      <td>{d.issued_by || "—"}</td>

                      <td>{d.issue_date ? fmtDate(d.issue_date) : "—"}</td>

                      <td>{d.expiry_date ? fmtDate(d.expiry_date) : "—"}</td>

                      <td>
                        <span
                          className={
                            d.is_valid === false
                              ? "document-invalid"
                              : d.is_valid === true
                              ? "document-valid"
                              : "document-unknown"
                          }
                        >
                          {d.is_valid === false
                            ? "Expiré"
                            : d.is_valid === true
                            ? "Valide"
                            : "—"}
                        </span>
                      </td>

                      <td>
                        <button
                          className="document-icon-action"
                          onClick={() => openEdit(d)}
                          title="Modifier"
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="documents-pagination">
            <span>Affichage de {documents.length} document(s)</span>
          </div>
        </div>
      </div>

      {modal && (
        <div className="documents-modal-overlay">
          <div className="documents-modal-box">
            <button
              className="documents-modal-close"
              onClick={() => setModal(null)}
            >
              <FaTimes />
            </button>

            <h3>
              {modal === "create"
                ? "Ajouter un document d’identité"
                : "Modifier document d’identité"}
            </h3>

            {error && <div className="documents-error">{error}</div>}

            <div className="documents-form-grid">
              <PersonPicker
                label="Personne concernée"
                value={personSearch}
                onChange={(value) => {
                  setPersonSearch(value);
                  setForm({ ...form, person_id: "" });
                }}
                persons={filteredPersonsForPicker(personSearch)}
                selectedId={form.person_id}
                onSelect={(person) => {
                  setForm({ ...form, person_id: person.id });
                  setPersonSearch(personName(person));
                }}
                personName={personName}
              />

              <div className="document-field">
                <label>Type de document</label>
                <select
                  value={form.document_type}
                  onChange={(e) =>
                    setForm({ ...form, document_type: e.target.value })
                  }
                >
                  <option value="CIN">CIN</option>
                  <option value="PASSPORT">Passeport</option>
                </select>
              </div>

              {form.document_type === "CIN" && (
                <div className="document-field">
                  <label>Numéro CIN</label>
                  <input
                    value={form.cin}
                    onChange={(e) => setForm({ ...form, cin: e.target.value })}
                    placeholder="Numéro CIN"
                  />
                </div>
              )}

              {form.document_type === "PASSPORT" && (
                <div className="document-field">
                  <label>Numéro passeport</label>
                  <input
                    value={form.passport_number}
                    onChange={(e) =>
                      setForm({ ...form, passport_number: e.target.value })
                    }
                    placeholder="Numéro passeport"
                  />
                </div>
              )}

              <div className="document-field">
                <label>Délivré par</label>
                <input
                  value={form.issued_by}
                  onChange={(e) =>
                    setForm({ ...form, issued_by: e.target.value })
                  }
                  placeholder="Autorité de délivrance"
                />
              </div>

              <div className="document-field">
                <label>Date délivrance</label>
                <input
                  type="date"
                  value={form.issue_date}
                  onChange={(e) =>
                    setForm({ ...form, issue_date: e.target.value })
                  }
                />
              </div>

              <div className="document-field">
                <label>Date expiration</label>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) =>
                    setForm({ ...form, expiry_date: e.target.value })
                  }
                />
              </div>

              <div className="document-field">
                <label>Validité</label>
                <select
                  value={String(form.is_valid)}
                  onChange={(e) =>
                    setForm({ ...form, is_valid: e.target.value === "true" })
                  }
                >
                  <option value="true">Valide</option>
                  <option value="false">Expiré / invalide</option>
                </select>
              </div>
            </div>

            <div className="documents-modal-actions">
              <button
                className="documents-cancel-btn"
                onClick={() => setModal(null)}
                disabled={saving}
              >
                Annuler
              </button>

              <button
                className="documents-save-btn"
                onClick={save}
                disabled={saving}
              >
                <FaSave /> {saving ? "Enregistrement..." : "Enregistrer"}
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
    <div className="document-picker">
      <label>{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher une personne"
      />

      <div className="document-picker-list">
        {persons.length === 0 && (
          <div className="document-picker-empty">Aucune personne trouvée</div>
        )}

        {persons.slice(0, 8).map((person) => (
          <button
            type="button"
            key={person.id}
            className={
              selectedId === person.id
                ? "document-picker-item active"
                : "document-picker-item"
            }
            onClick={() => onSelect(person)}
          >
            <strong>{personName(person)}</strong>

            <span>
              {person.cin ||
                person.phone ||
                person.telephone ||
                person.email ||
                person.id}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}