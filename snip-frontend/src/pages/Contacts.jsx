import "../styles/documents.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { contactsApi, personsApi } from "../services/api";
import { number, fullName, nationalId } from "../utils/format";
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
  type: "Téléphone",
  value: "",
  is_primary: false,
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

function getContactId(item) {
  return item.id || item.contact_id || "";
}

function getContactPersonId(item) {
  return item.person_id || item.personId || item.person?.id || "";
}

function getPersonName(item, persons = []) {
  if (item.person_name) return item.person_name;
  if (item.personName) return item.personName;
  if (item.full_name) return item.full_name;
  if (item.fullName) return item.fullName;
  if (item.person) return personLabel(item.person);

  const personId = getContactPersonId(item);
  const found = persons.find((p) => String(p.id) === String(personId));

  return found ? personLabel(found) : personId || "—";
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
        getPersonName(item, persons),
        getContactType(item),
        getContactValue(item),
        getContactPersonId(item),
        getContactId(item),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [contacts, persons, q]);

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
        personLabel(person),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [persons, personSearch]);

  function openCreate() {
    setForm(emptyForm);
    setPersonSearch("");
    setError("");
    setModal("create");
    loadPersons();
  }

  function openEdit(item) {
    const personId = getContactPersonId(item);
    const foundPerson = persons.find((p) => String(p.id) === String(personId));

    setForm({
      id: getContactId(item),
      person_id: personId,
      type: getContactType(item) === "—" ? "Téléphone" : getContactType(item),
      value: getContactValue(item) === "—" ? "" : getContactValue(item),
      is_primary: isPrimary(item),
    });

    setPersonSearch(foundPerson ? personLabel(foundPerson) : getPersonName(item, persons));
    setError("");
    setModal("edit");
  }

  async function save() {
    try {
      setSaving(true);
      setError("");

      if (!form.person_id) return setError("Veuillez sélectionner la personne concernée.");
      if (!form.type) return setError("Veuillez choisir le type de contact.");
      if (!form.value) return setError("La valeur du contact est obligatoire.");

      const payload = {
        person_id: form.person_id,
        type: form.type,
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
    } catch (e) {
      setError(
        e?.status === 404
          ? "Module contacts en attente du backend."
          : e?.message || "Erreur lors de l’enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeContact(item) {
    try {
      const id = getContactId(item);
      if (!id) return setError("Contact introuvable.");

      if (!window.confirm("Supprimer ce contact ?")) return;

      await contactsApi.remove(id);
      await loadContacts();
    } catch (e) {
      setError(
        e?.status === 404
          ? "Module contacts en attente du backend."
          : e?.message || "Erreur lors de la suppression."
      );
    }
  }

  return (
    <>
      <Topbar title="Contacts" />

      <div className="documents-page">
        <div className="documents-stats">
          <div className="document-stat-card">
            <div className="document-stat-icon">
              <FaPhoneAlt />
            </div>

            <div>
              <h3>Total contacts</h3>
              <p>{loading ? "…" : ready ? number(filteredContacts.length) : "—"}</p>
            </div>
          </div>
        </div>

        <div className="documents-table-box">
          <div className="documents-table-header">
            <div>
              <h3>Contacts</h3>
              <span>Téléphone, email et autres contacts liés aux personnes</span>
            </div>

            <div className="documents-header-actions">
              <button className="document-add-btn" onClick={loadContacts}>
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
                placeholder="Rechercher personne, type ou valeur..."
              />
            </div>
          </div>

          {error && !modal && <div className="documents-error">{error}</div>}

          <div className="documents-table-responsive">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Personne</th>
                  <th>Type</th>
                  <th>Valeur</th>
                  <th>Principal</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="5" className="documents-empty">Chargement...</td>
                  </tr>
                )}

                {!loading && !ready && (
                  <tr>
                    <td colSpan="5" className="documents-empty">—</td>
                  </tr>
                )}

                {!loading && ready && filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="documents-empty">—</td>
                  </tr>
                )}

                {!loading &&
                  ready &&
                  filteredContacts.map((item, index) => (
                    <tr key={getContactId(item) || index}>
                      <td>{getPersonName(item, persons)}</td>

                      <td>
                        <span className="document-type">{getContactType(item)}</span>
                      </td>

                      <td>{getContactValue(item)}</td>

                      <td>
                        <span className={isPrimary(item) ? "document-valid" : "document-unknown"}>
                          {isPrimary(item) ? "Oui" : "—"}
                        </span>
                      </td>

                      <td>
                        <div className="document-action-buttons">
                          <button
                            className="document-icon-action"
                            onClick={() => openEdit(item)}
                            title="Modifier"
                          >
                            <FaEdit />
                          </button>

                          <button
                            className="document-icon-action document-delete-btn"
                            onClick={() => removeContact(item)}
                            title="Supprimer"
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
            <span>Affichage de {ready ? filteredContacts.length : "—"} contact(s)</span>
          </div>
        </div>
      </div>

      {modal && (
        <div className="documents-modal-overlay">
          <div className="documents-modal-box">
            <button className="documents-modal-close" onClick={() => setModal(null)}>
              <FaTimes />
            </button>

            <h3>{modal === "create" ? "Ajouter un contact" : "Modifier contact"}</h3>

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
                <label>Type de contact</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="Téléphone">Téléphone</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="document-field">
                <label>Valeur</label>
                <input
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="Téléphone, email ou autre contact"
                />
              </div>

              <div className="document-field">
                <label>Contact principal</label>
                <select
                  value={String(form.is_primary)}
                  onChange={(e) =>
                    setForm({ ...form, is_primary: e.target.value === "true" })
                  }
                >
                  <option value="false">Non</option>
                  <option value="true">Oui</option>
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

function PersonPicker({ label, value, onChange, persons, selectedId, onSelect }) {
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
            <div className="document-picker-empty">Aucune personne trouvée</div>
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