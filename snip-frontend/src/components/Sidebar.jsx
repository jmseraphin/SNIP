import "../styles/sidebar.css";
import { NavLink } from "react-router-dom";
import hero from "../assets/snipLogo1.png";
import {
  FaTachometerAlt,
  FaUsers,
  FaPeopleArrows,
  FaSearch,
  FaIdCard,
  FaFileAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUserShield,
  FaClipboardList,
  FaCog,
  FaBars,
} from "react-icons/fa";
import { useEffect, useState } from "react";

const labels = {
  FR: {
    dashboard: "Tableau de bord",
    persons: "Personnes",
    relationships: "Relations",
    search: "Recherche",
    documents: "Documents d’identité",
    files: "Fichiers",
    events: "Événements",
    addresses: "Adresses",
    contacts: "Contacts",
    users: "Utilisateurs & rôles",
    audit: "Audit logs",
    settings: "Paramètres",
    version: "SNIP v1.0",
    secure: "Système sécurisé",
  },
  EN: {
    dashboard: "Dashboard",
    persons: "Persons",
    relationships: "Relationships",
    search: "Search",
    documents: "Identity documents",
    files: "Files",
    events: "Events",
    addresses: "Addresses",
    contacts: "Contacts",
    users: "Users & roles",
    audit: "Audit logs",
    settings: "Settings",
    version: "SNIP v1.0",
    secure: "Secure system",
  },
};

export default function Sidebar({ collapsed, setCollapsed }) {
  const [language, setLanguage] = useState(
    localStorage.getItem("snip_language") || "FR"
  );

  useEffect(() => {
    const syncLanguage = () => {
      setLanguage(localStorage.getItem("snip_language") || "FR");
    };

    window.addEventListener("storage", syncLanguage);
    window.addEventListener("snip-language-change", syncLanguage);

    return () => {
      window.removeEventListener("storage", syncLanguage);
      window.removeEventListener("snip-language-change", syncLanguage);
    };
  }, []);

  const t = labels[language] || labels.FR;

  const menuItems = [
    { to: "/", icon: FaTachometerAlt, label: t.dashboard },
    { to: "/persons", icon: FaUsers, label: t.persons },
    { to: "/relationships", icon: FaPeopleArrows, label: t.relationships },
    { to: "/search", icon: FaSearch, label: t.search },
    { to: "/documents", icon: FaIdCard, label: t.documents },
    { to: "/files", icon: FaFileAlt, label: t.files },
    { to: "/events", icon: FaCalendarAlt, label: t.events },
    { to: "/addresses", icon: FaMapMarkerAlt, label: t.addresses },
    { to: "/contacts", icon: FaPhoneAlt, label: t.contacts },
    { to: "/users", icon: FaUserShield, label: t.users },
    { to: "/audit-logs", icon: FaClipboardList, label: t.audit },
    { to: "/settings", icon: FaCog, label: t.settings },
  ];

  return (
    <div className={collapsed ? "sidebar collapsed" : "sidebar"}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="logo-container">
            <img src={hero} alt="SNIP Logo" className="logo-image" />
          </div>
        )}

        <button
          className="toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          <FaBars />
        </button>
      </div>

      <ul className="menu">
        {menuItems.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                isActive ? "menu-link active" : "menu-link"
              }
            >
              <Icon className="menu-icon" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {!collapsed && (
        <div className="sidebar-footer">
          <p>{t.version}</p>
          <small>{t.secure}</small>
        </div>
      )}
    </div>
  );
}