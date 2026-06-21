import "../styles/Topbar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi, auditApi } from "../services/api";
import { FaBell, FaThLarge, FaMoon, FaSun } from "react-icons/fa";
import { useState, useRef, useEffect, useMemo } from "react";
import { t, useLang, setLang } from "../i18n";

const pageTitleKeys = {
  "/": "dashboard.title",
  "/persons": "persons.title",
  "/relationships": "relationships.title",
  "/search": "search.title",
  "/documents": "documents.title",
  "/files": "files.title",
  "/events": "events.title",
  "/addresses": "addresses.title",
  "/contacts": "contacts.title",
  "/users": "users.title",
  "/audit-logs": "audit.title",
  "/settings": "settings.title",
};

function applyTheme(isDark) {
  const theme = isDark ? "dark" : "light";
  document.documentElement.classList.toggle("dark-mode", isDark);
  document.body.classList.toggle("dark-mode", isDark);
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("snip_dark_mode", isDark ? "true" : "false");
  localStorage.setItem("snip_theme", theme);
  window.dispatchEvent(new CustomEvent("snip-theme-change", { detail: theme }));
}

function normalizeLogs(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.logs)) return response.logs;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.logs)) return response.data.logs;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function getLogId(log) {
  return log.id || log.log_id || log.audit_id || "";
}

function getLogAction(log) {
  return String(log.action || "").toLowerCase();
}

function getLogTarget(log) {
  return String(log.target_type || log.targetType || log.entity_type || "").toLowerCase();
}

function getLogUser(log) {
  return (
    log.username ||
    log.user_name ||
    log.userName ||
    log.user?.username ||
    log.user?.name ||
    log.user_id ||
    "—"
  );
}

function getLogDate(log) {
  return log.created_at || log.createdAt || log.date || "";
}

function getLogTime(log) {
  const value = getLogDate(log);
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function label(lang, fr, en) {
  return lang === "en" ? en : fr;
}

function formatTimeAgo(value, lang) {
  if (!value) return "";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();

  if (Number.isNaN(diff)) return "";

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return label(lang, "À l’instant", "Just now");
  if (minutes < 60) return label(lang, `Il y a ${minutes} min`, `${minutes} min ago`);
  if (hours < 24) return label(lang, `Il y a ${hours} h`, `${hours} h ago`);
  return label(lang, `Il y a ${days} j`, `${days} d ago`);
}

function actionLabel(action, lang) {
  const value = String(action || "").toLowerCase();

  if (value.includes("create") || value.includes("insert") || value.includes("add")) {
    return label(lang, "créé", "created");
  }

  if (value.includes("update") || value.includes("edit") || value.includes("modify")) {
    return label(lang, "modifié", "updated");
  }

  if (value.includes("delete") || value.includes("remove")) {
    return label(lang, "supprimé", "deleted");
  }

  if (value.includes("login")) {
    return label(lang, "connecté", "logged in");
  }

  if (value.includes("logout")) {
    return label(lang, "déconnecté", "logged out");
  }

  if (value.includes("read") || value.includes("view")) {
    return label(lang, "consulté", "viewed");
  }

  return action || label(lang, "action effectuée", "action performed");
}

function targetLabel(target, lang) {
  const value = String(target || "").toLowerCase();

  if (value.includes("person")) return label(lang, "Personne", "Person");
  if (value.includes("document")) return label(lang, "Document", "Document");
  if (value.includes("relationship") || value.includes("relation")) return label(lang, "Relation", "Relationship");
  if (value.includes("event")) return label(lang, "Évènement", "Event");
  if (value.includes("file")) return label(lang, "Fichier", "File");
  if (value.includes("address")) return label(lang, "Adresse", "Address");
  if (value.includes("contact")) return label(lang, "Contact", "Contact");
  if (value.includes("user")) return label(lang, "Utilisateur", "User");
  if (value.includes("role")) return label(lang, "Rôle", "Role");

  return target || label(lang, "Système", "System");
}

function notificationText(log, lang) {
  const action = getLogAction(log);
  const target = getLogTarget(log);

  if (action.includes("login")) {
    return label(lang, "Utilisateur connecté", "User logged in");
  }

  if (action.includes("logout")) {
    return label(lang, "Utilisateur déconnecté", "User logged out");
  }

  return `${targetLabel(target, lang)} ${actionLabel(action, lang)}`;
}

export default function Topbar({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const lang = useLang();

  const [openMenu, setOpenMenu] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () =>
      localStorage.getItem("snip_dark_mode") === "true" ||
      localStorage.getItem("snip_theme") === "dark"
  );
  const [notifications, setNotifications] = useState([]);
  const [lastSeenTime, setLastSeenTime] = useState(
    () => Number(localStorage.getItem("snip_notifications_seen_time") || 0)
  );

  const menuRef = useRef(null);
  const notifRef = useRef(null);

  const unreadCount = useMemo(() => {
    return notifications.filter((log) => getLogTime(log) > lastSeenTime).length;
  }, [notifications, lastSeenTime]);

  const loadNotifications = async () => {
    try {
      const response = await auditApi.list({
        page: 1,
        limit: 8,
      });

      const logs = normalizeLogs(response)
        .filter(Boolean)
        .sort((a, b) => getLogTime(b) - getLogTime(a))
        .slice(0, 8);

      setNotifications(logs);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    applyTheme(darkMode);
  }, [darkMode]);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);

    window.addEventListener("snip-audit-change", loadNotifications);
    window.addEventListener("snip-notifications-refresh", loadNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener("snip-audit-change", loadNotifications);
      window.removeEventListener("snip-notifications-refresh", loadNotifications);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }

      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpenNotif(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotification = () => {
    setOpenNotif((current) => !current);

    const newestTime = notifications[0] ? getLogTime(notifications[0]) : Date.now();
    localStorage.setItem("snip_notifications_seen_time", String(newestTime));
    setLastSeenTime(newestTime);
  };

  const toggleLanguage = () => {
    setLang(lang === "fr" ? "en" : "fr");
  };

  const toggleDarkMode = () => {
    setDarkMode((current) => !current);
  };

  const handleLogout = async () => {
    await authApi.logout();
    navigate("/login", { replace: true });
  };

  const titleKey = pageTitleKeys[location.pathname];
  const currentTitle = titleKey ? t(titleKey) : title || t("app.name");

  return (
    <div className="topbar">
      <div className="topbar-title">
        <FaThLarge className="title-icon" />
        <h2>{currentTitle}</h2>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="topbar-btn"
          onClick={toggleLanguage}
          title={t("settings.language")}
        >
          {lang === "fr" ? "EN" : "FR"}
        </button>

        <button
          type="button"
          className={darkMode ? "topbar-btn active-theme" : "topbar-btn"}
          onClick={toggleDarkMode}
          title={darkMode ? label(lang, "Mode clair", "Light mode") : label(lang, "Mode sombre", "Dark mode")}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        <div className="notification-wrapper" ref={notifRef}>
          <button
            type="button"
            className="notification-box"
            onClick={handleNotification}
            title={t("settings.notifications")}
          >
            <FaBell className="bell-icon" />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {openNotif && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <h4>{t("settings.notifications")}</h4>

                <button
                  type="button"
                  onClick={loadNotifications}
                  className="notification-refresh-btn"
                >
                  {t("common.refresh")}
                </button>
              </div>

              {notifications.length === 0 && (
                <p className="empty-notif">{t("common.noData")}</p>
              )}

              {notifications.length > 0 && (
                <div className="notification-list">
                  {notifications.map((log, index) => (
                    <button
                      type="button"
                      key={getLogId(log) || index}
                      className="notification-item"
                      onClick={() => {
                        setOpenNotif(false);
                        navigate("/audit-logs");
                      }}
                    >
                      <strong>{notificationText(log, lang)}</strong>
                      <span>
                        {label(lang, "Par", "By")} {getLogUser(log)}
                      </span>
                      <small>{formatTimeAgo(getLogDate(log), lang)}</small>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="notification-view-all"
                onClick={() => {
                  setOpenNotif(false);
                  navigate("/audit-logs");
                }}
              >
                {label(lang, "Voir tous les audits", "View all audit logs")}
              </button>
            </div>
          )}
        </div>

        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="avatar-placeholder"
            onClick={() => setOpenMenu((current) => !current)}
          >
            A
          </button>

          {openMenu && (
            <div className="dropdown-menu">
              <h4>Admin User</h4>
              <p>ADMIN</p>
              <hr />

              <Link to="/settings" className="dropdown-link">
                {t("settings.title")}
              </Link>

              <button
                type="button"
                className="dropdown-link"
                onClick={handleLogout}
              >
                {t("menu.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}