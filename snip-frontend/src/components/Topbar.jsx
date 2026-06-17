import "../styles/Topbar.css";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { FaBell, FaThLarge, FaMoon, FaSun } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";

const titleLabels = {
  FR: {
    "/": "Tableau de bord",
    "/persons": "Gestion des personnes",
    "/relationships": "Gestion des relations",
    "/search": "Recherche avancée",
    "/documents": "Gestion des documents d’identité",
    "/files": "Gestion des fichiers",
    "/events": "Gestion des évènements",
    "/addresses": "Gestion des adresses",
    "/contacts": "Gestion des contacts",
    "/users": "Utilisateurs & rôles",
    "/audit-logs": "Audit logs",
    "/settings": "Paramètres",
    notifications: "Notifications",
    noNotifications: "Aucune notification",
    settings: "Paramètres",
    logout: "Déconnexion",
    adminUser: "Admin User",
  },
  EN: {
    "/": "Dashboard",
    "/persons": "Persons management",
    "/relationships": "Relationships management",
    "/search": "Advanced search",
    "/documents": "Identity documents management",
    "/files": "Files management",
    "/events": "Events management",
    "/addresses": "Addresses management",
    "/contacts": "Contacts management",
    "/users": "Users & roles",
    "/audit-logs": "Audit logs",
    "/settings": "Settings",
    notifications: "Notifications",
    noNotifications: "No notification",
    settings: "Settings",
    logout: "Logout",
    adminUser: "Admin User",
  },
};

export default function Topbar({ title }) {
  const navigate = useNavigate();

  const [openMenu, setOpenMenu] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("snip_dark_mode") === "true";
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("snip_language") || "FR";
  });

  const [notifications, setNotifications] = useState([
    "Nouvel utilisateur ajouté",
    "Document importé",
    "Mise à jour système",
  ]);

  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
      document.body.classList.add("dark-mode");
      localStorage.setItem("snip_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.body.classList.remove("dark-mode");
      localStorage.setItem("snip_dark_mode", "false");
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("snip_language", language);
    window.dispatchEvent(new Event("snip-language-change"));
  }, [language]);

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
    setOpenNotif(!openNotif);

    if (notifications.length > 0) {
      setNotifications([]);
    }
  };

  const toggleLanguage = () => {
    setLanguage((current) => (current === "FR" ? "EN" : "FR"));
  };

  const handleLogout = async () => {
    await authApi.logout();
    navigate("/login", { replace: true });
  };

  const t = titleLabels[language] || titleLabels.FR;
  const currentTitle = t[window.location.pathname] || title;

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
          title="Changer la langue"
        >
          {language === "FR" ? "EN" : "FR"}
        </button>

        <button
          type="button"
          className="topbar-btn"
          onClick={() => setDarkMode(!darkMode)}
          title="Mode sombre"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        <div className="notification-wrapper" ref={notifRef}>
          <button
            type="button"
            className="notification-box"
            onClick={handleNotification}
            title={t.notifications}
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
              <h4>{t.notifications}</h4>
              <p className="empty-notif">{t.noNotifications}</p>
            </div>
          )}
        </div>

        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="avatar-placeholder"
            onClick={() => setOpenMenu(!openMenu)}
          >
            {(t.adminUser || "Admin").charAt(0).toUpperCase()}
          </button>

          {openMenu && (
            <div className="dropdown-menu">
              <h4>{t.adminUser}</h4>
              <p>ADMIN</p>

              <hr />

              <Link to="/settings" className="dropdown-link">
                {t.settings}
              </Link>

              <button className="dropdown-link" onClick={handleLogout}>
                {t.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}