import "./../styles/login.css";
import logo from "../assets/snipLogo1.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "../services/api";

export default function Login() {
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
      setError("Le nom d'utilisateur est obligatoire.");
      return;
    }

    if (!formData.password.trim()) {
      setError("Le mot de passe est obligatoire.");
      return;
    }

    try {
      setLoading(true);
      await authApi.login(formData);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Nom d'utilisateur ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={logo} alt="Logo SNIP" className="login-logo" />

        <div className="security-note">
          <p>Accès réservé aux utilisateurs autorisés.</p>
          <p>Toutes les actions sont journalisées.</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-box">
          <h2>Connexion</h2>
          <p className="subtitle">Connectez-vous à votre compte</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Nom d'utilisateur</label>

              <input
                type="text"
                name="username"
                placeholder="Nom d'utilisateur"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="input-group">
              <label>Mot de passe</label>

              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Mot de passe"
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
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
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

                <span>Se souvenir de moi</span>
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
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>SNIP v1.0</p>
            <p>© 2026 - Système sécurisé</p>
          </div>
        </div>
      </div>
    </div>
  );
}