import "../styles/addresses.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { personsApi, addressesApi } from "../services/api";
import { fmtDate, number } from "../utils/format";
import {
  FaMapMarkerAlt,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
} from "react-icons/fa";

const emptyForm = {
  person_id: "",
  type: "",
  address: "",
  city: "",
  region: "",
  country: "Madagascar",
  start_date: "",
  end_date: "",
};

const addressTypes = [
  { value: "Domicile", label: "Domicile" },
  { value: "Travail", label: "Travail" },
  { value: "Actuelle", label: "Actuelle" },
  { value: "Ancienne", label: "Ancienne" },
  { value: "Temporaire", label: "Temporaire" },
  { value: "Autre", label: "Autre" },
];

export default function Addresses() {
  const [persons, setPersons] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [personSearch, setPersonSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const personName = (person) =>
    `${person.last_name || person.nom || ""} ${
      person.first_name || person.prenom || ""
    }`.trim() ||
    person.full_name ||
    person.name ||
    "Personne sans nom";

  const getPerson = (id) =>
    persons.find((person) => String(person.id) === String(id));

  const displayPerson = (id, fallback = "") => {
    const person = getPerson(id);
    if (person) return personName(person);
    return fallback || "—";
  };

  const normalizeAddress = (item) => ({
    id: item.id,
    person_id: item.person_id || item.personId || item.person?.id || "",
    person_name:
      item.person_name ||
      item.personName ||
      item.person?.full_name ||
      item.person?.name ||
      `${item.person?.last_name || ""} ${item.person?.first_name || ""}`.trim(),
    type: item.type || item.address_type || item.addressType || "",
    address: item.address || item.full_address || "",
    city: item.city || "",
    region: item.region || "",
    country: item.country || "",
    start_date: item.start_date || item.startDate || null,
    end_date: item.end_date || item.endDate || null,
    raw: item,
  });

  const loadPersons = async () => {
    try {
      const response = await personsApi.list({
        page: 1,
        limit: 100,
      });

      const data = response?.data || [];
      setPersons(data);
      return data;
    } catch {
      setPersons([]);
      return [];
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await addressesApi.list({
        page: 1,
        limit: 100,
      });

      const data = response?.data || [];
      setAddresses(data.map(normalizeAddress));
      setBackendReady(true);
      return data;
    } catch (e) {
      if (e.status === 404) {
        setAddresses([]);
        setBackendReady(false);
        return [];
      }

      setAddresses([]);
      throw e;
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([loadPersons(), loadAddresses()]);
    } catch (e) {
      setError(e.message || "Erreur lors du chargement des adresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredAddresses = useMemo(() => {
    const keyword = String(q || "").toLowerCase().trim();

    if (!keyword) return addresses;

    return addresses.filter((item) => {
      const values = [
        item.id,
        item.person_id,
        item.person_name,
        item.type,
        item.address,
        item.city,
        item.region,
        item.country,
        item.start_date,
        item.end_date,
        displayPerson(item.person_id, item.person_name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }, [addresses, q, persons]);

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

  const openEdit = (item) => {
    setForm({
      person_id: item.person_id || "",
      type: item.type || "",
      address: item.address || "",
      city: item.city || "",
      region: item.region || "",
      country: item.country || "Madagascar",
      start_date: item.start_date ? String(item.start_date).slice(0, 10) : "",
      end_date: item.end_date ? String(item.end_date).slice(0, 10) : "",
    });

    setPersonSearch(displayPerson(item.person_id, item.person_name));
    setError("");
    setModal(item.id);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");

      if (!backendReady) {
        setError("Le backend Adresses n’est pas encore disponible.");
        return;
      }

      if (!form.person_id) {
        setError("Veuillez sélectionner la personne concernée.");
        return;
      }

      if (!form.type) {
        setError("Veuillez choisir le type d’adresse.");
        return;
      }

      if (!form.address) {
        setError("L’adresse complète est obligatoire.");
        return;
      }

      const payload = {
        person_id: form.person_id,
        type: form.type,
        address: form.address,
        city: form.city || null,
        region: form.region || null,
        country: form.country || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };

      if (modal === "create") {
        await addressesApi.create(payload);
      } else {
        await addressesApi.update(modal, payload);
      }

      setModal(null);
      await load();
    } catch (e) {
      setError(e.message || "Erreur lors de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm("Supprimer cette adresse ?")) return;

    try {
      await addressesApi.remove(item.id);
      await load();
    } catch (e) {
      alert(e.message || "Suppression impossible.");
    }
  };

  return (
    <>
      <Topbar title="Gestion des adresses" />

      <div className="addresses-page">
        <div className="addresses-stats">
          <div className="address-stat-card">
            <div className="address-stat-icon">
              <FaMapMarkerAlt />
            </div>

            <div>
              <h3>Total adresses</h3>
              <p>{loading ? "…" : backendReady ? number(filteredAddresses.length) : "—"}</p>
            </div>
          </div>
        </div>

        <div className="addresses-table-box">
          <div className="addresses-table-header">
            <div>
              <h3>Adresses</h3>
              <span>Adresses rattachées aux personnes selon le modèle UML</span>
            </div>

            <button className="address-add-btn" onClick={openCreate}>
              <FaPlus /> Ajouter
            </button>
          </div>

          <div className="addresses-filters">
            <div className="addresses-search-box">
              <FaSearch className="addresses-search-icon" />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher personne, adresse, ville, région..."
              />
            </div>
          </div>

          {error && !modal && <div className="addresses-error">{error}</div>}

          <div className="addresses-table-responsive">
            <table className="addresses-table">
              <thead>
                <tr>
                  <th>Personne</th>
                  <th>Type</th>
                  <th>Adresse</th>
                  <th>Ville</th>
                  <th>Région</th>
                  <th>Pays</th>
                  <th>Date début</th>
                  <th>Date fin</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="9" className="addresses-empty">
                      Chargement...
                    </td>
                  </tr>
                )}

                {!loading && !backendReady && (
                  <tr>
                    <td colSpan="9" className="addresses-empty">
                      —
                    </td>
                  </tr>
                )}

                {!loading && backendReady && filteredAddresses.length === 0 && (
                  <tr>
                    <td colSpan="9" className="addresses-empty">
                      Aucune adresse trouvée
                    </td>
                  </tr>
                )}

                {!loading &&
                  backendReady &&
                  filteredAddresses.map((item) => (
                    <tr key={item.id}>
                      <td>{displayPerson(item.person_id, item.person_name)}</td>

                      <td>
                        <span className="address-type">{item.type || "—"}</span>
                      </td>

                      <td className="address-text">{item.address || "—"}</td>

                      <td>{item.city || "—"}</td>

                      <td>{item.region || "—"}</td>

                      <td>{item.country || "—"}</td>

                      <td>{item.start_date ? fmtDate(item.start_date) : "—"}</td>

                      <td>{item.end_date ? fmtDate(item.end_date) : "—"}</td>

                      <td>
                        <div className="address-action-buttons">
                          <button
                            className="address-icon-action address-edit-btn"
                            onClick={() => openEdit(item)}
                            title="Modifier"
                          >
                            <FaEdit />
                          </button>

                          <button
                            className="address-icon-action address-delete-btn"
                            onClick={() => remove(item)}
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

          <div className="addresses-pagination">
            <span>
              Affichage de {backendReady ? filteredAddresses.length : "—"} adresse(s)
            </span>
          </div>
        </div>
      </div>

      {modal && (
        <div className="addresses-modal-overlay">
          <div className="addresses-modal-box">
            <button
              className="addresses-modal-close"
              onClick={() => setModal(null)}
            >
              <FaTimes />
            </button>

            <h3>{modal === "create" ? "Ajouter une adresse" : "Modifier l’adresse"}</h3>

            {error && <div className="addresses-error">{error}</div>}

            <div className="addresses-form-grid">
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

              <div className="address-field">
                <label>Type d’adresse</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="">Sélectionner un type</option>

                  {addressTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="address-field address-field-wide">
                <label>Adresse complète</label>
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Lot, rue, quartier, bâtiment..."
                />
              </div>

              <div className="address-field">
                <label>Ville</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Ville"
                />
              </div>

              <div className="address-field">
                <label>Région</label>
                <input
                  value={form.region}
                  onChange={(e) =>
                    setForm({ ...form, region: e.target.value })
                  }
                  placeholder="Région"
                />
              </div>

              <div className="address-field">
                <label>Pays</label>
                <input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  placeholder="Pays"
                />
              </div>

              <div className="address-field">
                <label>Date début</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                />
              </div>

              <div className="address-field">
                <label>Date fin</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="addresses-modal-actions">
              <button
                className="addresses-cancel-btn"
                onClick={() => setModal(null)}
                disabled={saving}
              >
                Annuler
              </button>

              <button
                className="addresses-save-btn"
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
    <div className="address-picker">
      <label>{label}</label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher une personne"
      />

      <div className="address-picker-list">
        {persons.length === 0 && (
          <div className="address-picker-empty">Aucune personne trouvée</div>
        )}

        {persons.slice(0, 8).map((person) => (
          <button
            type="button"
            key={person.id}
            className={
              selectedId === person.id
                ? "address-picker-item active"
                : "address-picker-item"
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