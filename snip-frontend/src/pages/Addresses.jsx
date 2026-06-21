import "../styles/addresses.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { personsApi, addressesApi } from "../services/api";
import { fmtDate, number, fullName, nationalId } from "../utils/format";
import { t, tr, useLang } from "../i18n";
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

const addressTypeValues = [
  "home",
  "work",
  "current",
  "old",
  "temporary",
  "other",
];

const addressTypeLabels = {
  fr: {
    home: "Domicile",
    work: "Travail",
    current: "Actuelle",
    old: "Ancienne",
    temporary: "Temporaire",
    other: "Autre",
  },
  en: {
    home: "Home",
    work: "Work",
    current: "Current",
    old: "Old",
    temporary: "Temporary",
    other: "Other",
  },
};

function label(lang, fr, en) {
  return lang === "en" ? en : fr;
}

function normalizeAddressType(value) {
  const current = String(value || "").toLowerCase();

  if (current === "domicile" || current === "home") return "home";
  if (current === "travail" || current === "work") return "work";
  if (current === "actuelle" || current === "current") return "current";
  if (current === "ancienne" || current === "old") return "old";
  if (current === "temporaire" || current === "temporary") return "temporary";
  if (current === "autre" || current === "other") return "other";

  return value || "";
}

function displayAddressType(value, lang) {
  const key = normalizeAddressType(value);
  return addressTypeLabels[lang]?.[key] || addressTypeLabels.fr[key] || value || "—";
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

function normalizeAddress(item, lang) {
  return {
    id: item.id,
    person_id: item.person_id || item.personId || item.person?.id || "",
    person_name:
      item.person_name ||
      item.personName ||
      item.person?.full_name ||
      item.person?.fullName ||
      item.person?.name ||
      personLabel(item.person, lang),
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
  const lang = useLang();

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

  const addressTypes = useMemo(
    () =>
      addressTypeValues.map((value) => ({
        value,
        label: addressTypeLabels[lang]?.[value] || addressTypeLabels.fr[value],
      })),
    [lang]
  );

  const findPerson = (id) =>
    persons.find((person) => String(person.id) === String(id));

  const displayPerson = (id, fallback = "") => {
    const found = findPerson(id);
    if (found) return personLabel(found, lang);
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
      setAddresses(data.map((item) => normalizeAddress(item, lang)));
      setBackendReady(true);
    } catch {
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
        displayAddressType(item.type, lang),
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
  }, [addresses, q, persons, lang]);

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
        personLabel(person, lang),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [persons, personSearch, lang]);

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
      type: normalizeAddressType(item.type),
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
        setError(
          label(
            lang,
            "Le backend Adresses n’est pas encore disponible.",
            "The Addresses backend is not available yet."
          )
        );
        return;
      }

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
            "Veuillez choisir le type d’adresse.",
            "Please choose the address type."
          )
        );
        return;
      }

      if (!form.address) {
        setError(
          label(
            lang,
            "L’adresse complète est obligatoire.",
            "The full address is required."
          )
        );
        return;
      }

      const payload = {
        person_id: form.person_id,
        type: displayAddressType(form.type, "fr"),
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
    } catch (error) {
      setError(error.message || t("addresses.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(t("addresses.deleteConfirm"))) return;

    try {
      await addressesApi.remove(item.id);
      await load();
    } catch (error) {
      alert(error.message || t("addresses.deleteError"));
    }
  };

  return (
    <>
      <Topbar title={t("addresses.title")} />

      <div className="addresses-page">
        <div className="addresses-stats">
          <div className="address-stat-card">
            <div className="address-stat-icon">
              <FaMapMarkerAlt />
            </div>

            <div>
              <h3>{t("addresses.total")}</h3>
              <p>
                {loading
                  ? "…"
                  : backendReady
                  ? number(filteredAddresses.length)
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="addresses-table-box">
          <div className="addresses-table-header">
            <div>
              <h3>{t("addresses.list")}</h3>
              <span>
                {label(
                  lang,
                  "Adresses rattachées aux personnes selon le modèle UML",
                  "Addresses linked to persons according to the UML model"
                )}
              </span>
            </div>

            <button type="button" className="address-add-btn" onClick={openCreate}>
              <FaPlus /> {t("common.add")}
            </button>
          </div>

          <div className="addresses-filters">
            <div className="addresses-search-box">
              <FaSearch className="addresses-search-icon" />

              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={t("addresses.searchPlaceholder")}
              />
            </div>
          </div>

          {error && !modal && <div className="addresses-error">{error}</div>}

          <div className="addresses-table-responsive">
            <table className="addresses-table">
              <thead>
                <tr>
                  <th>{t("addresses.person")}</th>
                  <th>{t("addresses.type")}</th>
                  <th>{t("addresses.address")}</th>
                  <th>{t("addresses.city")}</th>
                  <th>{t("addresses.region")}</th>
                  <th>{t("addresses.country")}</th>
                  <th>{t("relationships.startDate")}</th>
                  <th>{t("relationships.endDate")}</th>
                  <th>{t("common.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="9" className="addresses-empty">
                      {t("common.loading")}
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
                      {t("addresses.notFound")}
                    </td>
                  </tr>
                )}

                {!loading &&
                  backendReady &&
                  filteredAddresses.map((item) => (
                    <tr key={item.id}>
                      <td>{displayPerson(item.person_id, item.person_name)}</td>

                      <td>
                        <span className="address-type">
                          {displayAddressType(item.type, lang)}
                        </span>
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
                            type="button"
                            className="address-icon-action address-edit-btn"
                            onClick={() => openEdit(item)}
                            title={t("common.edit")}
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="address-icon-action address-delete-btn"
                            onClick={() => remove(item)}
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

          <div className="addresses-pagination">
            <span>
              {tr("addresses.display", {
                shown: backendReady ? filteredAddresses.length : "—",
                total: backendReady ? filteredAddresses.length : "—",
              })}
            </span>
          </div>
        </div>
      </div>

      {modal && (
        <div className="addresses-modal-overlay">
          <div className="addresses-modal-box">
            <button
              type="button"
              className="addresses-modal-close"
              onClick={() => setModal(null)}
            >
              <FaTimes />
            </button>

            <h3>{modal === "create" ? t("addresses.add") : t("addresses.edit")}</h3>

            {error && <div className="addresses-error">{error}</div>}

            <div className="addresses-form-grid">
              <div className="address-field person-autocomplete">
                <label>{label(lang, "Personne concernée", "Concerned person")}</label>

                <input
                  value={personSearch}
                  onChange={(event) => {
                    setPersonSearch(event.target.value);
                    setForm({ ...form, person_id: "" });
                  }}
                  placeholder={
                    personsLoading
                      ? label(
                          lang,
                          "Chargement des personnes...",
                          "Loading persons..."
                        )
                      : t("relationships.searchPerson")
                  }
                />

                {personSearch && !form.person_id && (
                  <div className="person-suggestions">
                    {filteredPersons.length === 0 && (
                      <div className="person-suggestion-empty">
                        {t("relationships.noPerson")}
                      </div>
                    )}

                    {filteredPersons.slice(0, 10).map((person) => (
                      <button
                        type="button"
                        key={person.id}
                        onClick={() => {
                          setForm({ ...form, person_id: person.id });
                          setPersonSearch(personLabel(person, lang));
                        }}
                      >
                        {personLabel(person, lang)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="address-field">
                <label>{t("addresses.type")}</label>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value })
                  }
                >
                  <option value="">{t("relationships.allTypes")}</option>

                  {addressTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="address-field address-wide">
                <label>{t("addresses.address")}</label>
                <input
                  value={form.address}
                  onChange={(event) =>
                    setForm({ ...form, address: event.target.value })
                  }
                  placeholder={t("addresses.address")}
                />
              </div>

              <div className="address-field">
                <label>{t("addresses.city")}</label>
                <input
                  value={form.city}
                  onChange={(event) =>
                    setForm({ ...form, city: event.target.value })
                  }
                  placeholder={t("addresses.city")}
                />
              </div>

              <div className="address-field">
                <label>{t("addresses.region")}</label>
                <input
                  value={form.region}
                  onChange={(event) =>
                    setForm({ ...form, region: event.target.value })
                  }
                  placeholder={t("addresses.region")}
                />
              </div>

              <div className="address-field">
                <label>{t("addresses.country")}</label>
                <input
                  value={form.country}
                  onChange={(event) =>
                    setForm({ ...form, country: event.target.value })
                  }
                  placeholder={t("addresses.country")}
                />
              </div>

              <div className="address-field">
                <label>{t("relationships.startDate")}</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(event) =>
                    setForm({ ...form, start_date: event.target.value })
                  }
                />
              </div>

              <div className="address-field">
                <label>{t("relationships.endDate")}</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(event) =>
                    setForm({ ...form, end_date: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="addresses-modal-actions">
              <button
                type="button"
                className="addresses-cancel-btn"
                onClick={() => setModal(null)}
                disabled={saving}
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                className="addresses-save-btn"
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