import "../styles/dashboard.css";
import snipLogo from "../assets/snipLogo1.png";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { dashboardApi } from "../services/api";
import { number } from "../utils/format";
import {
  FaUsers,
  FaFileAlt,
  FaCalendarAlt,
  FaUserShield,
  FaLink,
  FaFolderOpen,
  FaAddressBook,
  FaClipboardList,
  FaSearch,
  FaEye,
  FaPlus,
  FaEdit,
  FaTrash,
  FaHistory,
} from "react-icons/fa";

const emptyStats = {
  persons: 0,
  documents: 0,
  events: 0,
  users: 0,
  relationships: 0,
  files: 0,
  contacts: 0,
  audit_logs: 0,
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

const actionConfig = {
  SEARCH: {
    label: "Recherche",
    icon: FaSearch,
  },
  READ: {
    label: "Consultation",
    icon: FaEye,
  },
  CREATE: {
    label: "Création",
    icon: FaPlus,
  },
  UPDATE: {
    label: "Modification",
    icon: FaEdit,
  },
  DELETE: {
    label: "Suppression",
    icon: FaTrash,
  },
};

function formatDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(value) {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) return "";

  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "À l’instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays < 7) return `Il y a ${diffDays} j`;

  return formatDateTime(value);
}

function formatTargetType(type) {
  const labels = {
    Person: "personne",
    IdentityDocument: "document d’identité",
    Relationship: "relation",
    Event: "événement",
    File: "fichier",
    Address: "adresse",
    Contact: "contact",
    User: "utilisateur",
    Role: "rôle",
  };

  return labels[type] || type || "élément";
}

function formatActivity(activity) {
  const action = activity.action || activity.label || "ACTION";
  const targetType = activity.target_type || activity.targetType || "Système";
  const username =
    activity.username ||
    activity.user_name ||
    activity.user?.username ||
    activity.user?.full_name ||
    "Utilisateur";

  const config = actionConfig[action] || {
    label: action,
    icon: FaHistory,
  };

  const description =
    activity.description ||
    activity.details?.description ||
    `${config.label} sur ${formatTargetType(targetType)}`;

  return {
    ...activity,
    actionLabel: config.label,
    Icon: config.icon,
    username,
    description,
    targetLabel: formatTargetType(targetType),
    relativeTime: timeAgo(activity.created_at || activity.createdAt),
    fullDate: formatDateTime(activity.created_at || activity.createdAt),
  };
}

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
    ["Relations", stats.relationships ?? stats.total_relationships ?? 0, FaLink],
    ["Fichiers", stats.files ?? stats.total_files ?? 0, FaFolderOpen],
    ["Contacts", stats.contacts ?? stats.total_contacts ?? 0, FaAddressBook],
    ["Logs d’audit", stats.audit_logs ?? stats.total_audit_logs ?? 0, FaClipboardList],
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

  const activities = useMemo(() => {
    const raw = stats.recent_activities || stats.activities || stats.audit_logs_recent || [];
    return raw.slice(0, 8).map(formatActivity);
  }, [stats]);

  return (
    <>
      <Topbar title="Tableau de bord SNIP" />

      <div className="dashboard-wrapper">
        <div className="dashboard-title-section">
        <div className="dashboard-title-content">
          <img src={snipLogo} alt="SNIP" className="dashboard-title-logo" />
          <h1>Système National d’Information sur les Personnes</h1>
        </div>
      </div>

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
            <div className="box-header">
              <div>
                <h3>Activités récentes</h3>
                <p>Dernières actions journalisées</p>
              </div>
            </div>

            <ul className="activities pro-activities">
              {loading && <li className="activity-empty">Chargement des activités...</li>}

              {!loading && activities.length === 0 && (
                <li className="activity-empty">Aucune activité récente</li>
              )}

              {!loading &&
                activities.map((a, i) => (
                  <li key={a.id || i} className="activity-item">
                    <div className="activity-icon">
                      <a.Icon />
                    </div>

                    <div className="activity-content">
                      <div className="activity-line">
                        <strong>{a.actionLabel}</strong>
                        <span>{a.targetLabel}</span>
                      </div>

                      <p>{a.description}</p>

                      <div className="activity-meta">
                        <span>Par {a.username}</span>
                        {a.relativeTime && <span>{a.relativeTime}</span>}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          <div className="box">
            <h3>Répartition des personnes par région</h3>

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
                  <p className="empty-legend">Aucune donnée régionale disponible.</p>
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