import "../styles/events.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { eventsApi, personsApi } from "../services/api";
import { fmtDate, number, fullName, nationalId } from "../utils/format";
import { t, tr, useLang } from "../i18n";
import {
  FaCalendarAlt,
  FaSearch,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaTimes,
} from "react-icons/fa";

const empty = {
  person_id: "",
  event_type: "",
  title: "",
  description: "",
  event_date: "",
  source: "",
};

const eventTypeValues = ["birth", "marriage", "divorce", "death", "other"];

const eventTypeLabels = {
  fr: {
    birth: "Naissance",
    marriage: "Mariage",
    divorce: "Divorce",
    death: "Décès",
    other: "Autre",
  },
  en: {
    birth: "Birth",
    marriage: "Marriage",
    divorce: "Divorce",
    death: "Death",
    other: "Other",
  },
};

function label(lang, fr, en) {
  return lang === "en" ? en : fr;
}

function normalizeEventType(value) {
  const current = String(value || "").toLowerCase();

  if (current === "naissance" || current === "birth") return "birth";
  if (current === "mariage" || current === "marriage") return "marriage";
  if (current === "divorce") return "divorce";
  if (current === "décès" || current === "deces" || current === "death") {
    return "death";
  }
  if (current === "autre" || current === "other") return "other";

  return value || "";
}

function denormalizeEventType(value, lang) {
  const key = normalizeEventType(value);
  return eventTypeLabels[lang]?.[key] || eventTypeLabels.fr[key] || value || "—";
}

function normalizeEvents(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.events)) return res.events;
  if (Array.isArray(res?.results)) return res.results;
  if (Array.isArray(res?.data?.events)) return res.data.events;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function normalizePersons(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.persons)) return res.persons;
  if (Array.isArray(res?.results)) return res.results;
  if (Array.isArray(res?.data?.persons)) return res.data.persons;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

export default function Events() {
  const lang = useLang();

  const [events, setEvents] = useState([]);
  const [persons, setPersons] = useState([]);
  const [personSearch, setPersonSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [modal, setModal] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [personsLoading, setPersonsLoading] = useState(false);
  const [error, setError] = useState("");

  const eventTypes = useMemo(
    () =>
      eventTypeValues.map((value) => ({
        value,
        label: eventTypeLabels[lang]?.[value] || eventTypeLabels.fr[value],
      })),
    [lang]
  );

  const personLabel = (person) => {
    if (!person) return "—";

    const name =
      fullName(person) ||
      person.full_name ||
      person.name ||
      `${person.first_name || ""} ${person.last_name || ""}`.trim() ||
      label(lang, "Sans nom", "Unnamed");

    const cin =
      nationalId(person) ||
      person.cin ||
      person.national_id ||
      person.nationalId ||
      "";

    return cin ? `${name} — ${cin}` : name;
  };

  const findPersonLabel = (personId) => {
    const found = persons.find((person) => String(person.id) === String(personId));
    return found ? personLabel(found) : personId || "—";
  };

  const filteredPersons = persons.filter((person) =>
    personLabel(person).toLowerCase().includes(personSearch.toLowerCase())
  );

  const matchFrontend = (item, keyword, selectedType) => {
    const typeValue = normalizeEventType(item.event_type || item.type || "");

    const values = [
      item.id,
      item.person_id,
      item.person_name,
      item.person,
      item.event_type,
      item.type,
      denormalizeEventType(typeValue, lang),
      item.title,
      item.description,
      item.source,
      item.event_date,
      item.date,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchKeyword = keyword
      ? values.includes(keyword.toLowerCase())
      : true;

    const matchType = selectedType ? typeValue === selectedType : true;

    return matchKeyword && matchType;
  };

  const loadPersons = async () => {
    try {
      setPersonsLoading(true);

      let res;

      try {
        res = await personsApi.list({ page: 1, limit: 500 });
      } catch {
        res = await personsApi.list();
      }

      setPersons(normalizePersons(res));
    } catch {
      setPersons([]);
    } finally {
      setPersonsLoading(false);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await eventsApi.list({});
      const data = normalizeEvents(res);
      const filtered = data.filter((item) => matchFrontend(item, q, type));

      setEvents(filtered);
      setTotal(data.length);
    } catch {
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadPersons();
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 350);
    return () => clearTimeout(timer);
  }, [q, type, lang]);

  const openCreate = () => {
    setForm(empty);
    setPersonSearch("");
    setModal("create");
    setError("");
  };

  const openEdit = (item) => {
    const currentPersonLabel =
      item.person_name || item.person || findPersonLabel(item.person_id);

    setForm({
      ...empty,
      ...item,
      person_id: item.person_id || "",
      event_type: normalizeEventType(item.event_type || item.type || ""),
      title: item.title || "",
      event_date: item.event_date
        ? String(item.event_date).slice(0, 16)
        : item.date
        ? String(item.date).slice(0, 16)
        : "",
      source: item.source || "",
      description: item.description || "",
    });

    setPersonSearch(currentPersonLabel);
    setModal(item.id);
    setError("");
  };

  const save = async () => {
    try {
      setError("");

      if (!form.person_id) {
        setError(label(lang, "Veuillez choisir une personne.", "Please choose a person."));
        return;
      }

      if (!form.event_type) {
        setError(label(lang, "Type d'évènement obligatoire.", "Event type is required."));
        return;
      }

      if (!form.title) {
        setError(label(lang, "Titre obligatoire.", "Title is required."));
        return;
      }

      if (!form.event_date) {
        setError(label(lang, "Date de l'évènement obligatoire.", "Event date is required."));
        return;
      }

      const payload = {
        person_id: form.person_id,
        event_type: denormalizeEventType(form.event_type, "fr"),
        title: form.title,
        description: form.description,
        event_date: form.event_date,
        source: form.source,
      };

      if (modal === "create") {
        await eventsApi.create(payload);
      } else {
        await eventsApi.update(modal, payload);
      }

      setModal(null);
      setForm(empty);
      setPersonSearch("");
      setQ("");
      setType("");
      await load();
    } catch (error) {
      setError(error.message || t("events.saveError"));
    }
  };

  const remove = async (item) => {
    if (!window.confirm(t("events.deleteConfirm"))) return;

    try {
      await eventsApi.remove(item.id);
      await load();
    } catch (error) {
      alert(error.message || t("events.deleteError"));
    }
  };

  const displayedTotal = useMemo(() => {
    return q || type ? events.length : total;
  }, [q, type, events.length, total]);

  return (
    <>
      <Topbar title={t("events.title")} />

      <div className="events-page">
        <div className="events-stats">
          <div className="event-stat-card">
            <div className="event-stat-icon">
              <FaCalendarAlt />
            </div>

            <div>
              <h3>{t("events.total")}</h3>
              <p>{loading ? "…" : number(displayedTotal || 0)}</p>
            </div>
          </div>
        </div>

        <div className="events-table-box">
          <div className="events-table-header">
            <div>
              <h3>{t("events.list")}</h3>
              <span>
                {label(
                  lang,
                  "Historique des faits liés aux personnes",
                  "History of facts related to persons"
                )}
              </span>
            </div>

            <button type="button" className="event-add-btn" onClick={openCreate}>
              <FaPlus /> {t("common.add")}
            </button>
          </div>

          <div className="events-filters">
            <div className="events-search-box">
              <FaSearch className="events-search-icon" />

              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={t("events.searchPlaceholder")}
              />
            </div>

            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="">{t("events.allTypes")}</option>

              {eventTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="events-table-responsive">
            <table className="events-table">
              <thead>
                <tr>
                  <th>{t("events.type")}</th>
                  <th>{label(lang, "Titre", "Title")}</th>
                  <th>{t("events.person")}</th>
                  <th>{t("events.date")}</th>
                  <th>{t("common.source")}</th>
                  <th>{t("events.description")}</th>
                  <th className="events-actions-col">{t("common.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="events-empty">
                      {t("events.loadingData")}
                    </td>
                  </tr>
                )}

                {!loading && events.length === 0 && (
                  <tr>
                    <td colSpan="7" className="events-empty">
                      {t("events.notFound")}
                    </td>
                  </tr>
                )}

                {!loading &&
                  events.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="event-type-pill">
                          {denormalizeEventType(item.event_type || item.type, lang)}
                        </span>
                      </td>

                      <td className="event-person">{item.title || "—"}</td>

                      <td>
                        {item.person_name ||
                          item.person ||
                          findPersonLabel(item.person_id)}
                      </td>

                      <td>{fmtDate(item.event_date || item.date)}</td>

                      <td>{item.source || "—"}</td>

                      <td className="event-description">
                        {item.description || "—"}
                      </td>

                      <td>
                        <div className="event-action-buttons">
                          <button
                            type="button"
                            className="event-icon-action event-view-btn"
                            data-tooltip={t("common.view")}
                            onClick={() => setViewItem(item)}
                          >
                            <FaEye />
                          </button>

                          <button
                            type="button"
                            className="event-icon-action event-edit-btn"
                            data-tooltip={t("common.edit")}
                            onClick={() => openEdit(item)}
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="event-icon-action event-delete-btn"
                            data-tooltip={t("common.delete")}
                            onClick={() => remove(item)}
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

          <div className="events-pagination">
            <span>
              {tr("events.display", {
                shown: events.length,
                total: number(displayedTotal || 0),
              })}
            </span>
          </div>
        </div>
      </div>

      {viewItem && (
        <div className="events-modal-overlay">
          <div className="events-modal-box">
            <button
              type="button"
              className="events-modal-close"
              onClick={() => setViewItem(null)}
            >
              <FaTimes />
            </button>

            <h3>{t("events.detail")}</h3>

            <div className="event-detail-grid">
              <Info
                label={t("events.type")}
                value={denormalizeEventType(
                  viewItem.event_type || viewItem.type,
                  lang
                )}
              />

              <Info
                label={label(lang, "Titre", "Title")}
                value={viewItem.title || "—"}
              />

              <Info
                label={t("events.person")}
                value={
                  viewItem.person_name ||
                  viewItem.person ||
                  findPersonLabel(viewItem.person_id)
                }
              />

              <Info
                label={t("events.date")}
                value={fmtDate(viewItem.event_date || viewItem.date)}
              />

              <Info label={t("common.source")} value={viewItem.source || "—"} />

              <Info
                label={t("events.description")}
                value={
                  viewItem.description ||
                  label(lang, "Aucune description", "No description")
                }
                wide
              />
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="events-modal-overlay">
          <div className="events-modal-box">
            <button
              type="button"
              className="events-modal-close"
              onClick={() => setModal(null)}
            >
              <FaTimes />
            </button>

            <h3>{modal === "create" ? t("events.add") : t("events.edit")}</h3>

            {error && <div className="events-error">{error}</div>}

            <div className="events-form-grid">
              <div className="person-autocomplete">
                <input
                  placeholder={
                    personsLoading
                      ? label(lang, "Chargement des personnes...", "Loading persons...")
                      : t("events.searchPerson")
                  }
                  value={personSearch}
                  onChange={(event) => {
                    setPersonSearch(event.target.value);
                    setForm({ ...form, person_id: "" });
                  }}
                />

                {personSearch && !form.person_id && (
                  <div className="person-suggestions">
                    {filteredPersons.length === 0 && (
                      <div className="person-suggestion-empty">
                        {t("events.noPerson")}
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

              <input
                placeholder={label(lang, "Titre de l'évènement", "Event title")}
                value={form.title || ""}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
              />

              <select
                value={form.event_type || ""}
                onChange={(event) =>
                  setForm({ ...form, event_type: event.target.value })
                }
              >
                <option value="">{t("events.type")}</option>

                {eventTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                value={form.event_date || ""}
                onChange={(event) =>
                  setForm({ ...form, event_date: event.target.value })
                }
              />

              <input
                placeholder={t("common.source")}
                value={form.source || ""}
                onChange={(event) =>
                  setForm({ ...form, source: event.target.value })
                }
              />

              <textarea
                placeholder={t("events.description")}
                value={form.description || ""}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </div>

            <div className="events-modal-actions">
              <button
                type="button"
                className="events-cancel-btn"
                onClick={() => setModal(null)}
              >
                {t("common.cancel")}
              </button>

              <button type="button" className="events-save-btn" onClick={save}>
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Info({ label, value, wide }) {
  return (
    <div
      className={wide ? "event-info-card event-info-wide" : "event-info-card"}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}