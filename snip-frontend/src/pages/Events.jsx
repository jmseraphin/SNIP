import "../styles/events.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { eventsApi } from "../services/api";
import { fmtDate, number } from "../utils/format";
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

const eventTypes = ["Naissance", "Mariage", "Divorce", "Décès", "Autre"];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [modal, setModal] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizeEvents = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.events)) return res.events;
    if (Array.isArray(res?.results)) return res.results;
    if (Array.isArray(res?.data?.events)) return res.data.events;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const matchFrontend = (item, keyword, selectedType) => {
    const typeValue = item.event_type || item.type || "";
    const values = [
      item.id,
      item.person_id,
      item.person_name,
      item.person,
      item.event_type,
      item.type,
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

    const matchType = selectedType
      ? String(typeValue).toLowerCase() === selectedType.toLowerCase()
      : true;

    return matchKeyword && matchType;
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
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 350);
    return () => clearTimeout(timer);
  }, [q, type]);

  const openCreate = () => {
    setForm(empty);
    setModal("create");
    setError("");
  };

  const openEdit = (item) => {
    setForm({
      ...empty,
      ...item,
      person_id: item.person_id || "",
      event_type: item.event_type || item.type || "",
      title: item.title || "",
      event_date: item.event_date
        ? String(item.event_date).slice(0, 16)
        : item.date
        ? String(item.date).slice(0, 16)
        : "",
      source: item.source || "",
      description: item.description || "",
    });
    setModal(item.id);
    setError("");
  };

  const save = async () => {
    try {
      setError("");

      if (!form.person_id) return setError("ID personne obligatoire.");
      if (!form.event_type) return setError("Type d'évènement obligatoire.");
      if (!form.title) return setError("Titre obligatoire.");
      if (!form.event_date) return setError("Date de l'évènement obligatoire.");

      const payload = {
        person_id: form.person_id,
        event_type: form.event_type,
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
      setQ("");
      setType("");
      await load();
    } catch (e) {
      setError(e.message || "Erreur lors de l'enregistrement.");
    }
  };

  const remove = async (item) => {
    if (!window.confirm("Supprimer cet évènement ?")) return;

    try {
      await eventsApi.remove(item.id);
      await load();
    } catch (e) {
      alert(e.message || "Suppression impossible.");
    }
  };

  const displayedTotal = useMemo(() => {
    return q || type ? events.length : total;
  }, [q, type, events.length, total]);

  return (
    <>
      <Topbar title="Gestion des évènements" />

      <div className="events-page">
        <div className="events-stats">
          <div className="event-stat-card">
            <div className="event-stat-icon">
              <FaCalendarAlt />
            </div>
            <div>
              <h3>Total évènements</h3>
              <p>{loading ? "…" : number(displayedTotal || 0)}</p>
            </div>
          </div>
        </div>

        <div className="events-table-box">
          <div className="events-table-header">
            <div>
              <h3>Liste des évènements</h3>
              <span>Historique des faits liés aux personnes</span>
            </div>

            <button className="event-add-btn" onClick={openCreate}>
              <FaPlus /> Ajouter
            </button>
          </div>

          <div className="events-filters">
            <div className="events-search-box">
              <FaSearch className="events-search-icon" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher type, titre, personne, source..."
              />
            </div>

            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Tous les types</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="events-table-responsive">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Titre</th>
                  <th>Personne</th>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Description</th>
                  <th className="events-actions-col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="events-empty">
                      Chargement des évènements...
                    </td>
                  </tr>
                )}

                {!loading && events.length === 0 && (
                  <tr>
                    <td colSpan="7" className="events-empty">
                      Aucun évènement trouvé
                    </td>
                  </tr>
                )}

                {!loading &&
                  events.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="event-type-pill">
                          {item.event_type || item.type || "—"}
                        </span>
                      </td>

                      <td className="event-person">{item.title || "—"}</td>

                      <td>
                        {item.person_name || item.person || item.person_id || "—"}
                      </td>

                      <td>{fmtDate(item.event_date || item.date)}</td>

                      <td>{item.source || "—"}</td>

                      <td className="event-description">
                        {item.description || "—"}
                      </td>

                      <td>
                        <div className="event-action-buttons">
                          <button
                            className="event-icon-action event-view-btn"
                            data-tooltip="Voir"
                            onClick={() => setViewItem(item)}
                          >
                            <FaEye />
                          </button>

                          <button
                            className="event-icon-action event-edit-btn"
                            data-tooltip="Modifier"
                            onClick={() => openEdit(item)}
                          >
                            <FaEdit />
                          </button>

                          <button
                            className="event-icon-action event-delete-btn"
                            data-tooltip="Supprimer"
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
              Affichage de {events.length} sur {number(displayedTotal || 0)} évènement(s)
            </span>
          </div>
        </div>
      </div>

      {viewItem && (
        <div className="events-modal-overlay">
          <div className="events-modal-box">
            <button className="events-modal-close" onClick={() => setViewItem(null)}>
              <FaTimes />
            </button>

            <h3>Détail de l'évènement</h3>

            <div className="event-detail-grid">
              <Info label="Type" value={viewItem.event_type || viewItem.type || "—"} />
              <Info label="Titre" value={viewItem.title || "—"} />
              <Info label="Personne" value={viewItem.person_name || viewItem.person || viewItem.person_id || "—"} />
              <Info label="Date" value={fmtDate(viewItem.event_date || viewItem.date)} />
              <Info label="Source" value={viewItem.source || "—"} />
              <Info label="Description" value={viewItem.description || "Aucune description"} wide />
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="events-modal-overlay">
          <div className="events-modal-box">
            <button className="events-modal-close" onClick={() => setModal(null)}>
              <FaTimes />
            </button>

            <h3>{modal === "create" ? "Ajouter un évènement" : "Modifier évènement"}</h3>

            {error && <div className="events-error">{error}</div>}

            <div className="events-form-grid">
              <input
                placeholder="ID personne"
                value={form.person_id || ""}
                onChange={(e) => setForm({ ...form, person_id: e.target.value })}
              />

              <input
                placeholder="Titre de l'évènement"
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <select
                value={form.event_type || ""}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              >
                <option value="">Type d'évènement</option>
                {eventTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <input
                type="datetime-local"
                value={form.event_date || ""}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />

              <input
                placeholder="Source"
                value={form.source || ""}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />

              <textarea
                placeholder="Description"
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="events-modal-actions">
              <button className="events-cancel-btn" onClick={() => setModal(null)}>
                Annuler
              </button>
              <button className="events-save-btn" onClick={save}>
                Enregistrer
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
    <div className={wide ? "event-info-card event-info-wide" : "event-info-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}