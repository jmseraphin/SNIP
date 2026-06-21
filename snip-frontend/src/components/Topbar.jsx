import "../styles/Topbar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { FaBell, FaThLarge, FaMoon, FaSun } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
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
  window.dispatchEvent(new CustomEvent("snip-theme-change", { detail: theme }));
}

export default function Topbar({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const lang = useLang();

  const [openMenu, setOpenMenu] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("snip_dark_mode") === "true"
  );
  const [notifications, setNotifications] = useState([
    "Nouvel utilisateur ajouté",
    "Document importé",
    "Mise à jour système",
  ]);

  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    applyTheme(darkMode);
  }, [darkMode]);

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

    if (notifications.length > 0) {
      setNotifications([]);
    }
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
          title={darkMode ? "Mode clair" : "Mode sombre"}
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

            {notifications.length > 0 && (
              <span className="notification-badge">
                {notifications.length}
              </span>
            )}
          </button>

          {openNotif && (
            <div className="notification-dropdown">
              <h4>{t("settings.notifications")}</h4>
              <p className="empty-notif">{t("common.noData")}</p>
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