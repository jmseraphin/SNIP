import "./../styles/login.css";
import rcr from "../assets/snipLogo1.png";

import { useState } from "react";

import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login({ onLogin }) {

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    // VALIDATION
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

          // Simulation backend
      await new Promise((resolve) =>
        setTimeout(resolve, 1500)
      );

      // LOGIN SUCCESS
      onLogin();

    } catch (err) {

      setError(
        err.message ||
        "Nom d'utilisateur ou mot de passe incorrect."
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="login-container">

      {/* LEFT SIDE */}
      <div className="login-left">

        <img
          src={rcr}
          alt="Logo SNIP"
          className="login-logo"
        />

      
        <div className="security-note">

          <p>
            Accès réservé aux utilisateurs autorisés.
          </p>

          <p>
            Toutes les actions sont journalisées.
          </p>

        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">

        <div className="login-box">

          <h2>Connexion</h2>

          <p className="subtitle">
            Connectez-vous à votre compte
          </p>

          {/* ERROR MESSAGE */}
          {
            error && (
              <div className="login-error">
                {error}
              </div>
            )
          }

          <form onSubmit={handleSubmit}>

            {/* USERNAME */}
            <div className="input-group">

              <label>
                Nom d'utilisateur
              </label>

              <input
                type="text"
                name="username"
                placeholder="admin"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />

            </div>

            {/* PASSWORD */}
            <div className="input-group">

              <label>
                Mot de passe
              </label>

              <div
                style={{
                  position: "relative"
                }}
              >

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />

                <div
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center"
                  }}
                >

                  {
                    showPassword
                      ? <EyeOff size={20} />
                      : <Eye size={20} />
                  }

                </div>

              </div>

            </div>

            {/* OPTIONS */}
            <div className="login-options">

              <label className="remember-me">

                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />

                <span>
                  Se souvenir de moi
                </span>

              </label>

              <a
                href="/forgot-password"
                className="forgot-password"
              >
                Mot de passe oublié ?
              </a>

            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={
                loading
                  ? "loading-btn"
                  : ""
              }
            >

              {
                loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="spinner"
                    />

                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )
              }

            </button>

          </form>

          {/* FOOTER */}
          <div className="login-footer">

            <p>
              SNIP v1.0
            </p>

            <p>
              © 2026 - Système sécurisé
            </p>

          </div>

        </div>

      </div>

    </div>

  );

}