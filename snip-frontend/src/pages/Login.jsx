import "./../styles/login.css";
import logo from "../assets/snipLogo1.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "../services/api";
import { useLang } from "../i18n";

function label(lang, fr, en) {
  return lang === "en" ? en : fr;
}

export default function Login() {
  const lang = useLang();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.username.trim()) {
      setError(
        label(
          lang,
          "Le nom d'utilisateur est obligatoire.",
          "Username is required."
        )
      );
      return;
    }

    if (!formData.password.trim()) {
      setError(
        label(
          lang,
          "Le mot de passe est obligatoire.",
          "Password is required."
        )
      );
      return;
    }

    try {
      setLoading(true);
      await authApi.login(formData);
      navigate("/", { replace: true });
    } catch (error) {
      setError(
        error.message ||
          label(
            lang,
            "Nom d'utilisateur ou mot de passe incorrect.",
            "Incorrect username or password."
          )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={logo} alt="Logo SNIP" className="login-logo" />

        <div className="security-note">
          <p>
            {label(
              lang,
              "Accès réservé aux utilisateurs autorisés.",
              "Access restricted to authorized users."
            )}
          </p>
          <p>
            {label(
              lang,
              "Toutes les actions sont journalisées.",
              "All actions are logged."
            )}
          </p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-box">
          <h2>{label(lang, "Connexion", "Login")}</h2>
          <p className="subtitle">
            {label(
              lang,
              "Connectez-vous à votre compte",
              "Sign in to your account"
            )}
          </p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>{label(lang, "Nom d'utilisateur", "Username")}</label>

              <input
                type="text"
                name="username"
                placeholder={label(lang, "Nom d'utilisateur", "Username")}
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="input-group">
              <label>{label(lang, "Mot de passe", "Password")}</label>

              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={label(lang, "Mot de passe", "Password")}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={
                    showPassword
                      ? label(lang, "Masquer le mot de passe", "Hide password")
                      : label(lang, "Afficher le mot de passe", "Show password")
                  }
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />

                <span>{label(lang, "Se souvenir de moi", "Remember me")}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={loading ? "loading-btn" : ""}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  {label(lang, "Connexion...", "Signing in...")}
                </>
              ) : (
                label(lang, "Se connecter", "Sign in")
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>SNIP v1.0</p>
            <p>
              © 2026 -{" "}
              {label(lang, "Système sécurisé", "Secure system")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}