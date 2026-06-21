import "../styles/documents.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { identityDocumentsApi, personsApi } from "../services/api";
import { fmtDate, number, fullName, nationalId } from "../utils/format";
import { t, useLang } from "../i18n";
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

function label(lang, fr, en) {
  return lang === "en" ? en : fr;
}

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

function personLabel(person, lang) {
  if (!person) return "—";

  const name =
    fullName(person) ||
    person.full_name ||
    person.fullName ||
    person.name ||
    `${person.last_name || person.nom || ""} ${
      person.first_name || person.prenom || ""
    }`.trim() ||
    label(lang, "Personne sans nom", "Unnamed person");

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

function getDocPersonName(doc, persons = [], lang) {
  if (doc.person_name) return doc.person_name;
  if (doc.personName) return doc.personName;
  if (doc.full_name) return doc.full_name;
  if (doc.fullName) return doc.fullName;
  if (doc.person) return personLabel(doc.person, lang);

  const personId = getDocPersonId(doc);
  const found = persons.find((p) => String(p.id) === String(personId));

  return found ? personLabel(found, lang) : personId || "—";
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

function displayType(type, lang) {
  const value = normalizeType(type);

  if (value === "PASSPORT") return label(lang, "Passeport", "Passport");
  if (value === "CIN") return "CIN";
  if (value === "PERMIS") return label(lang, "Permis", "Driving licence");
  if (value === "AUTRE") return label(lang, "Autre", "Other");

  return type || "—";
}

export default function Documents() {
  const lang = useLang();

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

      setDocuments(
        normalizeList(response, [
          "documents",
          "identity_documents",
          "identityDocuments",
        ])
      );
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
        displayType(getDocType(doc), lang),
        getDocNumber(doc),
        getDocIssuedBy(doc),
        getDocIssueDate(doc),
        getDocExpiryDate(doc),
        getDocPersonId(doc),
        getDocPersonName(doc, persons, lang),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }, [documents, persons, q, lang]);

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
        personLabel(person, lang),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }, [persons, personSearch, lang]);

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
      foundPerson
        ? personLabel(foundPerson, lang)
        : getDocPersonName(doc, persons, lang)
    );

    setError("");
    setModal("edit");
  }

  async function save() {
    try {
      setSaving(true);
      setError("");

      if (!form.person_id) {
        setError(label(lang, "Veuillez sélectionner la personne concernée.", "Please select the concerned person."));
        return;
      }

      if (!form.type) {
        setError(label(lang, "Veuillez choisir le type de document.", "Please choose the document type."));
        return;
      }

      if (!form.number) {
        setError(label(lang, "Le numéro du document est obligatoire.", "The document number is required."));
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
          ? label(
              lang,
              "Module documents d’identité en attente du backend.",
              "Identity documents module is waiting for the backend."
            )
          : e?.message || t("documents.saveError")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Topbar title={t("documents.title")} />

      <div className="documents-page">
        <div className="documents-stats">
          <div className="document-stat-card">
            <div className="document-stat-icon">
              <FaIdCard />
            </div>

            <div>
              <h3>{t("documents.total")}</h3>
              <p>{loading ? "…" : ready ? number(filteredDocuments.length) : "—"}</p>
            </div>
          </div>
        </div>

        <div className="documents-table-box">
          <div className="documents-table-header">
            <div>
              <h3>{t("documents.title")}</h3>
              <span>
                {label(
                  lang,
                  "Type, numéro, personne, autorité, délivrance, expiration et validité",
                  "Type, number, person, authority, issue date, expiry date and validity"
                )}
              </span>
            </div>

            <div className="documents-header-actions">
              <button
                type="button"
                className="document-add-btn"
                onClick={loadDocuments}
              >
                <FaSyncAlt /> {t("common.refresh")}
              </button>

              <button
                type="button"
                className="document-add-btn"
                onClick={openCreate}
              >
                <FaPlus /> {t("common.add")}
              </button>
            </div>
          </div>

          <div className="documents-filters">
            <div className="documents-search-box">
              <FaSearch className="documents-search-icon" />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("documents.searchPlaceholder")}
              />
            </div>
          </div>

          {error && !modal && <div className="documents-error">{error}</div>}

          <div className="documents-table-responsive">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>{t("documents.type")}</th>
                  <th>{t("documents.number")}</th>
                  <th>{t("documents.person")}</th>
                  <th>{t("documents.authority")}</th>
                  <th>{t("documents.issueDate")}</th>
                  <th>{t("documents.expiryDate")}</th>
                  <th>{t("documents.validity")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="8" className="documents-empty">
                      {t("common.loading")}
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
                      {t("documents.notFound")}
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
                            {displayType(getDocType(doc), lang)}
                          </span>
                        </td>

                        <td>{getDocNumber(doc)}</td>

                        <td>{getDocPersonName(doc, persons, lang)}</td>

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
                              ? t("documents.invalid")
                              : validity === true
                              ? t("documents.valid")
                              : "—"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="document-icon-action"
                            onClick={() => openEdit(doc)}
                            title={t("common.edit")}
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
              {label(
                lang,
                `Affichage de ${ready ? filteredDocuments.length : "—"} document(s)`,
                `Showing ${ready ? filteredDocuments.length : "—"} document(s)`
              )}
            </span>
          </div>
        </div>
      </div>

      {modal && (
        <div className="documents-modal-overlay">
          <div className="documents-modal-box">
            <button
              type="button"
              className="documents-modal-close"
              onClick={() => setModal(null)}
            >
              <FaTimes />
            </button>

            <h3>
              {modal === "create" ? t("documents.add") : t("documents.edit")}
            </h3>

            {error && <div className="documents-error">{error}</div>}

            <div className="documents-form-grid">
              <PersonPicker
                label={label(lang, "Personne concernée", "Concerned person")}
                value={personSearch}
                onChange={(value) => {
                  setPersonSearch(value);
                  setForm({ ...form, person_id: "" });
                }}
                persons={filteredPersonsForPicker}
                selectedId={form.person_id}
                onSelect={(person) => {
                  setForm({ ...form, person_id: person.id });
                  setPersonSearch(personLabel(person, lang));
                }}
                lang={lang}
              />

              <div className="document-field">
                <label>{t("documents.type")}</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="CIN">CIN</option>
                  <option value="PASSPORT">
                    {label(lang, "Passeport", "Passport")}
                  </option>
                  <option value="PERMIS">
                    {label(lang, "Permis", "Driving licence")}
                  </option>
                  <option value="AUTRE">{label(lang, "Autre", "Other")}</option>
                </select>
              </div>

              <div className="document-field">
                <label>{t("documents.number")}</label>
                <input
                  value={form.number}
                  onChange={(e) =>
                    setForm({ ...form, number: e.target.value })
                  }
                  placeholder={t("documents.number")}
                />
              </div>

              <div className="document-field">
                <label>{t("documents.authority")}</label>
                <input
                  value={form.issued_by}
                  onChange={(e) =>
                    setForm({ ...form, issued_by: e.target.value })
                  }
                  placeholder={t("documents.authority")}
                />
              </div>

              <div className="document-field">
                <label>{t("documents.issueDate")}</label>
                <input
                  type="date"
                  value={form.issue_date}
                  onChange={(e) =>
                    setForm({ ...form, issue_date: e.target.value })
                  }
                />
              </div>

              <div className="document-field">
                <label>{t("documents.expiryDate")}</label>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) =>
                    setForm({ ...form, expiry_date: e.target.value })
                  }
                />
              </div>

              <div className="document-field">
                <label>{t("documents.validity")}</label>
                <select
                  value={String(form.is_valid)}
                  onChange={(e) =>
                    setForm({ ...form, is_valid: e.target.value === "true" })
                  }
                >
                  <option value="true">{t("documents.valid")}</option>
                  <option value="false">{t("documents.invalid")}</option>
                </select>
              </div>
            </div>

            <div className="documents-modal-actions">
              <button
                type="button"
                className="documents-cancel-btn"
                onClick={() => setModal(null)}
                disabled={saving}
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                className="documents-save-btn"
                onClick={save}
                disabled={saving}
              >
                <FaSave /> {saving ? t("common.loading") : t("common.save")}
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
  lang,
}) {
  return (
    <div className="document-picker">
      <label>{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label === "Concerned person" ? "Search by name or ID" : "Rechercher par nom ou CIN"}
      />

      {value && !selectedId && (
        <div className="document-picker-list">
          {persons.length === 0 && (
            <div className="document-picker-empty">
              {t("documents.noPerson")}
            </div>
          )}

          {persons.slice(0, 10).map((person) => (
            <button
              type="button"
              key={person.id}
              className="document-picker-item"
              onClick={() => onSelect(person)}
            >
              <strong>{personLabel(person, lang)}</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}