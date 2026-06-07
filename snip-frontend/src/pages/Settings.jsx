import "../styles/settings.css";
import Topbar from "../components/Topbar";

import {
  FaUserShield,
  FaLock,
  FaMoon,
  FaGlobe,
  FaBell,
  FaUsersCog,
  FaDatabase,
  FaShieldAlt,
  FaImage,
  FaCogs
} from "react-icons/fa";

export default function Settings() {

  return (

    <>

      <Topbar title="Paramètres" />

      <div className="settings-grid">

        {/* PROFIL ADMIN */}
        <div className="settings-card">
          <div className="settings-header">
            <FaUserShield className="settings-icon" />
            <h3>Gestion profil admin</h3>
          </div>

          <div className="settings-content">
            <label>Nom administrateur</label>
            <input type="text" placeholder="Admin SNIP" />

            <label>Email</label>
            <input type="email" placeholder="admin@snip.mg" />

            <button>Mettre à jour</button>
          </div>
        </div>

        {/* PASSWORD */}
        <div className="settings-card">
          <div className="settings-header">
            <FaLock className="settings-icon" />
            <h3>Changer mot de passe</h3>
          </div>

          <div className="settings-content">
            <label>Ancien mot de passe</label>
            <input type="password" />

            <label>Nouveau mot de passe</label>
            <input type="password" />

            <label>Confirmation</label>
            <input type="password" />

            <button>Modifier</button>
          </div>
        </div>

        {/* DARK MODE */}
        <div className="settings-card">
          <div className="settings-header">
            <FaMoon className="settings-icon" />
            <h3>Mode sombre / clair</h3>
          </div>

          <div className="settings-content">
            <div className="switch-row">
              <span>Activer mode sombre</span>
              <input type="checkbox" />
            </div>
          </div>
        </div>

        {/* LANGUAGE */}
        <div className="settings-card">
          <div className="settings-header">
            <FaGlobe className="settings-icon" />
            <h3>Choix langue</h3>
          </div>

          <div className="settings-content">
            <select>
              <option>Français</option>
              <option>English</option>
            </select>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className="settings-card">
          <div className="settings-header">
            <FaBell className="settings-icon" />
            <h3>Notifications</h3>
          </div>

          <div className="settings-content">
            <div className="switch-row">
              <span>Notifications système</span>
              <input type="checkbox" defaultChecked />
            </div>

            <div className="switch-row">
              <span>Alertes sécurité</span>
              <input type="checkbox" defaultChecked />
            </div>
          </div>
        </div>

        {/* ROLES */}
        <div className="settings-card">
          <div className="settings-header">
            <FaUsersCog className="settings-icon" />
            <h3>Rôles & permissions</h3>
          </div>

          <div className="settings-content">
            <select>
              <option>Administrateur</option>
              <option>Gestionnaire</option>
              <option>Consultation</option>
            </select>

            <button>Gérer permissions</button>
          </div>
        </div>

        {/* BACKUP */}
        <div className="settings-card">
          <div className="settings-header">
            <FaDatabase className="settings-icon" />
            <h3>Sauvegarde données</h3>
          </div>

          <div className="settings-content">
            <button>Sauvegarder</button>
            <button>Restaurer</button>
          </div>
        </div>

        {/* SECURITY */}
        <div className="settings-card">
          <div className="settings-header">
            <FaShieldAlt className="settings-icon" />
            <h3>Sécurité système</h3>
          </div>

          <div className="settings-content">
            <div className="switch-row">
              <span>Authentification renforcée</span>
              <input type="checkbox" defaultChecked />
            </div>
          </div>
        </div>

        {/* LOGO */}
        <div className="settings-card">
          <div className="settings-header">
            <FaImage className="settings-icon" />
            <h3>Logo système</h3>
          </div>

          <div className="settings-content">
            <input type="file" />
            <button>Changer logo</button>
          </div>
        </div>

        {/* GENERAL */}
        <div className="settings-card">
          <div className="settings-header">
            <FaCogs className="settings-icon" />
            <h3>Configuration générale</h3>
          </div>

          <div className="settings-content">
            <label>Nom système</label>
            <input type="text" value="SNIP" readOnly />

            <label>Version</label>
            <input type="text" value="v1.0" readOnly />
          </div>
        </div>

      </div>

    </>

  );

}