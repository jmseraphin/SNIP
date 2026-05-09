import Sidebar from "../components/Sidebar";
import "../styles/dashboard.css";

export default function Dashboard() {
  return (
    <div className="layout">

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="main">

        {/* TOP CARDS */}
        <div className="cards">
          <div className="card">👤 Personnes<br /><b>12,458</b></div>
          <div className="card">📄 Documents<br /><b>24,987</b></div>
          <div className="card">📅 Événements<br /><b>5,214</b></div>
          <div className="card">👥 Utilisateurs<br /><b>156</b></div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid">

          <div className="box">
            <h3>Activités récentes</h3>
            <p>- Rakoto Jean ajouté</p>
            <p>- Nouveau document upload</p>
          </div>

          <div className="box">
            <h3>Statistiques</h3>
            <div className="chart-placeholder">📊 Graphique ici</div>
          </div>

        </div>

      </div>
    </div>
  );
}