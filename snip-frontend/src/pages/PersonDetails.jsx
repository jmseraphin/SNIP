import "../styles/persons.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import { personsApi } from "../services/api";
import { fmtDate, fullName, nationalId, phone } from "../utils/format";

export default function PersonDetails() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { personsApi.get(id).then(setPerson).catch(() => setPerson(null)).finally(() => setLoading(false)); }, [id]);

  if (loading) return <><Topbar title="Détail personne" /><div className="table-box">Chargement...</div></>;
  if (!person) return <><Topbar title="Détail personne" /><div className="table-box">Personne introuvable ou backend non connecté.</div></>;

  const docs = person.documents || person.identity_documents || [];
  const addresses = person.addresses || [];
  const contacts = person.contacts || [];
  const relations = person.relationships || person.relations || [];
  const events = person.events || [];
  const files = person.files || [];

  return (
    <>
      <Topbar title="Détail personne" />
      <div className="table-box person-details">
        <div className="person-header"><div className="person-avatar big">{fullName(person).charAt(0)}</div><div><h2>{fullName(person)}</h2><p>CIN : {nationalId(person)}</p><p>Nationalité : {person.nationality || "—"}</p></div></div>
        <div className="tabs"><button>Informations</button><button>Documents</button><button>Adresses</button><button>Contacts</button><button>Relations</button><button>Événements</button><button>Fichiers</button></div>
        <div className="details-grid"><div className="details-box"><h3>Informations personnelles</h3><p><b>ID :</b> {person.id}</p><p><b>Nom complet :</b> {fullName(person)}</p><p><b>Téléphone :</b> {phone(person)}</p><p><b>Sexe :</b> {person.gender || person.sexe || "—"}</p><p><b>Date naissance :</b> {fmtDate(person.birth_date || person.birthDate)}</p><p><b>Lieu naissance :</b> {person.birth_place || person.birthPlace || "—"}</p><p><b>Statut :</b> {person.status || "—"}</p></div><div className="details-box"><h3>Informations liées</h3><p><b>Documents :</b> {docs.length}</p><p><b>Adresses :</b> {addresses.length}</p><p><b>Contacts :</b> {contacts.length}</p><p><b>Relations :</b> {relations.length}</p><p><b>Événements :</b> {events.length}</p><p><b>Fichiers :</b> {files.length}</p></div></div>
      </div>
    </>
  );
}
