import "../styles/settings.css";
import { useEffect, useRef, useState } from "react";
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
  FaCogs,
  FaSave,
} from "react-icons/fa";

const API_URL = "http://localhost:5000/api";

const defaultSettings = {
  adminName: "Admin SNIP",
  adminEmail: "admin@snip.mg",
  darkMode: false,
  language: "fr",
  systemNotifications: true,
  securityAlerts: true,
  strongAuth: true,
  systemName: "SNIP",
  version: "v1.0",
  logo: "",
};

function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken") ||
    ""
  );
}

async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Backend non disponible (${response.status})`);
  }

  return response.json();
}

export default function Settings() {
  const fileRef = useRef(null);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("snip_settings");

    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }

    return defaultSettings;
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [backendMessage, setBackendMessage] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    localStorage.setItem("snip_settings", JSON.stringify(settings));

    document.body.classList.toggle("dark-mode", settings.darkMode);
    document.documentElement.setAttribute("data-theme", settings.darkMode ? "dark" : "light");
    document.documentElement.setAttribute("lang", settings.language);
  }, [settings]);

  useEffect(() => {
    loadAdminProfile();
  }, []);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3500);
  };

  const showBackendMessage = (text) => {
    setBackendMessage(text);
    setTimeout(() => setBackendMessage(""), 4500);
  };

  const loadAdminProfile = async () => {
    try {
      setLoadingProfile(true);

      let data;

      try {
        data = await apiRequest("/auth/me");
      } catch {
        data = await apiRequest("/users/me");
      }

      const user = data?.user || data?.data || data;

      setSettings((prev) => ({
        ...prev,
        adminName: user.full_name || user.fullName || user.name || user.username || prev.adminName,
        adminEmail: user.email || prev.adminEmail,
      }));
    } catch {
      showBackendMessage("Profil admin : backend requis ou endpoint non disponible.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const saveProfile = async () => {
    try {
      const payload = {
        full_name: settings.adminName,
        email: settings.adminEmail,
      };

      try {
        await apiRequest("/auth/profile", {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } catch {
        await apiRequest("/users/me", {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }

      showMessage("Profil admin mis à jour.");
    } catch {
      showBackendMessage("Gestion profil admin : mbola mila backend endpoint update profile.");
    }
  };

  const changePassword = async () => {
    if (!passwordForm.oldPassword) return showBackendMessage("Ancien mot de passe obligatoire.");
    if (!passwordForm.newPassword) return showBackendMessage("Nouveau mot de passe obligatoire.");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showBackendMessage("Confirmation mot de passe tsy mitovy.");
    }

    try {
      await apiRequest("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      showMessage("Mot de passe modifié.");
    } catch {
      showBackendMessage("Changer mot de passe : mbola mila backend endpoint /auth/change-password.");
    }
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
    showMessage("Configuration locale sauvegardée.");
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
        showBackendMessage("Fichier configuration invalide.");
      }
    };

    reader.readAsText(file);
  };

  const changeLogo = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      updateSetting("logo", reader.result);
      showMessage("Logo changé localement.");
    };

    reader.readAsDataURL(file);
  };

  return (
    <>
      <Topbar title="Paramètres" />

      <div className="settings-page">
        {message && <div className="settings-success">{message}</div>}
        {backendMessage && <div className="settings-warning">{backendMessage}</div>}

        <div className="settings-grid">
          <div className="settings-card">
            <div className="settings-header">
              <FaUserShield className="settings-icon" />
              <h3>Gestion profil admin</h3>
            </div>

            <div className="settings-content">
              <label>Nom administrateur</label>
              <input
                type="text"
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
                <FaSave /> {loadingProfile ? "Chargement..." : "Mettre à jour"}
              </button>
              <small>Local + backend raha misy endpoint profil.</small>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaLock className="settings-icon" />
              <h3>Changer mot de passe</h3>
            </div>

            <div className="settings-content">
              <label>Ancien mot de passe</label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                }
              />

              <label>Nouveau mot de passe</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
              />

              <label>Confirmation</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
              />

              <button onClick={changePassword}>Modifier</button>
              <small>Mbola mila backend raha tsy misy `/auth/change-password`.</small>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaMoon className="settings-icon" />
              <h3>Mode sombre / clair</h3>
            </div>

            <div className="settings-content">
              <div className="switch-row">
                <span>Activer mode sombre</span>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => updateSetting("darkMode", e.target.checked)}
                />
              </div>
              <small>Miasa frontend avy hatrany.</small>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaGlobe className="settings-icon" />
              <h3>Choix langue</h3>
            </div>

            <div className="settings-content">
              <select
                value={settings.language}
                onChange={(e) => updateSetting("language", e.target.value)}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
              <small>Miasa local. Traduction complète mila système i18n.</small>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaBell className="settings-icon" />
              <h3>Notifications</h3>
            </div>

            <div className="settings-content">
              <div className="switch-row">
                <span>Notifications système</span>
                <input
                  type="checkbox"
                  checked={settings.systemNotifications}
                  onChange={(e) =>
                    updateSetting("systemNotifications", e.target.checked)
                  }
                />
              </div>

              <div className="switch-row">
                <span>Alertes sécurité</span>
                <input
                  type="checkbox"
                  checked={settings.securityAlerts}
                  onChange={(e) => updateSetting("securityAlerts", e.target.checked)}
                />
              </div>

              <small>Miasa local. Notification serveur mila backend.</small>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaUsersCog className="settings-icon" />
              <h3>Rôles & permissions</h3>
            </div>

            <div className="settings-content">
              <select defaultValue="Administrateur">
                <option>Administrateur</option>
                <option>Gestionnaire</option>
                <option>Consultation</option>
              </select>

              <button onClick={() => showBackendMessage("Rôles & permissions : mampiasa backend Users/Roles no tena ilaina.")}>
                Gérer permissions
              </button>
              <small>Mila backend ho an’ny permissions tena izy.</small>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaDatabase className="settings-icon" />
              <h3>Sauvegarde données</h3>
            </div>

            <div className="settings-content">
              <button onClick={exportSettings}>Sauvegarder configuration locale</button>

              <button onClick={() => fileRef.current?.click()}>
                Restaurer configuration locale
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => importSettings(e.target.files?.[0])}
              />

              <small>Sauvegarde base de données mila backend.</small>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaShieldAlt className="settings-icon" />
              <h3>Sécurité système</h3>
            </div>

            <div className="settings-content">
              <div className="switch-row">
                <span>Authentification renforcée</span>
                <input
                  type="checkbox"
                  checked={settings.strongAuth}
                  onChange={(e) => updateSetting("strongAuth", e.target.checked)}
                />
              </div>
              <small>Miasa local. 2FA/contrôle réel mila backend.</small>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaImage className="settings-icon" />
              <h3>Logo système</h3>
            </div>

            <div className="settings-content">
              {settings.logo && (
                <img src={settings.logo} alt="Logo SNIP" className="settings-logo-preview" />
              )}

              <input type="file" accept="image/*" onChange={(e) => changeLogo(e.target.files?.[0])} />
              <button onClick={() => showMessage("Logo sauvegardé localement.")}>
                Changer logo
              </button>
              <small>Logo permanent ho an’ny rehetra mila backend/upload.</small>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaCogs className="settings-icon" />
              <h3>Configuration générale</h3>
            </div>

            <div className="settings-content">
              <label>Nom système</label>
              <input
                type="text"
                value={settings.systemName}
                onChange={(e) => updateSetting("systemName", e.target.value)}
              />

              <label>Version</label>
              <input type="text" value={settings.version} readOnly />

              <button onClick={() => showMessage("Configuration générale sauvegardée localement.")}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}