import "../styles/documents.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { contactsApi, personsApi } from "../services/api";
import { number, fullName, nationalId } from "../utils/format";
import { t, tr, useLang } from "../i18n";
import {
  FaPhoneAlt,
  FaSearch,
  FaSyncAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
} from "react-icons/fa";

const emptyForm = {
  id: "",
  person_id: "",
  type: "phone",
  value: "",
  is_primary: false,
};

const contactTypeValues = ["phone", "email", "whatsapp", "other"];

const contactTypeLabels = {
  fr: {
    phone: "Téléphone",
    email: "Email",
    whatsapp: "WhatsApp",
    other: "Autre",
  },
  en: {
    phone: "Phone",
    email: "Email",
    whatsapp: "WhatsApp",
    other: "Other",
  },
};

function label(lang, fr, en) {
  return lang === "en" ? en : fr;
}

function normalizeContactType(value) {
  const current = String(value || "").toLowerCase();

  if (current === "téléphone" || current === "telephone" || current === "phone") {
    return "phone";
  }

  if (current === "email") return "email";
  if (current === "whatsapp") return "whatsapp";
  if (current === "autre" || current === "other") return "other";

  return value || "phone";
}

function displayContactType(value, lang) {
  const key = normalizeContactType(value);
  return contactTypeLabels[lang]?.[key] || contactTypeLabels.fr[key] || value || "—";
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

function getContactId(item) {
  return item.id || item.contact_id || "";
}

function getContactPersonId(item) {
  return item.person_id || item.personId || item.person?.id || "";
}

function getPersonName(item, persons = [], lang) {
  if (item.person_name) return item.person_name;
  if (item.personName) return item.personName;
  if (item.full_name) return item.full_name;
  if (item.fullName) return item.fullName;
  if (item.person) return personLabel(item.person, lang);

  const personId = getContactPersonId(item);
  const found = persons.find((person) => String(person.id) === String(personId));

  return found ? personLabel(found, lang) : personId || "—";
}

function getContactType(item) {
  return item.type || item.contact_type || item.contactType || "—";
}

function getContactValue(item) {
  return item.value || item.phone || item.telephone || item.email || "—";
}

function isPrimary(item) {
  return item.is_primary === true || item.isPrimary === true;
}

export default function Contacts() {
  const lang = useLang();

  const [contacts, setContacts] = useState([]);
  const [persons, setPersons] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [personSearch, setPersonSearch] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const contactTypes = useMemo(
    () =>
      contactTypeValues.map((value) => ({
        value,
        label: contactTypeLabels[lang]?.[value] || contactTypeLabels.fr[value],
      })),
    [lang]
  );

  async function loadContacts() {
    try {
      setLoading(true);
      setReady(true);
      setError("");

      const response = await contactsApi.list({ page: 1, limit: 200 });
      setContacts(normalizeList(response, ["contacts"]));
    } catch {
      setContacts([]);
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
    loadContacts();
    loadPersons();
  }, []);

  const filteredContacts = useMemo(() => {
    const keyword = String(q || "").toLowerCase().trim();

    if (!keyword) return contacts;

    return contacts.filter((item) =>
      [
        getPersonName(item, persons, lang),
        getContactType(item),
        displayContactType(getContactType(item), lang),
        getContactValue(item),
        getContactPersonId(item),
        getContactId(item),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [contacts, persons, q, lang]);

  const filteredPersonsForPicker = useMemo(() => {
    const keyword = String(personSearch || "").toLowerCase().trim();

    if (!keyword) return persons;

    return persons.filter((person) =>
      [
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
        .toLowerCase()
        .includes(keyword)
    );
  }, [persons, personSearch, lang]);

  function openCreate() {
    setForm(emptyForm);
    setPersonSearch("");
    setError("");
    setModal("create");
    loadPersons();
  }

  function openEdit(item) {
    const personId = getContactPersonId(item);
    const foundPerson = persons.find((person) => String(person.id) === String(personId));

    setForm({
      id: getContactId(item),
      person_id: personId,
      type: normalizeContactType(getContactType(item)),
      value: getContactValue(item) === "—" ? "" : getContactValue(item),
      is_primary: isPrimary(item),
    });

    setPersonSearch(
      foundPerson
        ? personLabel(foundPerson, lang)
        : getPersonName(item, persons, lang)
    );
    setError("");
    setModal("edit");
  }

  async function save() {
    try {
      setSaving(true);
      setError("");

      if (!form.person_id) {
        setError(
          label(
            lang,
            "Veuillez sélectionner la personne concernée.",
            "Please select the concerned person."
          )
        );
        return;
      }

      if (!form.type) {
        setError(
          label(
            lang,
            "Veuillez choisir le type de contact.",
            "Please choose the contact type."
          )
        );
        return;
      }

      if (!form.value) {
        setError(
          label(
            lang,
            "La valeur du contact est obligatoire.",
            "The contact value is required."
          )
        );
        return;
      }

      const payload = {
        person_id: form.person_id,
        type: displayContactType(form.type, "fr"),
        value: form.value,
        is_primary: form.is_primary,
      };

      if (modal === "edit" && form.id) {
        await contactsApi.update(form.id, payload);
      } else {
        await contactsApi.create(payload);
      }

      setModal(null);
      setForm(emptyForm);
      setPersonSearch("");
      await loadContacts();
    } catch (error) {
      setError(
        error?.status === 404
          ? label(
              lang,
              "Module contacts en attente du backend.",
              "Contacts module is waiting for the backend."
            )
          : error?.message || t("contacts.saveError")
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeContact(item) {
    try {
      const id = getContactId(item);

      if (!id) {
        setError(label(lang, "Contact introuvable.", "Contact not found."));
        return;
      }

      if (!window.confirm(t("contacts.deleteConfirm"))) return;

      await contactsApi.remove(id);
      await loadContacts();
    } catch (error) {
      setError(
        error?.status === 404
          ? label(
              lang,
              "Module contacts en attente du backend.",
              "Contacts module is waiting for the backend."
            )
          : error?.message || t("contacts.deleteError")
      );
    }
  }

  return (
    <>
      <Topbar title={t("contacts.title")} />

      <div className="documents-page">
        <div className="documents-stats">
          <div className="document-stat-card">
            <div className="document-stat-icon">
              <FaPhoneAlt />
            </div>

            <div>
              <h3>{t("contacts.total")}</h3>
              <p>{loading ? "…" : ready ? number(filteredContacts.length) : "—"}</p>
            </div>
          </div>
        </div>

        <div className="documents-table-box">
          <div className="documents-table-header">
            <div>
              <h3>{t("contacts.list")}</h3>
              <span>
                {label(
                  lang,
                  "Téléphone, email et autres contacts liés aux personnes",
                  "Phone, email and other contacts linked to persons"
                )}
              </span>
            </div>

            <div className="documents-header-actions">
              <button type="button" className="document-add-btn" onClick={loadContacts}>
                <FaSyncAlt /> {t("common.refresh")}
              </button>

              <button type="button" className="document-add-btn" onClick={openCreate}>
                <FaPlus /> {t("common.add")}
              </button>
            </div>
          </div>

          <div className="documents-filters">
            <div className="documents-search-box">
              <FaSearch className="documents-search-icon" />

              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={t("contacts.searchPlaceholder")}
              />
            </div>
          </div>

          {error && !modal && <div className="documents-error">{error}</div>}

          <div className="documents-table-responsive">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>{t("contacts.person")}</th>
                  <th>{t("contacts.type")}</th>
                  <th>{t("contacts.value")}</th>
                  <th>{label(lang, "Principal", "Primary")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="5" className="documents-empty">
                      {t("common.loading")}
                    </td>
                  </tr>
                )}

                {!loading && !ready && (
                  <tr>
                    <td colSpan="5" className="documents-empty">
                      —
                    </td>
                  </tr>
                )}

                {!loading && ready && filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="documents-empty">
                      {t("contacts.notFound")}
                    </td>
                  </tr>
                )}

                {!loading &&
                  ready &&
                  filteredContacts.map((item, index) => (
                    <tr key={getContactId(item) || index}>
                      <td>{getPersonName(item, persons, lang)}</td>

                      <td>
                        <span className="document-type">
                          {displayContactType(getContactType(item), lang)}
                        </span>
                      </td>

                      <td>{getContactValue(item)}</td>

                      <td>
                        <span
                          className={
                            isPrimary(item) ? "document-valid" : "document-unknown"
                          }
                        >
                          {isPrimary(item) ? t("common.yes") : "—"}
                        </span>
                      </td>

                      <td>
                        <div className="document-action-buttons">
                          <button
                            type="button"
                            className="document-icon-action"
                            onClick={() => openEdit(item)}
                            title={t("common.edit")}
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="document-icon-action document-delete-btn"
                            onClick={() => removeContact(item)}
                            title={t("common.delete")}
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

          <div className="documents-pagination">
            <span>
              {tr("contacts.display", {
                shown: ready ? filteredContacts.length : "—",
                total: ready ? filteredContacts.length : "—",
              })}
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

            <h3>{modal === "create" ? t("contacts.add") : t("contacts.edit")}</h3>

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
                <label>{t("contacts.type")}</label>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value })
                  }
                >
                  {contactTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="document-field">
                <label>{t("contacts.value")}</label>
                <input
                  value={form.value}
                  onChange={(event) =>
                    setForm({ ...form, value: event.target.value })
                  }
                  placeholder={label(
                    lang,
                    "Téléphone, email ou autre contact",
                    "Phone, email or other contact"
                  )}
                />
              </div>

              <div className="document-field">
                <label>{label(lang, "Contact principal", "Primary contact")}</label>
                <select
                  value={String(form.is_primary)}
                  onChange={(event) =>
                    setForm({ ...form, is_primary: event.target.value === "true" })
                  }
                >
                  <option value="false">{t("common.no")}</option>
                  <option value="true">{t("common.yes")}</option>
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

function PersonPicker({ label, value, onChange, persons, selectedId, onSelect, lang }) {
  return (
    <div className="document-picker">
      <label>{label}</label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label === "Concerned person" ? "Search by name or ID" : "Rechercher par nom ou CIN"}
      />

      {value && !selectedId && (
        <div className="document-picker-list">
          {persons.length === 0 && (
            <div className="document-picker-empty">
              {t("relationships.noPerson")}
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