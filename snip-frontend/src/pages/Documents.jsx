import "../styles/documents.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { identityDocumentsApi, personsApi } from "../services/api";
import { fmtDate, number, fullName, nationalId } from "../utils/format";
import {
  FaIdCard,
  FaSearch,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaSyncAlt,
} from "react-icons/fa";

const emptyForm = {
  id: "",
  person_id: "",
  type: "CIN",
  number: "",
  issued_by: "",
  issue_date: "",
  expiry_date: "",
  is_valid: true,
};

function normalizeList(res, keys = []) {
  if (Array.isArray(res)) return res;

  for (const key of keys) {
    if (Array.isArray(res?.[key])) return res[key];
    if (Array.isArray(res?.data?.[key])) return res.data[key];
  }

  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.results)) return res.results;
  if (Array.isArray(res?.data?.data)) return res.data.data;

  return [];
}

function personLabel(person) {
  if (!person) return "—";

  const name =
    fullName(person) ||
    person.full_name ||
    person.fullName ||
    person.name ||
    `${person.last_name || person.nom || ""} ${
      person.first_name || person.prenom || ""
    }`.trim() ||
    "Personne sans nom";

  const cin =
    nationalId(person) ||
    person.cin ||
    person.national_id ||
    person.nationalId ||
    "";

  return cin ? `${name} — ${cin}` : name;
}

function getDocId(doc) {
  return doc.id || doc.document_id || doc.identity_document_id || "";
}

function getDocPersonId(doc) {
  return doc.person_id || doc.personId || doc.person?.id || "";
}

function getDocPersonName(doc, persons = []) {
  if (doc.person_name) return doc.person_name;
  if (doc.personName) return doc.personName;
  if (doc.full_name) return doc.full_name;
  if (doc.fullName) return doc.fullName;
  if (doc.person) return personLabel(doc.person);

  const personId = getDocPersonId(doc);
  const found = persons.find((p) => String(p.id) === String(personId));

  return found ? personLabel(found) : personId || "—";
}

function getDocType(doc) {
  return doc.type || doc.document_type || doc.documentType || "—";
}

function getDocNumber(doc) {
  return (
    doc.number ||
    doc.document_number ||
    doc.documentNumber ||
    doc.cin ||
    doc.passport_number ||
    doc.passportNumber ||
    "—"
  );
}

function getDocIssuedBy(doc) {
  return doc.issued_by || doc.issuedBy || doc.issuer || "—";
}

function getDocIssueDate(doc) {
  return doc.issue_date || doc.issueDate || doc.issued_at || doc.issuedAt || "";
}

function getDocExpiryDate(doc) {
  return (
    doc.expiry_date ||
    doc.expiryDate ||
    doc.expires_at ||
    doc.expiresAt ||
    ""
  );
}

function getDocValidity(doc) {
  if (doc.is_valid === true || doc.isValid === true) return true;
  if (doc.is_valid === false || doc.isValid === false) return false;
  return null;
}

function normalizeType(type) {
  if (!type) return "CIN";
  const value = String(type).toUpperCase();

  if (value === "PASSEPORT") return "PASSPORT";
  if (value === "PASSPORT") return "PASSPORT";

  return value;
}

function displayType(type) {
  const value = normalizeType(type);

  if (value === "PASSPORT") return "Passeport";
  if (value === "CIN") return "CIN";

  return type || "—";
}

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [persons, setPersons] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [personSearch, setPersonSearch] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadDocuments() {
    try {
      setLoading(true);
      setReady(true);
      setError("");

      const response = await identityDocumentsApi.list({
        page: 1,
        limit: 200,
      });

      setDocuments(normalizeList(response, ["documents", "identity_documents", "identityDocuments"]));
    } catch {
      setDocuments([]);
      setReady(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadPersons() {
    try {
      const response = await personsApi.list();
      setPersons(normalizeList(response, ["persons"]));
    } catch {
      setPersons([]);
    }
  }

  useEffect(() => {
    loadDocuments();
    loadPersons();
  }, []);

  const filteredDocuments = useMemo(() => {
    const keyword = String(q || "").toLowerCase().trim();

    if (!keyword) return documents;

    return documents.filter((doc) => {
      const values = [
        getDocType(doc),
        getDocNumber(doc),
        getDocIssuedBy(doc),
        getDocIssueDate(doc),
        getDocExpiryDate(doc),
        getDocPersonId(doc),
        getDocPersonName(doc, persons),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }, [documents, persons, q]);

  const filteredPersonsForPicker = useMemo(() => {
    const keyword = String(personSearch || "").toLowerCase().trim();

    if (!keyword) return persons;

    return persons.filter((person) => {
      const values = [
        person.id,
        person.last_name,
        person.first_name,
        person.nom,
        person.prenom,
        person.full_name,
        person.fullName,
        person.name,
        person.cin,
        person.national_id,
        person.nationalId,
        person.phone,
        person.telephone,
        person.email,
        personLabel(person),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }, [persons, personSearch]);

  function openCreate() {
    setForm(emptyForm);
    setPersonSearch("");
    setError("");
    setModal("create");
    loadPersons();
  }

  function openEdit(doc) {
    const personId = getDocPersonId(doc);
    const foundPerson = persons.find((p) => String(p.id) === String(personId));

    setForm({
      id: getDocId(doc),
      person_id: personId,
      type: normalizeType(getDocType(doc)),
      number: getDocNumber(doc) === "—" ? "" : getDocNumber(doc),
      issued_by: getDocIssuedBy(doc) === "—" ? "" : getDocIssuedBy(doc),
      issue_date: getDocIssueDate(doc)
        ? String(getDocIssueDate(doc)).slice(0, 10)
        : "",
      expiry_date: getDocExpiryDate(doc)
        ? String(getDocExpiryDate(doc)).slice(0, 10)
        : "",
      is_valid: getDocValidity(doc) !== false,
    });

    setPersonSearch(
      foundPerson ? personLabel(foundPerson) : getDocPersonName(doc, persons)
    );

    setError("");
    setModal("edit");
  }

  async function save() {
    try {
      setSaving(true);
      setError("");

      if (!form.person_id) {
        setError("Veuillez sélectionner la personne concernée.");
        return;
      }

      if (!form.type) {
        setError("Veuillez choisir le type de document.");
        return;
      }

      if (!form.number) {
        setError("Le numéro du document est obligatoire.");
        return;
      }

      const payload = {
        person_id: form.person_id,
        type: form.type,
        number: form.number,
        issued_by: form.issued_by || null,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        is_valid: form.is_valid,
      };

      if (modal === "edit" && form.id) {
        await identityDocumentsApi.update(form.id, payload);
      } else {
        await identityDocumentsApi.create(payload);
      }

      setModal(null);
      setForm(emptyForm);
      setPersonSearch("");
      await loadDocuments();
    } catch (e) {
      setError(
        e?.status === 404
          ? "Module documents d’identité en attente du backend."
          : e?.message || "Erreur lors de l’enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }

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
              <p>{loading ? "…" : ready ? number(filteredDocuments.length) : "—"}</p>
            </div>
          </div>
        </div>

        <div className="documents-table-box">
          <div className="documents-table-header">
            <div>
              <h3>Documents d’identité</h3>
              <span>
                Type, numéro, personne, autorité, délivrance, expiration et validité
              </span>
            </div>

            <div className="documents-header-actions">
              <button className="document-add-btn" onClick={loadDocuments}>
                <FaSyncAlt /> Actualiser
              </button>

              <button className="document-add-btn" onClick={openCreate}>
                <FaPlus /> Ajouter
              </button>
            </div>
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

                {!loading && !ready && (
                  <tr>
                    <td colSpan="8" className="documents-empty">
                      —
                    </td>
                  </tr>
                )}

                {!loading && ready && filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan="8" className="documents-empty">
                      —
                    </td>
                  </tr>
                )}

                {!loading &&
                  ready &&
                  filteredDocuments.map((doc) => {
                    const validity = getDocValidity(doc);

                    return (
                      <tr
                        key={
                          getDocId(doc) ||
                          `${getDocPersonId(doc)}-${getDocNumber(doc)}`
                        }
                      >
                        <td>
                          <span className="document-type">
                            {displayType(getDocType(doc))}
                          </span>
                        </td>

                        <td>{getDocNumber(doc)}</td>

                        <td>{getDocPersonName(doc, persons)}</td>

                        <td>{getDocIssuedBy(doc)}</td>

                        <td>
                          {getDocIssueDate(doc)
                            ? fmtDate(getDocIssueDate(doc))
                            : "—"}
                        </td>

                        <td>
                          {getDocExpiryDate(doc)
                            ? fmtDate(getDocExpiryDate(doc))
                            : "—"}
                        </td>

                        <td>
                          <span
                            className={
                              validity === false
                                ? "document-invalid"
                                : validity === true
                                ? "document-valid"
                                : "document-unknown"
                            }
                          >
                            {validity === false
                              ? "Invalide"
                              : validity === true
                              ? "Valide"
                              : "—"}
                          </span>
                        </td>

                        <td>
                          <button
                            className="document-icon-action"
                            onClick={() => openEdit(doc)}
                            title="Modifier"
                          >
                            <FaEdit />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="documents-pagination">
            <span>
              Affichage de {ready ? filteredDocuments.length : "—"} document(s)
            </span>
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
                persons={filteredPersonsForPicker}
                selectedId={form.person_id}
                onSelect={(person) => {
                  setForm({ ...form, person_id: person.id });
                  setPersonSearch(personLabel(person));
                }}
              />

              <div className="document-field">
                <label>Type de document</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                >
                  <option value="CIN">CIN</option>
                  <option value="PASSPORT">Passeport</option>
                  <option value="PERMIS">Permis</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>

              <div className="document-field">
                <label>Numéro du document</label>
                <input
                  value={form.number}
                  onChange={(e) =>
                    setForm({ ...form, number: e.target.value })
                  }
                  placeholder="Numéro du document"
                />
              </div>

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
                  <option value="false">Invalide</option>
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
}) {
  return (
    <div className="document-picker">
      <label>{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher par nom ou CIN"
      />

      {value && !selectedId && (
        <div className="document-picker-list">
          {persons.length === 0 && (
            <div className="document-picker-empty">
              Aucune personne trouvée
            </div>
          )}

          {persons.slice(0, 10).map((person) => (
            <button
              type="button"
              key={person.id}
              className="document-picker-item"
              onClick={() => onSelect(person)}
            >
              <strong>{personLabel(person)}</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}