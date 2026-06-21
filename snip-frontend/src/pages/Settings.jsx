import "../styles/settings.css";
import { useEffect, useRef, useState } from "react";
import Topbar from "../components/Topbar";
import {
  FaUserShield, FaLock, FaMoon, FaGlobe, FaBell,
  FaUsersCog, FaDatabase, FaShieldAlt, FaImage, FaCogs, FaSave
} from "react-icons/fa";

const defaultSettings = {
  adminName: "Admin SNIP",
  adminEmail: "admin@snip.mg",
  darkMode: localStorage.getItem("snip_theme") === "dark",
  language: localStorage.getItem("snip_lang") || "fr",
  systemNotifications: true,
  securityAlerts: true,
  strongAuth: true,
  systemName: "SNIP",
  version: "v1.0",
  logo: "",
};

function applyGlobalPreferences(next) {
  localStorage.setItem("snip_theme", next.darkMode ? "dark" : "light");
  localStorage.setItem("snip_lang", next.language);

  document.documentElement.setAttribute("data-theme", next.darkMode ? "dark" : "light");
  document.body.classList.toggle("dark-mode", next.darkMode);
  document.documentElement.setAttribute("lang", next.language);

  window.dispatchEvent(new Event("snip-preferences-changed"));
}

export default function Settings() {
  const fileRef = useRef(null);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("snip_settings");
    if (!saved) return defaultSettings;

    try {
      return { ...defaultSettings, ...JSON.parse(saved) };
    } catch {
      return defaultSettings;
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("snip_settings", JSON.stringify(settings));
    applyGlobalPreferences(settings);
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const saveProfile = () => {
    showMessage("Profil sauvegardé localement. Backend requis pour la mise à jour réelle.");
  };

  const changePassword = () => {
    showMessage("Backend requis");
    setPasswordForm({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "snip-settings.json";
    link.click();

    URL.revokeObjectURL(url);
    showMessage("Configuration sauvegardée.");
  };

  const importSettings = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        setSettings({ ...defaultSettings, ...data });
        showMessage("Configuration restaurée.");
      } catch {
        showMessage("Fichier invalide.");
      }
    };

    reader.readAsText(file);
  };

  const changeLogo = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      updateSetting("logo", reader.result);
      showMessage("Logo sauvegardé localement.");
    };

    reader.readAsDataURL(file);
  };

  return (
    <>
      <Topbar title={settings.language === "en" ? "Settings" : "Paramètres"} />

      <div className="settings-page">
        {message && <div className="settings-message">{message}</div>}

        <div className="settings-grid">
          <div className="settings-card">
            <div className="settings-header">
              <FaUserShield className="settings-icon" />
              <h3>{settings.language === "en" ? "Admin profile" : "Gestion profil admin"}</h3>
            </div>

            <div className="settings-content">
              <label>{settings.language === "en" ? "Administrator name" : "Nom administrateur"}</label>
              <input
                value={settings.adminName}
                onChange={(e) => updateSetting("adminName", e.target.value)}
              />

              <label>Email</label>
              <input
                type="email"
                value={settings.adminEmail}
                onChange={(e) => updateSetting("adminEmail", e.target.value)}
              />

              <button onClick={saveProfile}>
                <FaSave /> {settings.language === "en" ? "Update" : "Mettre à jour"}
              </button>
            </div>
          </div>

          <div className="settings-card backend-required">
            <div className="settings-header">
              <FaLock className="settings-icon" />
              <h3>{settings.language === "en" ? "Change password" : "Changer mot de passe"}</h3>
              <span>Backend requis</span>
            </div>

            <div className="settings-content">
              <label>{settings.language === "en" ? "Old password" : "Ancien mot de passe"}</label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              />

              <label>{settings.language === "en" ? "New password" : "Nouveau mot de passe"}</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />

              <label>{settings.language === "en" ? "Confirmation" : "Confirmation"}</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />

              <button onClick={changePassword}>
                {settings.language === "en" ? "Change" : "Modifier"}
              </button>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaMoon className="settings-icon" />
              <h3>{settings.language === "en" ? "Dark / light mode" : "Mode sombre / clair"}</h3>
            </div>

            <div className="settings-content">
              <div className="switch-row">
                <span>{settings.language === "en" ? "Enable dark mode" : "Activer mode sombre"}</span>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => updateSetting("darkMode", e.target.checked)}
                />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaGlobe className="settings-icon" />
              <h3>{settings.language === "en" ? "Language" : "Choix langue"}</h3>
            </div>

            <div className="settings-content">
              <select
                value={settings.language}
                onChange={(e) => updateSetting("language", e.target.value)}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaBell className="settings-icon" />
              <h3>{settings.language === "en" ? "Notifications" : "Notifications"}</h3>
            </div>

            <div className="settings-content">
              <div className="switch-row">
                <span>{settings.language === "en" ? "System notifications" : "Notifications système"}</span>
                <input
                  type="checkbox"
                  checked={settings.systemNotifications}
                  onChange={(e) => updateSetting("systemNotifications", e.target.checked)}
                />
              </div>

              <div className="switch-row">
                <span>{settings.language === "en" ? "Security alerts" : "Alertes sécurité"}</span>
                <input
                  type="checkbox"
                  checked={settings.securityAlerts}
                  onChange={(e) => updateSetting("securityAlerts", e.target.checked)}
                />
              </div>
            </div>
          </div>

          <div className="settings-card backend-required">
            <div className="settings-header">
              <FaUsersCog className="settings-icon" />
              <h3>{settings.language === "en" ? "Roles & permissions" : "Rôles & permissions"}</h3>
              <span>Backend requis</span>
            </div>

            <div className="settings-content">
              <select>
                <option>Administrateur</option>
                <option>Gestionnaire</option>
                <option>Consultation</option>
              </select>

              <button onClick={() => showMessage("Backend requis")}>
                {settings.language === "en" ? "Manage permissions" : "Gérer permissions"}
              </button>
            </div>
          </div>

          <div className="settings-card backend-required">
            <div className="settings-header">
              <FaDatabase className="settings-icon" />
              <h3>{settings.language === "en" ? "Data backup" : "Sauvegarde données"}</h3>
              <span>Backend requis</span>
            </div>

            <div className="settings-content">
              <button onClick={exportSettings}>
                {settings.language === "en" ? "Export local settings" : "Sauvegarder configuration locale"}
              </button>

              <button onClick={() => fileRef.current?.click()}>
                {settings.language === "en" ? "Import local settings" : "Restaurer configuration locale"}
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => importSettings(e.target.files?.[0])}
              />
            </div>
          </div>

          <div className="settings-card backend-required">
            <div className="settings-header">
              <FaShieldAlt className="settings-icon" />
              <h3>{settings.language === "en" ? "System security" : "Sécurité système"}</h3>
              <span>Backend requis</span>
            </div>

            <div className="settings-content">
              <div className="switch-row">
                <span>{settings.language === "en" ? "Enhanced authentication" : "Authentification renforcée"}</span>
                <input
                  type="checkbox"
                  checked={settings.strongAuth}
                  onChange={(e) => updateSetting("strongAuth", e.target.checked)}
                />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaImage className="settings-icon" />
              <h3>{settings.language === "en" ? "System logo" : "Logo système"}</h3>
            </div>

            <div className="settings-content">
              {settings.logo && (
                <img src={settings.logo} alt="SNIP logo" className="settings-logo-preview" />
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => changeLogo(e.target.files?.[0])}
              />
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaCogs className="settings-icon" />
              <h3>{settings.language === "en" ? "General configuration" : "Configuration générale"}</h3>
            </div>

            <div className="settings-content">
              <label>{settings.language === "en" ? "System name" : "Nom système"}</label>
              <input
                value={settings.systemName}
                onChange={(e) => updateSetting("systemName", e.target.value)}
              />

              <label>Version</label>
              <input value={settings.version} readOnly />

              <button onClick={() => showMessage(settings.language === "en" ? "Saved locally." : "Sauvegardé localement.")}>
                {settings.language === "en" ? "Save" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}