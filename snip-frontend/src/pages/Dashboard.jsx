import "../styles/Dashboard.css";
import Topbar from "../components/Topbar";
import {
  FaUsers,
  FaFileAlt,
  FaCalendarAlt,
  FaUserShield,
} from "react-icons/fa";

export default function Dashboard() {
  return (
    <>
      <Topbar title="Tableau de bord" />

      {/* CARDS */}
      <div className="cards">

        <div className="card">
          <div className="title-row">
            <FaUsers className="card-icon" />
            <h3>Personnes</h3>
          </div>
          <p>12,458</p>
        </div>

        <div className="card">
          <div className="title-row">
            <FaFileAlt className="card-icon" />
            <h3>Documents</h3>
          </div>
          <p>24,987</p>
        </div>

        <div className="card">
          <div className="title-row">
            <FaCalendarAlt className="card-icon" />
            <h3>Événements</h3>
          </div>
          <p>5,214</p>
        </div>

        <div className="card">
          <div className="title-row">
            <FaUserShield className="card-icon" />
            <h3>Utilisateurs</h3>
          </div>
          <p>156</p>
        </div>

      </div>

      {/* CONTENT */}
      <div className="content-grid">

        <div className="box">
          <h3>Activités récentes</h3>
          <ul className="activities">
            <li>Rakoto Jean ajouté</li>
            <li>Nouveau document upload</li>
            <li>Utilisateur créé</li>
          </ul>
        </div>

        <div className="box">
          <h3>Personnes par région</h3>
          <div className="graph-placeholder">
            📊 Graphique ici
          </div>
        </div>

      </div>
    </>
  );
}
<FaUsers className="card-icon" />