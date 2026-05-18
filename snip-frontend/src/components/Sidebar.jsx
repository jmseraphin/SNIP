import "../styles/sidebar.css";

import { NavLink } from "react-router-dom";

import hero from "../assets/hero.png";

import {
  FaTachometerAlt,
  FaUsers,
  FaSearch,
  FaCalendarAlt,
  FaFileAlt,
  FaFolderOpen,
  FaUserShield,
  FaClipboardList,
  FaCog
} from "react-icons/fa";

export default function Sidebar() {

  return (

    <div className="sidebar">

      {/* LOGO */}
      <div className="sidebar-header">

        <div className="logo-container">

          <img
            src={hero}
            alt="SNIP Logo"
            className="logo-image"
          />

          <h1 className="logo">
            SNIP
          </h1>

        </div>

        <p className="system-name">
          Système National
          d’Information Personnel
        </p>

      </div>

      {/* MENU */}
      <ul className="menu">

        {/* DASHBOARD */}
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

            <span>
              Tableau de bord
            </span>

          </NavLink>

        </li>

        {/* PERSONS */}
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

            <span>
              Personnes
            </span>

          </NavLink>

        </li>

        {/* SEARCH */}
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

            <span>
              Recherche
            </span>

          </NavLink>

        </li>

        {/* EVENTS */}
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

            <span>
              Événements
            </span>

          </NavLink>

        </li>

        {/* DOCUMENTS */}
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

            <span>
              Documents
            </span>

          </NavLink>

        </li>

        {/* FILES */}
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

            <span>
              Fichiers
            </span>

          </NavLink>

        </li>

        {/* USERS */}
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

            <span>
              Utilisateurs & rôles
            </span>

          </NavLink>

        </li>

        {/* AUDIT */}
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

            <span>
              Audit logs
            </span>

          </NavLink>

        </li>

        {/* SETTINGS */}
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

            <span>
              Paramètres
            </span>

          </NavLink>

        </li>

      </ul>

      {/* FOOTER */}
      <div className="sidebar-footer">

        <p>
          SNIP v1.0
        </p>

        <small>
          Système sécurisé
        </small>

      </div>

    </div>

  );

}