import "../styles/persons.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import { personsApi } from "../services/api";
import { fmtDate, fullName, nationalId, phone } from "../utils/format";
import {
  FaArrowLeft,
  FaUser,
  FaIdCard,
  FaPhone,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaFlag,
  FaVenusMars,
  FaInfoCircle,
} from "react-icons/fa";

export default function PersonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await personsApi.get(id);
      setPerson(res.data || res.person || res);
    } catch {
      setPerson(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  return (
    <>
      <Topbar title="Détails de la personne" />

      <div className="person-details-page">
        <button className="back-btn" onClick={() => navigate("/persons")}>
          <FaArrowLeft /> Retour aux personnes
        </button>

        {loading && (
          <div className="details-card">
            <p>Chargement des informations...</p>
          </div>
        )}

        {!loading && !person && (
          <div className="details-card">
            <h3>Personne introuvable</h3>
            <p>Aucune donnée disponible pour cette personne.</p>
          </div>
        )}

        {!loading && person && (
          <div className="details-card pro-details">
            <div className="details-header">
              <div className="details-avatar">
                {fullName(person).charAt(0).toUpperCase()}
              </div>

              <div>
                <h2>{fullName(person)}</h2>
                <p>Fiche individuelle enregistrée dans le système SNIP</p>
              </div>

              <span
                className={
                  (person.status || "active") === "active"
                    ? "status active"
                    : "status inactive"
                }
              >
                {person.status || "active"}
              </span>
            </div>

            <div className="details-grid">
              <Info
                icon={<FaIdCard />}
                label="CIN / Identifiant national"
                value={nationalId(person)}
              />

              <Info
                icon={<FaPhone />}
                label="Téléphone"
                value={phone(person)}
              />

              <Info
                icon={<FaVenusMars />}
                label="Sexe"
                value={person.gender || person.sexe || "—"}
              />

              <Info
                icon={<FaCalendarAlt />}
                label="Date de naissance"
                value={fmtDate(person.birth_date || person.birthDate)}
              />

              <Info
                icon={<FaMapMarkerAlt />}
                label="Lieu de naissance"
                value={person.birth_place || person.birthPlace || "—"}
              />

              <Info
                icon={<FaFlag />}
                label="Nationalité"
                value={person.nationality || "—"}
              />

              <Info icon={<FaUser />} label="Nom" value={person.last_name || "—"} />

              <Info
                icon={<FaUser />}
                label="Prénom"
                value={person.first_name || "—"}
              />

              <Info
                icon={<FaInfoCircle />}
                label="Identifiant système"
                value={person.id || "—"}
                wide
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Info({ icon, label, value, wide }) {
  return (
    <div className={wide ? "info-card wide-info" : "info-card"}>
      <div className="info-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}