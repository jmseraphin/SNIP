import "../styles/dashboard.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { dashboardApi } from "../services/api";
import { number } from "../utils/format";
import { FaUsers, FaFileAlt, FaCalendarAlt, FaUserShield } from "react-icons/fa";

const emptyStats = {
  persons: 0,
  documents: 0,
  events: 0,
  users: 0,
  recent_activities: [],
  persons_by_region: [],
};

const chartColors = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#64748b",
];

export default function Dashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    dashboardApi
      .summary()
      .then((res) => {
        if (!mounted) return;
        setStats({ ...emptyStats, ...(res || {}) });
      })
      .catch(() => {
        if (!mounted) return;
        setStats(emptyStats);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    ["Personnes", stats.persons ?? stats.total_persons ?? 0, FaUsers],
    ["Documents", stats.documents ?? stats.total_documents ?? 0, FaFileAlt],
    ["Événements", stats.events ?? stats.total_events ?? 0, FaCalendarAlt],
    ["Utilisateurs", stats.users ?? stats.total_users ?? 0, FaUserShield],
  ];

  const regions = useMemo(() => {
    const raw = stats.persons_by_region || stats.regions || [];

    return raw
      .map((r, index) => ({
        label: r.region || r.name || r.label || "Non défini",
        total: Number(r.total ?? r.count ?? r.value ?? 0),
        color: chartColors[index % chartColors.length],
      }))
      .filter((r) => r.total > 0);
  }, [stats]);

  const totalRegions = regions.reduce((sum, r) => sum + r.total, 0);

  const donutBackground = useMemo(() => {
    if (totalRegions <= 0) {
      return "conic-gradient(#e5e7eb 0deg 360deg)";
    }

    let start = 0;

    const parts = regions.map((r) => {
      const degree = (r.total / totalRegions) * 360;
      const part = `${r.color} ${start}deg ${start + degree}deg`;
      start += degree;
      return part;
    });

    return `conic-gradient(${parts.join(", ")})`;
  }, [regions, totalRegions]);

  const activities = stats.recent_activities || stats.activities || [];

  return (
    <>
      <Topbar title="Tableau de bord" />

      <div className="dashboard-wrapper">
        <div className="cards">
          {cards.map(([label, value, Icon]) => (
            <div className="card" key={label}>
              <div className="title-row">
                <Icon className="card-icon" />
                <h3>{label}</h3>
              </div>
              <p>{loading ? "…" : number(value || 0)}</p>
            </div>
          ))}
        </div>

        <div className="content-grid">
          <div className="box">
            <h3>Activités récentes</h3>

            <ul className="activities">
              {loading && <li>Chargement des activités...</li>}

              {!loading && activities.length === 0 && (
                <li>Aucune activité récente</li>
              )}

              {!loading &&
                activities.slice(0, 8).map((a, i) => (
                  <li key={a.id || i}>
                    {a.label || a.action || a.description || "Activité"}
                  </li>
                ))}
            </ul>
          </div>

          <div className="box">
            <h3>Répartition par région</h3>

            <div className="donut-area">
              <div
                className="donut-chart"
                style={{ background: donutBackground }}
              >
                <div className="donut-center">
                  <strong>{loading ? "…" : number(totalRegions)}</strong>
                  <span>Total</span>
                </div>
              </div>

              <div className="donut-legend">
                {loading && <p className="empty-legend">Chargement...</p>}

                {!loading && regions.length === 0 && (
                  <p className="empty-legend">
                    Aucune donnée régionale. Le graphe est prêt et affichera les
                    régions dès que le backend renvoie `persons_by_region`.
                  </p>
                )}

                {!loading &&
                  regions.map((r) => (
                    <div className="legend-item" key={r.label}>
                      <span style={{ backgroundColor: r.color }} />
                      <p>{r.label}</p>
                      <strong>{number(r.total)}</strong>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}