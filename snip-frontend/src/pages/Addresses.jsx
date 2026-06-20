import "../styles/addresses.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { personsApi, addressesApi } from "../services/api";
import { fmtDate, number, fullName, nationalId } from "../utils/format";
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
  "Domicile",
  "Travail",
  "Actuelle",
  "Ancienne",
  "Temporaire",
  "Autre",
];

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

function normalizeAddress(item) {
  return {
    id: item.id,
    person_id: item.person_id || item.personId || item.person?.id || "",
    person_name:
      item.person_name ||
      item.personName ||
      item.person?.full_name ||
      item.person?.fullName ||
      item.person?.name ||
      personLabel(item.person),
    type: item.type || item.address_type || item.addressType || "",
    address: item.address || item.full_address || item.fullAddress || "",
    city: item.city || "",
    region: item.region || "",
    country: item.country || "",
    start_date: item.start_date || item.startDate || "",
    end_date: item.end_date || item.endDate || "",
  };
}

export default function Addresses() {
  const [persons, setPersons] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [personSearch, setPersonSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [personsLoading, setPersonsLoading] = useState(false);
  const [backendReady, setBackendReady] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const findPerson = (id) =>
    persons.find((person) => String(person.id) === String(id));

  const displayPerson = (id, fallback = "") => {
    const found = findPerson(id);
    if (found) return personLabel(found);
    return fallback || "—";
  };

  const loadPersons = async () => {
    try {
      setPersonsLoading(true);

      const response = await personsApi.list();
      const data = normalizeList(response, ["persons"]);

      setPersons(data);
      return data;
    } catch {
      setPersons([]);
      return [];
    } finally {
      setPersonsLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await addressesApi.list({
        page: 1,
        limit: 100,
      });

      const data = normalizeList(response, ["addresses"]);
      setAddresses(data.map(normalizeAddress));
      setBackendReady(true);
    } catch (e) {
      setAddresses([]);
      setBackendReady(false);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([loadPersons(), loadAddresses()]);
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
        item.person_id,
        item.person_name,
        displayPerson(item.person_id, item.person_name),
        item.type,
        item.address,
        item.city,
        item.region,
        item.country,
        item.start_date,
        item.end_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }, [addresses, q, persons]);

  const filteredPersons = useMemo(() => {
    const keyword = String(personSearch || "").toLowerCase().trim();

    if (!keyword) return persons;

    return persons.filter((person) =>
      [
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
        personLabel(person),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [persons, personSearch]);

  const openCreate = () => {
    setForm(emptyForm);
    setPersonSearch("");
    setError("");
    setModal("create");
    loadPersons();
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
      setForm(emptyForm);
      setPersonSearch("");
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
              <p>
                {loading ? "…" : backendReady ? number(filteredAddresses.length) : "—"}
              </p>
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

            <h3>{modal === "create" ? "Ajouter une adresse" : "Modifier adresse"}</h3>

            {error && <div className="addresses-error">{error}</div>}

            <div className="addresses-form-grid">
              <div className="address-field person-autocomplete">
                <label>Personne concernée</label>

                <input
                  value={personSearch}
                  onChange={(e) => {
                    setPersonSearch(e.target.value);
                    setForm({ ...form, person_id: "" });
                  }}
                  placeholder={
                    personsLoading
                      ? "Chargement des personnes..."
                      : "Rechercher par nom ou CIN"
                  }
                />

                {personSearch && !form.person_id && (
                  <div className="person-suggestions">
                    {filteredPersons.length === 0 && (
                      <div className="person-suggestion-empty">
                        Aucune personne trouvée
                      </div>
                    )}

                    {filteredPersons.slice(0, 10).map((person) => (
                      <button
                        type="button"
                        key={person.id}
                        onClick={() => {
                          setForm({ ...form, person_id: person.id });
                          setPersonSearch(personLabel(person));
                        }}
                      >
                        {personLabel(person)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="address-field">
                <label>Type d’adresse</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="">Choisir un type</option>
                  {addressTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="address-field address-wide">
                <label>Adresse complète</label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Adresse complète"
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