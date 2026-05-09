import Sidebar from "./components/Sidebar";
import "./styles/dashboard.css";

import {
  FaUsers,
  FaFileAlt,
  FaCalendarAlt,
  FaUserShield,
} from "react-icons/fa";

function App() {
  const stats = {
    personnes: 12458,
    documents: 24987,
    evenements: 5214,
    utilisateurs: 156,
  };

  return (
    <div className="app">
      <Sidebar />

      <div className="main-content">
        {/* TOPBAR */}
        <div className="topbar">
          <h2>Tableau de bord</h2>

          <div className="user-box">
            <img
              src="https://i.pravatar.cc/40"
              alt="user"
            />

            <div>
              <h4>Admin User</h4>
              <p>ADMIN</p>
            </div>
          </div>
        </div>

        {/* CARDS */}
        <div className="cards">

          <div className="card">
            <div className="title-row">
              <FaUsers className="card-icon" />
              <h3>Personnes</h3>
            </div>

            <p>{stats.personnes.toLocaleString()}</p>
          </div>

          <div className="card">
            <div className="title-row">
              <FaFileAlt className="card-icon" />
              <h3>Documents</h3>
            </div>

            <p>{stats.documents.toLocaleString()}</p>
          </div>

          <div className="card">
            <div className="title-row">
              <FaCalendarAlt className="card-icon" />
              <h3>Événements</h3>
            </div>

            <p>{stats.evenements.toLocaleString()}</p>
          </div>

          <div className="card">
            <div className="title-row">
              <FaUserShield className="card-icon" />
              <h3>Utilisateurs</h3>
            </div>

            <p>{stats.utilisateurs.toLocaleString()}</p>
          </div>

        </div>

        {/* CONTENT */}
        <div className="content-grid">

          <div className="box">
            <h3>Activités récentes</h3>

            <ul className="activities">
              <li>✔ Rakoto Jean ajouté</li>
              <li>✔ Nouveau document importé</li>
              <li>✔ Relation ajoutée</li>
              <li>✔ Adresse mise à jour</li>
              <li>✔ Nouvel utilisateur créé</li>
            </ul>
          </div>

          <div className="box">
            <h3>Personnes par région</h3>

            <div className="graph-placeholder">
              Graphique ici
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;