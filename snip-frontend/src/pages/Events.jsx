import "../styles/events.css";

import Topbar from "../components/Topbar";

import {
  FaCalendarAlt,
  FaSearch,
  FaPlus,
  FaDownload,
  FaEye,
  FaEdit,
  FaTrash
} from "react-icons/fa";

import { useState, useRef, useEffect } from "react";

export default function Events() {

  const [events, setEvents] = useState([
    {
      id: 1,
      type: "Naissance",
      person: "Jean Rakoto",
      date: "12/05/2026",
      place: "Antananarivo",
      status: "Validé"
    },
    {
      id: 2,
      type: "Mariage",
      person: "Sarah Rabe",
      date: "20/05/2026",
      place: "Toamasina",
      status: "En attente"
    },
    {
      id: 3,
      type: "Décès",
      person: "Paul Randria",
      date: "01/06/2026",
      place: "Fianarantsoa",
      status: "Validé"
    }
  ]);

  const [openExport, setOpenExport] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const exportRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setOpenExport(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const total = events.length;

  return (
    <>
      <Topbar title="Gestion des évènements" />

      {/* STATS */}
      <div className="events-stats">
        <div className="stats-card">
          <div className="stats-icon">
            <FaCalendarAlt />
          </div>

          <div>
            <h3>Total évènements</h3>
            <p>{total}</p>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-box">

        {/* HEADER */}
        <div className="table-header">

          <div>
            <h3>Liste des évènements</h3>
            <span>Gestion des naissances, mariages, divorces et décès</span>
          </div>

          <div className="header-actions">

            {/* EXPORT */}
            <div className="export-wrapper" ref={exportRef}>

              <button
                className="export-btn"
                onClick={() => setOpenExport(!openExport)}
              >
                <FaDownload />
                Exporter
              </button>

              {openExport && (
                <div className="export-dropdown">
                  <button>Export Excel</button>
                  <button>Export Word</button>
                  <button>Export PDF</button>
                </div>
              )}

            </div>

            {/* ADD */}
            <button
              className="add-btn"
              onClick={() => setOpenModal(true)}
            >
              <FaPlus />
              Ajouter
            </button>

          </div>

        </div>

        {/* FILTERS */}
        <div className="filters-bar">

          <div className="search-box">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Rechercher un évènement..." />
          </div>

          <select>
            <option>Tous les types</option>
            <option>Naissance</option>
            <option>Mariage</option>
            <option>Divorce</option>
            <option>Décès</option>
          </select>

        </div>

        {/* TABLE */}
        <table>

          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Personne</th>
              <th>Date</th>
              <th>Lieu</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => (
              <tr key={event.id}>

                <td>EVT-{event.id}</td>
                <td>{event.type}</td>
                <td>{event.person}</td>
                <td>{event.date}</td>
                <td>{event.place}</td>

                <td>
                  <span className={event.status === "Validé" ? "status active" : "status pending"}>
                    {event.status}
                  </span>
                </td>

                {/* ACTIONS PRO */}
                <td>
                  <div className="action-buttons">

                    <button
                      className="view-btn"
                      onClick={() => {
                        setSelectedEvent(event);
                        setOpenView(true);
                      }}
                    >
                      <FaEye />
                    </button>

                    <button
                      className="edit-btn"
                      onClick={() => {
                        setSelectedEvent(event);
                        setOpenEdit(true);
                      }}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => {
                        const ok = window.confirm(
                          `Supprimer EVT-${event.id} ?`
                        );

                        if (ok) {
                          setEvents(events.filter(e => e.id !== event.id));
                        }
                      }}
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

      {/* ================= VIEW MODAL ================= */}
      {openView && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h3>Détails évènement</h3>

            <p><b>ID:</b> EVT-{selectedEvent.id}</p>
            <p><b>Type:</b> {selectedEvent.type}</p>
            <p><b>Personne:</b> {selectedEvent.person}</p>
            <p><b>Date:</b> {selectedEvent.date}</p>
            <p><b>Lieu:</b> {selectedEvent.place}</p>
            <p><b>Statut:</b> {selectedEvent.status}</p>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setOpenView(false)}>
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {openEdit && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h3>Modifier évènement</h3>

            <input defaultValue={selectedEvent.type} />
            <input defaultValue={selectedEvent.person} />
            <input defaultValue={selectedEvent.date} />
            <input defaultValue={selectedEvent.place} />

            <div className="modal-actions">

              <button className="cancel-btn" onClick={() => setOpenEdit(false)}>
                Annuler
              </button>

              <button
                className="save-btn"
                onClick={() => alert("Modifié avec succès")}
              >
                Sauvegarder
              </button>

            </div>

          </div>
        </div>
      )}

      {/* MODAL AJOUT */}
      {openModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h3>Ajouter un évènement</h3>

            <input placeholder="Nom complet" />

            <select>
              <option>Naissance</option>
              <option>Mariage</option>
              <option>Divorce</option>
              <option>Décès</option>
            </select>

            <input type="date" />
            <input type="text" placeholder="Lieu" />

            <div className="modal-actions">

              <button
                className="cancel-btn"
                onClick={() => setOpenModal(false)}
              >
                Annuler
              </button>

              <button className="save-btn">
                Enregistrer
              </button>

            </div>

          </div>
        </div>
      )}

    </>
  );
}