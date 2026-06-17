import "../styles/dashboard.css";
import { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import { dashboardApi } from "../services/api";
import { number } from "../utils/format";
import { FaUsers, FaFileAlt, FaCalendarAlt, FaUserShield } from "react-icons/fa";

export default function Dashboard() {
  const [stats, setStats] = useState({ persons: 0, documents: 0, events: 0, users: 0, recent_activities: [], persons_by_region: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.summary().then(setStats).finally(() => setLoading(false));
  }, []);

  const cards = [
    ["Personnes", stats.persons ?? stats.total_persons, FaUsers],
    ["Documents", stats.documents ?? stats.total_documents, FaFileAlt],
    ["Événements", stats.events ?? stats.total_events, FaCalendarAlt],
    ["Utilisateurs", stats.users ?? stats.total_users, FaUserShield],
  ];
  const regions = stats.persons_by_region || stats.regions || [];
  const max = Math.max(...regions.map((r) => r.total || r.count || 0), 1);

  return (
    <>
      <Topbar title="Tableau de bord" />
      <div className="cards">
        {cards.map(([label, value, Icon]) => (
          <div className="card" key={label}>
            <div className="title-row"><Icon className="card-icon" /><h3>{label}</h3></div>
            <p>{loading ? "…" : number(value)}</p>
          </div>
        ))}
      </div>

      <div className="content-grid">
        <div className="box">
          <h3>Activités récentes</h3>
          <ul className="activities">
            {(stats.recent_activities || []).length === 0 && <li>Aucune activité récente</li>}
            {(stats.recent_activities || []).slice(0, 8).map((a, i) => <li key={a.id || i}>{a.label || a.action || a.description || "Activité"}</li>)}
          </ul>
        </div>
        <div className="box">
          <h3>Personnes par région</h3>
          {regions.length === 0 ? <div className="graph-placeholder">Aucune donnée</div> : (
            <div className="bar-chart">
              {regions.map((r, i) => {
                const label = r.region || r.name || "Non défini";
                const total = r.total || r.count || 0;
                return <div className="bar-row" key={label + i}><span>{label}</span><div><b style={{ width: `${(total / max) * 100}%` }} /></div><em>{number(total)}</em></div>;
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
