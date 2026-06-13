import "../styles/sidebar.css";

import { NavLink } from "react-router-dom";

import hero from "../assets/snipLogo1.png";

import {
  FaTachometerAlt,
  FaUsers,
  FaSearch,
  FaCalendarAlt,
  FaFileAlt,
  FaFolderOpen,
  FaUserShield,
  FaClipboardList,
  FaCog,
  FaBars
} from "react-icons/fa";

export default function Sidebar({
  collapsed,
  setCollapsed
}) {

  return (

    <div
      className={
        collapsed
          ? "sidebar collapsed"
          : "sidebar"
      }
    >

      {/* HEADER */}
      <div className="sidebar-header">

        {!collapsed && (

          <div className="logo-container">

            <img
              src={hero}
              alt="SNIP Logo"
              className="logo-image"
            />

          </div>

        )}

        <button
          className="toggle-btn"
          onClick={() =>
            setCollapsed(!collapsed)
          }
        >
          <FaBars />
        </button>

      </div>

      {/* MENU */}
      <ul className="menu">

        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "menu-link active"
                : "menu-link"
            }
          >
            <FaTachometerAlt className="menu-icon" />
            <span>Tableau de bord</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/persons"
            className={({ isActive }) =>
              isActive
                ? "menu-link active"
                : "menu-link"
            }
          >
            <FaUsers className="menu-icon" />
            <span>Personnes</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              isActive
                ? "menu-link active"
                : "menu-link"
            }
          >
            <FaSearch className="menu-icon" />
            <span>Recherche</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/events"
            className={({ isActive }) =>
              isActive
                ? "menu-link active"
                : "menu-link"
            }
          >
            <FaCalendarAlt className="menu-icon" />
            <span>Événements</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/documents"
            className={({ isActive }) =>
              isActive
                ? "menu-link active"
                : "menu-link"
            }
          >
            <FaFileAlt className="menu-icon" />
            <span>Documents</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/files"
            className={({ isActive }) =>
              isActive
                ? "menu-link active"
                : "menu-link"
            }
          >
            <FaFolderOpen className="menu-icon" />
            <span>Fichiers</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/users"
            className={({ isActive }) =>
              isActive
                ? "menu-link active"
                : "menu-link"
            }
          >
            <FaUserShield className="menu-icon" />
            <span>Utilisateurs & rôles</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/audit-logs"
            className={({ isActive }) =>
              isActive
                ? "menu-link active"
                : "menu-link"
            }
          >
            <FaClipboardList className="menu-icon" />
            <span>Audit logs</span>
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive
                ? "menu-link active"
                : "menu-link"
            }
          >
            <FaCog className="menu-icon" />
            <span>Paramètres</span>
          </NavLink>
        </li>

      </ul>

      {/* FOOTER */}
      {!collapsed && (

        <div className="sidebar-footer">

          <p>SNIP v1.0</p>

          <small>
            Système sécurisé
          </small>

        </div>

      )}

    </div>

  );

}