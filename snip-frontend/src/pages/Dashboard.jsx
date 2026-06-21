import "../styles/dashboard.css";
import snipLogo from "../assets/snipLogo1.png";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { dashboardApi } from "../services/api";
import { number } from "../utils/format";
import { t, useLang } from "../i18n";
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
    labelKey: "action.search",
    icon: FaSearch,
  },
  READ: {
    labelKey: "action.read",
    icon: FaEye,
  },
  CREATE: {
    labelKey: "action.create",
    icon: FaPlus,
  },
  UPDATE: {
    labelKey: "action.update",
    icon: FaEdit,
  },
  DELETE: {
    labelKey: "action.delete",
    icon: FaTrash,
  },
};

function translateWithValue(key, value) {
  return t(key).replace("{{value}}", value);
}

function formatDateTime(value, lang) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(lang === "en" ? "en-US" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(value, lang) {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) return "";

  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return t("dashboard.now");
  if (diffMinutes < 60) {
    return translateWithValue("dashboard.minutesAgo", diffMinutes);
  }
  if (diffHours < 24) {
    return translateWithValue("dashboard.hoursAgo", diffHours);
  }
  if (diffDays < 7) {
    return translateWithValue("dashboard.daysAgo", diffDays);
  }

  return formatDateTime(value, lang);
}

function formatTargetType(type) {
  const labels = {
    Person: "target.person",
    IdentityDocument: "target.identityDocument",
    Relationship: "target.relationship",
    Event: "target.event",
    File: "target.file",
    Address: "target.address",
    Contact: "target.contact",
    User: "target.user",
    Role: "target.role",
    Système: "target.system",
    System: "target.system",
  };

  return labels[type] ? t(labels[type]) : type || t("target.item");
}

function formatActivity(activity, lang) {
  const action = activity.action || activity.label || "ACTION";
  const targetType = activity.target_type || activity.targetType || "System";
  const username =
    activity.username ||
    activity.user_name ||
    activity.user?.username ||
    activity.user?.full_name ||
    t("target.user");

  const config = actionConfig[action] || {
    labelKey: null,
    icon: FaHistory,
  };

  const actionLabel = config.labelKey ? t(config.labelKey) : action;

  const description =
    activity.description ||
    activity.details?.description ||
    `${actionLabel} ${formatTargetType(targetType)}`;

  return {
    ...activity,
    actionLabel,
    Icon: config.icon,
    username,
    description,
    targetLabel: formatTargetType(targetType),
    relativeTime: timeAgo(activity.created_at || activity.createdAt, lang),
    fullDate: formatDateTime(activity.created_at || activity.createdAt, lang),
  };
}

export default function Dashboard() {
  const lang = useLang();

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
    [t("dashboard.persons"), stats.persons ?? stats.total_persons ?? 0, FaUsers],
    [
      t("dashboard.documents"),
      stats.documents ?? stats.total_documents ?? 0,
      FaFileAlt,
    ],
    [
      t("dashboard.events"),
      stats.events ?? stats.total_events ?? 0,
      FaCalendarAlt,
    ],
    [
      t("dashboard.users"),
      stats.users ?? stats.total_users ?? 0,
      FaUserShield,
    ],
    [
      t("dashboard.relationships"),
      stats.relationships ?? stats.total_relationships ?? 0,
      FaLink,
    ],
    [
      t("dashboard.files"),
      stats.files ?? stats.total_files ?? 0,
      FaFolderOpen,
    ],
    [
      t("dashboard.contacts"),
      stats.contacts ?? stats.total_contacts ?? 0,
      FaAddressBook,
    ],
    [
      t("dashboard.auditLogs"),
      stats.audit_logs ?? stats.total_audit_logs ?? 0,
      FaClipboardList,
    ],
  ];

  const regions = useMemo(() => {
    const raw = stats.persons_by_region || stats.regions || [];

    return raw
      .map((r, index) => ({
        label: r.region || r.name || r.label || t("dashboard.undefinedRegion"),
        total: Number(r.total ?? r.count ?? r.value ?? 0),
        color: chartColors[index % chartColors.length],
      }))
      .filter((r) => r.total > 0);
  }, [stats, lang]);

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
    const raw =
      stats.recent_activities || stats.activities || stats.audit_logs_recent || [];

    return raw.slice(0, 8).map((activity) => formatActivity(activity, lang));
  }, [stats, lang]);

  return (
    <>
      <Topbar title={t("dashboard.title")} />

      <div className="dashboard-wrapper">
        <div className="dashboard-title-section">
          <div className="dashboard-title-content">
            <img src={snipLogo} alt="SNIP" className="dashboard-title-logo" />
            <h1>{t("dashboard.systemTitle")}</h1>
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
                <h3>{t("dashboard.recentActivities")}</h3>
                <p>{t("dashboard.recentActions")}</p>
              </div>
            </div>

            <ul className="activities pro-activities">
              {loading && (
                <li className="activity-empty">
                  {t("dashboard.loadingActivities")}
                </li>
              )}

              {!loading && activities.length === 0 && (
                <li className="activity-empty">
                  {t("dashboard.noRecentActivity")}
                </li>
              )}

              {!loading &&
                activities.map((activity, index) => (
                  <li key={activity.id || index} className="activity-item">
                    <div className="activity-icon">
                      <activity.Icon />
                    </div>

                    <div className="activity-content">
                      <div className="activity-line">
                        <strong>{activity.actionLabel}</strong>
                        <span>{activity.targetLabel}</span>
                      </div>

                      <p>{activity.description}</p>

                      <div className="activity-meta">
                        <span>
                          {t("dashboard.by")} {activity.username}
                        </span>

                        {activity.relativeTime && (
                          <span>{activity.relativeTime}</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          <div className="box">
            <h3>{t("dashboard.regionDistribution")}</h3>

            <div className="donut-area">
              <div
                className="donut-chart"
                style={{ background: donutBackground }}
              >
                <div className="donut-center">
                  <strong>{loading ? "…" : number(totalRegions)}</strong>
                  <span>{t("common.total")}</span>
                </div>
              </div>

              <div className="donut-legend">
                {loading && (
                  <p className="empty-legend">{t("dashboard.loading")}</p>
                )}

                {!loading && regions.length === 0 && (
                  <p className="empty-legend">
                    {t("dashboard.noRegionData")}
                  </p>
                )}

                {!loading &&
                  regions.map((region) => (
                    <div className="legend-item" key={region.label}>
                      <span style={{ backgroundColor: region.color }} />
                      <p>{region.label}</p>
                      <strong>{number(region.total)}</strong>
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