import "../styles/settings.css";
import { useEffect, useRef, useState } from "react";
import Topbar from "../components/Topbar";
import { t, setLang, useLang } from "../i18n";
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

const defaultSettings = {
  adminName: "Admin SNIP",
  adminEmail: "admin@snip.mg",
  darkMode:
    localStorage.getItem("snip_dark_mode") === "true" ||
    localStorage.getItem("snip_theme") === "dark",
  language: localStorage.getItem("snip_lang") || "fr",
  systemNotifications: true,
  securityAlerts: true,
  strongAuth: true,
  systemName: "SNIP",
  version: "v1.0",
  logo: "",
};

function applyTheme(isDark) {
  const theme = isDark ? "dark" : "light";

  localStorage.setItem("snip_theme", theme);
  localStorage.setItem("snip_dark_mode", isDark ? "true" : "false");

  document.documentElement.classList.toggle("dark-mode", isDark);
  document.body.classList.toggle("dark-mode", isDark);
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);

  window.dispatchEvent(new CustomEvent("snip-theme-change", { detail: theme }));
  window.dispatchEvent(new Event("snip-preferences-changed"));
}

export default function Settings() {
  const lang = useLang();
  const fileRef = useRef(null);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("snip_settings");

    if (!saved) {
      return {
        ...defaultSettings,
        language: localStorage.getItem("snip_lang") || "fr",
      };
    }

    try {
      return {
        ...defaultSettings,
        ...JSON.parse(saved),
        language: localStorage.getItem("snip_lang") || "fr",
      };
    } catch {
      return {
        ...defaultSettings,
        language: localStorage.getItem("snip_lang") || "fr",
      };
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    setSettings((previous) => ({
      ...previous,
      language: lang,
    }));
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("snip_settings", JSON.stringify(settings));
    applyTheme(settings.darkMode);
  }, [settings]);

  const updateSetting = (key, value) => {
    if (key === "language") {
      setLang(value);
      setSettings((previous) => ({ ...previous, language: value }));
      return;
    }

    setSettings((previous) => ({ ...previous, [key]: value }));
  };

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const saveProfile = () => {
    showMessage(
      lang === "en"
        ? "Profile saved locally. Backend required for real update."
        : "Profil sauvegardé localement. Backend requis pour la mise à jour réelle."
    );
  };

  const changePassword = () => {
    showMessage(t("settings.backendRequired"));

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

    showMessage(
      lang === "en" ? "Configuration saved." : "Configuration sauvegardée."
    );
  };

  const importSettings = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const next = {
          ...defaultSettings,
          ...data,
          language: data.language || lang,
        };

        setSettings(next);
        setLang(next.language);

        showMessage(
          lang === "en" ? "Configuration restored." : "Configuration restaurée."
        );
      } catch {
        showMessage(lang === "en" ? "Invalid file." : "Fichier invalide.");
      }
    };

    reader.readAsText(file);
  };

  const changeLogo = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      updateSetting("logo", reader.result);

      showMessage(
        lang === "en"
          ? "Logo saved locally."
          : "Logo sauvegardé localement."
      );
    };

    reader.readAsDataURL(file);
  };

  return (
    <>
      <Topbar title={t("settings.title")} />

      <div className="settings-page">
        {message && <div className="settings-message">{message}</div>}

        <div className="settings-grid">
          <div className="settings-card">
            <div className="settings-header">
              <FaUserShield className="settings-icon" />
              <h3>{t("settings.adminProfile")}</h3>
            </div>

            <div className="settings-content">
              <label>{t("settings.adminName")}</label>
              <input
                value={settings.adminName}
                onChange={(event) =>
                  updateSetting("adminName", event.target.value)
                }
              />

              <label>{t("settings.email")}</label>
              <input
                type="email"
                value={settings.adminEmail}
                onChange={(event) =>
                  updateSetting("adminEmail", event.target.value)
                }
              />

              <button type="button" onClick={saveProfile}>
                <FaSave /> {t("settings.update")}
              </button>
            </div>
          </div>

          <div className="settings-card backend-required">
            <div className="settings-header">
              <FaLock className="settings-icon" />
              <h3>{t("settings.password")}</h3>
              <span>{t("settings.backendRequired")}</span>
            </div>

            <div className="settings-content">
              <label>{t("settings.oldPassword")}</label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    oldPassword: event.target.value,
                  })
                }
              />

              <label>{t("settings.newPassword")}</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: event.target.value,
                  })
                }
              />

              <label>{t("settings.confirmation")}</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: event.target.value,
                  })
                }
              />

              <button type="button" onClick={changePassword}>
                {t("common.edit")}
              </button>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaMoon className="settings-icon" />
              <h3>{t("settings.darkLight")}</h3>
            </div>

            <div className="settings-content">
              <div className="switch-row">
                <span>{t("settings.enableDark")}</span>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(event) =>
                    updateSetting("darkMode", event.target.checked)
                  }
                />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaGlobe className="settings-icon" />
              <h3>{t("settings.language")}</h3>
            </div>

            <div className="settings-content">
              <select
                value={lang}
                onChange={(event) =>
                  updateSetting("language", event.target.value)
                }
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaBell className="settings-icon" />
              <h3>{t("settings.notifications")}</h3>
            </div>

            <div className="settings-content">
              <div className="switch-row">
                <span>{t("settings.systemNotifications")}</span>
                <input
                  type="checkbox"
                  checked={settings.systemNotifications}
                  onChange={(event) =>
                    updateSetting("systemNotifications", event.target.checked)
                  }
                />
              </div>

              <div className="switch-row">
                <span>{t("settings.securityAlerts")}</span>
                <input
                  type="checkbox"
                  checked={settings.securityAlerts}
                  onChange={(event) =>
                    updateSetting("securityAlerts", event.target.checked)
                  }
                />
              </div>
            </div>
          </div>

          <div className="settings-card backend-required">
            <div className="settings-header">
              <FaUsersCog className="settings-icon" />
              <h3>{t("settings.roles")}</h3>
              <span>{t("settings.backendRequired")}</span>
            </div>

            <div className="settings-content">
              <select>
                <option>Administrateur</option>
                <option>Gestionnaire</option>
                <option>Consultation</option>
              </select>

              <button
                type="button"
                onClick={() => showMessage(t("settings.backendRequired"))}
              >
                {t("settings.managePermissions")}
              </button>
            </div>
          </div>

          <div className="settings-card backend-required">
            <div className="settings-header">
              <FaDatabase className="settings-icon" />
              <h3>{t("settings.backup")}</h3>
              <span>{t("settings.backendRequired")}</span>
            </div>

            <div className="settings-content">
              <button type="button" onClick={exportSettings}>
                {t("settings.exportLocal")}
              </button>

              <button type="button" onClick={() => fileRef.current?.click()}>
                {t("settings.importLocal")}
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(event) => importSettings(event.target.files?.[0])}
              />
            </div>
          </div>

          <div className="settings-card backend-required">
            <div className="settings-header">
              <FaShieldAlt className="settings-icon" />
              <h3>{t("settings.security")}</h3>
              <span>{t("settings.backendRequired")}</span>
            </div>

            <div className="settings-content">
              <div className="switch-row">
                <span>{t("settings.strongAuth")}</span>
                <input
                  type="checkbox"
                  checked={settings.strongAuth}
                  onChange={(event) =>
                    updateSetting("strongAuth", event.target.checked)
                  }
                />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaImage className="settings-icon" />
              <h3>{t("settings.logo")}</h3>
            </div>

            <div className="settings-content">
              {settings.logo && (
                <img
                  src={settings.logo}
                  alt="SNIP logo"
                  className="settings-logo-preview"
                />
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(event) => changeLogo(event.target.files?.[0])}
              />
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-header">
              <FaCogs className="settings-icon" />
              <h3>{t("settings.general")}</h3>
            </div>

            <div className="settings-content">
              <label>{t("settings.systemName")}</label>
              <input
                value={settings.systemName}
                onChange={(event) =>
                  updateSetting("systemName", event.target.value)
                }
              />

              <label>{t("settings.version")}</label>
              <input value={settings.version} readOnly />

              <button
                type="button"
                onClick={() =>
                  showMessage(
                    lang === "en"
                      ? "Saved locally."
                      : "Sauvegardé localement."
                  )
                }
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}