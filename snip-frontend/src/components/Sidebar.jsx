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
import { t, useLang } from "../i18n";

export default function Sidebar({ collapsed, setCollapsed }) {
  const lang = useLang();

  const menuItems = [
    {
      to: "/",
      icon: FaTachometerAlt,
      label: t("menu.dashboard"),
    },
    {
      to: "/persons",
      icon: FaUsers,
      label: t("menu.persons"),
    },
    {
      to: "/relationships",
      icon: FaPeopleArrows,
      label: t("menu.relationships"),
    },
    {
      to: "/search",
      icon: FaSearch,
      label: t("menu.search"),
    },
    {
      to: "/documents",
      icon: FaIdCard,
      label: t("menu.documents"),
    },
    {
      to: "/files",
      icon: FaFileAlt,
      label: t("menu.files"),
    },
    {
      to: "/events",
      icon: FaCalendarAlt,
      label: t("menu.events"),
    },
    {
      to: "/addresses",
      icon: FaMapMarkerAlt,
      label: t("menu.addresses"),
    },
    {
      to: "/contacts",
      icon: FaPhoneAlt,
      label: t("menu.contacts"),
    },
    {
      to: "/users",
      icon: FaUserShield,
      label: t("menu.users"),
    },
    {
      to: "/audit-logs",
      icon: FaClipboardList,
      label: t("menu.audit"),
    },
    {
      to: "/settings",
      icon: FaCog,
      label: t("menu.settings"),
    },
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
          type="button"
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
          <p>{t("app.version")}</p>
          <small>{t("app.secure")}</small>
        </div>
      )}
    </div>
  );
}