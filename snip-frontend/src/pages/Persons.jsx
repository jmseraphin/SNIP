import "../styles/persons.css";

import Topbar from "../components/Topbar";

import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaUsers
} from "react-icons/fa";

import { Link } from "react-router-dom";

import { useState, useRef, useEffect } from "react";

export default function Persons() {

  const persons = [
    {
      id: 1,
      national_id: "101001",
      first_name: "Jean",
      last_name: "Rakoto",
      gender: "Homme",
      nationality: "Malagasy",
      status: "Actif"
    },
    {
      id: 2,
      national_id: "101002",
      first_name: "Sarah",
      last_name: "Rabe",
      gender: "Femme",
      nationality: "Malagasy",
      status: "Actif"
    },
    {
      id: 3,
      national_id: "101003",
      first_name: "Lucas",
      last_name: "Ranaivo",
      gender: "Homme",
      nationality: "Française",
      status: "Inactif"
    }
  ];

  const [openExport, setOpenExport] = useState(false);
  const [openModal, setOpenModal] = useState(false);

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

  const itemsPerPage = 5;
  const totalPages = Math.ceil(persons.length / itemsPerPage);

  return (
    <>
      <Topbar title="Gestion des personnes" />

      {/* STATS */}
      <div className="persons-stats">
        <div className="stats-card">
          <div className="stats-icon">
            <FaUsers />
          </div>

          <div>
            <h3>Total personnes</h3>
            <p>{persons.length}</p>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-box">

        {/* HEADER */}
        <div className="table-header">

          <div>
            <h3>Liste des personnes</h3>
            <span>Gestion complète des citoyens enregistrés</span>
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
            <input type="text" placeholder="Rechercher une personne..." />
          </div>

          <select>
            <option>Tous les sexes</option>
            <option>Homme</option>
            <option>Femme</option>
          </select>

          <select>
            <option>Toutes nationalités</option>
            <option>Malagasy</option>
            <option>Française</option>
          </select>

        </div>

        {/* TABLE */}
        <table>
          <thead>
            <tr>
              <th>CIN</th>
              <th>Nom complet</th>
              <th>Sexe</th>
              <th>Nationalité</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {persons.map((person) => (
              <tr key={person.id}>

                <td>{person.national_id}</td>

                <td>
                  <div className="person-info">
                    <div className="person-avatar">
                      {person.first_name.charAt(0)}
                    </div>

                    <div>
                      <h4>{person.first_name} {person.last_name}</h4>
                      <span>ID: {person.id}</span>
                    </div>
                  </div>
                </td>

                <td>{person.gender}</td>
                <td>{person.nationality}</td>

                <td>
                  <span className={person.status === "Actif" ? "status active" : "status inactive"}>
                    {person.status}
                  </span>
                </td>

                {/* ACTIONS + TOOLTIP */}
                <td>
                  <div className="action-buttons">

                    <Link to={`/persons/${person.id}`} className="tooltip">
                      <FaEye />
                      <span>Voir</span>
                    </Link>

                    <button className="tooltip">
                      <FaEdit />
                      <span>Modifier</span>
                    </button>

                    <button className="tooltip">
                      <FaTrash />
                      <span>Supprimer</span>
                    </button>

                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="pagination">

          <button>&lt;</button>

          <div className="page-numbers">
            {[...Array(totalPages)].map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>

          <button>&gt;</button>

        </div>

      </div>

      {/* MODAL */}
      {openModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h3>Ajouter une personne</h3>

            <input placeholder="Nom" />
            <input placeholder="Prénom" />
            <input placeholder="CIN" />

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