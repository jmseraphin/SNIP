import "../styles/Topbar.css";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

import {
  FaBell,
  FaThLarge,
  FaMoon,
  FaSun,
} from "react-icons/fa";

import {
  useState,
  useRef,
  useEffect,
} from "react";

export default function Topbar({ title }) {
  const navigate = useNavigate();

  /* USER MENU */
  const [openMenu, setOpenMenu] = useState(false);

  /* NOTIFICATION */
  const [openNotif, setOpenNotif] = useState(false);

  /* THEME */
  const [darkMode, setDarkMode] = useState(false);

  /* LANGUAGE */
  const [language, setLanguage] = useState("FR");

  /* BADGE */
  const [notifications, setNotifications] = useState([
    "Nouvel utilisateur ajouté",
    "Document importé",
    "Mise à jour système"
  ]);

  const menuRef = useRef();

  const notifRef = useRef();

  /* DARK MODE */
  useEffect(() => {

    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

  }, [darkMode]);

  /* CLOSE OUTSIDE */
  useEffect(() => {

    function handleClickOutside(event) {

      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenu(false);
      }

      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setOpenNotif(false);
      }

    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, []);

  /* NOTIFICATION */
  function handleNotification() {

    setOpenNotif(!openNotif);

    if (notifications.length > 0) {
      setNotifications([]);
    }

  }

  return (

    <div className="topbar">

      {/* TITLE */}
      <div className="topbar-title">

        <FaThLarge className="title-icon" />

        <h2>{title}</h2>

      </div>

      <div className="topbar-right">

        {/* LANGUAGE */}
        <button
          className="topbar-btn"
          onClick={() =>
            setLanguage(
              language === "FR"
                ? "EN"
                : "FR"
            )
          }
        >
          {language}
        </button>

        {/* DARK MODE */}
        <button
          className="topbar-btn"
          onClick={() =>
            setDarkMode(!darkMode)
          }
        >

          {darkMode
            ? <FaSun />
            : <FaMoon />
          }

        </button>

        {/* NOTIFICATION */}
        <div
          className="notification-wrapper"
          ref={notifRef}
        >

          <div
            className="notification-box"
            onClick={handleNotification}
          >

            <FaBell className="bell-icon" />

            {notifications.length > 0 && (

              <span className="notification-badge">
                {notifications.length}
              </span>

            )}

          </div>

          {openNotif && (

            <div className="notification-dropdown">

              <h4>
                Notifications
              </h4>

              <p className="empty-notif">
                Aucune notification
              </p>

            </div>

          )}

        </div>

        {/* USER */}
        <div
          className="user-menu"
          ref={menuRef}
        >

          <div
            className="avatar-placeholder"
            onClick={() =>
              setOpenMenu(!openMenu)
            }
          >
            👤
          </div>

          {openMenu && (

            <div className="dropdown-menu">

              <h4>Admin User</h4>

              <p>ADMIN</p>

              <hr />

              <Link
               to="/settings"
               className="dropdown-link"
              >
               Paramètres
              </Link>

              <button className="dropdown-link" onClick={() => { authApi.logout(); navigate("/login", { replace: true }); }}>Déconnexion</button>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}