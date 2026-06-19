import "../styles/persons.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Topbar from "../components/Topbar";
import {
  personsApi,
  identityDocumentsApi,
  addressesApi,
  contactsApi,
  relationshipsApi,
  eventsApi,
  filesApi,
  auditApi,
} from "../services/api";
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
  FaAddressBook,
  FaUsers,
  FaHistory,
  FaFileAlt,
  FaClipboardList,
} from "react-icons/fa";

const tabs = [
  { key: "info", label: "Informations", icon: <FaUser /> },
  { key: "documents", label: "Documents", icon: <FaIdCard /> },
  { key: "addresses", label: "Adresses", icon: <FaMapMarkerAlt /> },
  { key: "contacts", label: "Contacts", icon: <FaAddressBook /> },
  { key: "relationships", label: "Relations", icon: <FaUsers /> },
  { key: "events", label: "Événements", icon: <FaHistory /> },
  { key: "files", label: "Fichiers", icon: <FaFileAlt /> },
  { key: "audit", label: "Audit", icon: <FaClipboardList /> },
];

const defaultModule = {
  data: [],
  loading: false,
  ready: true,
};

function normalizeList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.results)) return response.results;
  if (Array.isArray(response.rows)) return response.rows;
  if (Array.isArray(response.documents)) return response.documents;
  if (Array.isArray(response.addresses)) return response.addresses;
  if (Array.isArray(response.contacts)) return response.contacts;
  if (Array.isArray(response.relationships)) return response.relationships;
  if (Array.isArray(response.events)) return response.events;
  if (Array.isArray(response.files)) return response.files;
  if (Array.isArray(response.logs)) return response.logs;
  return [];
}

export default function PersonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  const [modules, setModules] = useState({
    documents: defaultModule,
    addresses: defaultModule,
    contacts: defaultModule,
    relationships: defaultModule,
    events: defaultModule,
    files: defaultModule,
    audit: defaultModule,
  });

  async function safeList(key, loader) {
    setModules((prev) => ({
      ...prev,
      [key]: { ...prev[key], loading: true, ready: true },
    }));

    try {
      const response = await loader();

      setModules((prev) => ({
        ...prev,
        [key]: {
          data: normalizeList(response),
          loading: false,
          ready: true,
        },
      }));
    } catch (error) {
      setModules((prev) => ({
        ...prev,
        [key]: {
          data: [],
          loading: false,
          ready: false,
        },
      }));
    }
  }

  async function loadPerson() {
    try {
      setLoading(true);
      const response = await personsApi.get(id);
      setPerson(response?.data || response?.person || response || null);
    } catch {
      setPerson(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    loadPerson();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    safeList("documents", () =>
      identityDocumentsApi?.listByPerson
        ? identityDocumentsApi.listByPerson(id, { page: 1, limit: 100 })
        : Promise.reject()
    );

    safeList("addresses", () =>
      addressesApi?.listByPerson
        ? addressesApi.listByPerson(id, { page: 1, limit: 100 })
        : Promise.reject()
    );

    safeList("contacts", () =>
      contactsApi?.listByPerson
        ? contactsApi.listByPerson(id, { page: 1, limit: 100 })
        : Promise.reject()
    );

    safeList("relationships", () =>
      relationshipsApi?.listByPerson
        ? relationshipsApi.listByPerson(id, { page: 1, limit: 100 })
        : Promise.reject()
    );

    safeList("events", () =>
      eventsApi?.listByPerson
        ? eventsApi.listByPerson(id, { page: 1, limit: 100 })
        : Promise.reject()
    );

    safeList("files", () =>
      filesApi?.listByPerson
        ? filesApi.listByPerson(id, { page: 1, limit: 100 })
        : Promise.reject()
    );

    safeList("audit", () =>
      auditApi?.listByTarget
        ? auditApi.listByTarget("person", id, { page: 1, limit: 100 })
        : Promise.reject()
    );
  }, [id]);

  const personInitial = useMemo(() => {
    return (fullName(person || {}).charAt(0) || "?").toUpperCase();
  }, [person]);

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
              <div className="details-avatar">{personInitial}</div>

              <div>
                <h2>{fullName(person)}</h2>
                <p>Vue 360° conforme au modèle UML du système SNIP</p>
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

            <div className="details-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={activeTab === tab.key ? "active" : ""}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "info" && <InfoTab person={person} />}
            {activeTab === "documents" && (
              <DocumentsTab module={modules.documents} person={person} />
            )}
            {activeTab === "addresses" && (
              <AddressesTab module={modules.addresses} />
            )}
            {activeTab === "contacts" && (
              <ContactsTab module={modules.contacts} person={person} />
            )}
            {activeTab === "relationships" && (
              <RelationshipsTab module={modules.relationships} />
            )}
            {activeTab === "events" && <EventsTab module={modules.events} />}
            {activeTab === "files" && <FilesTab module={modules.files} />}
            {activeTab === "audit" && <AuditTab module={modules.audit} />}
          </div>
        )}
      </div>
    </>
  );
}

function InfoTab({ person }) {
  return (
    <div className="details-grid">
      <Info icon={<FaIdCard />} label="CIN / Identifiant national" value={nationalId(person)} />
      <Info icon={<FaPhone />} label="Téléphone" value={phone(person)} />
      <Info icon={<FaVenusMars />} label="Sexe" value={person.gender || person.sexe || "—"} />
      <Info icon={<FaCalendarAlt />} label="Date de naissance" value={fmtDate(person.birth_date || person.birthDate)} />
      <Info icon={<FaMapMarkerAlt />} label="Lieu de naissance" value={person.birth_place || person.birthPlace || "—"} />
      <Info icon={<FaFlag />} label="Nationalité" value={person.nationality || "—"} />
      <Info icon={<FaUser />} label="Nom" value={person.last_name || person.nom || "—"} />
      <Info icon={<FaUser />} label="Prénom" value={person.first_name || person.prenom || "—"} />
      <Info icon={<FaInfoCircle />} label="Identifiant système" value={person.id || "—"} wide />
    </div>
  );
}

function DocumentsTab({ module, person }) {
  const fallbackDocs = [];

  if (person?.cin || person?.national_id) {
    fallbackDocs.push({
      type: "CIN",
      number: person.cin || person.national_id,
      issued_by: "—",
      issue_date: null,
      expiry_date: null,
      is_valid: null,
    });
  }

  if (person?.passport_number) {
    fallbackDocs.push({
      type: "Passeport",
      number: person.passport_number,
      issued_by: "—",
      issue_date: null,
      expiry_date: null,
      is_valid: null,
    });
  }

  const data = module.data.length ? module.data : fallbackDocs;

  return (
    <ModuleTable
      module={{ ...module, data }}
      columns={["Type", "Numéro", "Délivré par", "Date émission", "Expiration", "Valide"]}
    >
      {data.map((doc, index) => (
        <tr key={doc.id || index}>
          <td>{doc.type || doc.document_type || "—"}</td>
          <td>{doc.number || doc.document_number || doc.cin || doc.passport_number || "—"}</td>
          <td>{doc.issued_by || doc.issuer || "—"}</td>
          <td>{fmtDate(doc.issue_date || doc.issued_at)}</td>
          <td>{fmtDate(doc.expiry_date || doc.expires_at)}</td>
          <td>{doc.is_valid === true ? "Oui" : doc.is_valid === false ? "Non" : "—"}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function AddressesTab({ module }) {
  return (
    <ModuleTable
      module={module}
      columns={["Type", "Adresse", "Ville", "Région", "Pays", "Début", "Fin"]}
    >
      {module.data.map((item, index) => (
        <tr key={item.id || index}>
          <td>{item.type || item.address_type || "—"}</td>
          <td>{item.address || item.full_address || "—"}</td>
          <td>{item.city || "—"}</td>
          <td>{item.region || "—"}</td>
          <td>{item.country || "—"}</td>
          <td>{fmtDate(item.start_date || item.startDate)}</td>
          <td>{fmtDate(item.end_date || item.endDate)}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function ContactsTab({ module, person }) {
  const fallbackContacts = [];

  if (person?.phone || person?.telephone || person?.tel) {
    fallbackContacts.push({
      type: "Téléphone",
      value: person.phone || person.telephone || person.tel,
      is_primary: true,
    });
  }

  if (person?.email) {
    fallbackContacts.push({
      type: "Email",
      value: person.email,
      is_primary: false,
    });
  }

  const data = module.data.length ? module.data : fallbackContacts;

  return (
    <ModuleTable module={{ ...module, data }} columns={["Type", "Valeur", "Principal"]}>
      {data.map((item, index) => (
        <tr key={item.id || index}>
          <td>{item.type || item.contact_type || "—"}</td>
          <td>{item.value || item.phone || item.email || "—"}</td>
          <td>{item.is_primary || item.isPrimary ? "Oui" : "—"}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function RelationshipsTab({ module }) {
  return (
    <ModuleTable module={module} columns={["Relation", "Personne liée", "Début", "Fin"]}>
      {module.data.map((item, index) => (
        <tr key={item.id || index}>
          <td>{item.relationship_type || item.type || "—"}</td>
          <td>
            {item.related_person_name ||
              item.relatedPersonName ||
              item.related_person_id ||
              item.person2_id ||
              "—"}
          </td>
          <td>{fmtDate(item.start_date || item.startDate)}</td>
          <td>{fmtDate(item.end_date || item.endDate)}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function EventsTab({ module }) {
  return (
    <ModuleTable module={module} columns={["Type", "Description", "Date", "Lieu", "Source"]}>
      {module.data.map((item, index) => (
        <tr key={item.id || index}>
          <td>{item.event_type || item.type || "—"}</td>
          <td>{item.description || item.title || "—"}</td>
          <td>{fmtDate(item.event_date || item.eventDate || item.created_at)}</td>
          <td>{item.location || item.place || "—"}</td>
          <td>{item.source || "—"}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function FilesTab({ module }) {
  return (
    <ModuleTable module={module} columns={["Type", "Nom / URL", "Uploadé le", "Uploadé par"]}>
      {module.data.map((item, index) => (
        <tr key={item.id || index}>
          <td>{item.file_type || item.type || item.mime_type || "—"}</td>
          <td>{item.file_name || item.name || item.filename || item.file_url || "—"}</td>
          <td>{fmtDate(item.uploaded_at || item.uploadedAt || item.created_at)}</td>
          <td>{item.uploaded_by || item.uploadedBy || item.user_id || "—"}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function AuditTab({ module }) {
  return (
    <ModuleTable
      module={module}
      columns={["Action", "Cible", "Méthode", "Endpoint", "Statut", "Date"]}
    >
      {module.data.map((item, index) => (
        <tr key={item.id || index}>
          <td>{item.action || "—"}</td>
          <td>{item.target_type || item.entity_type || "—"}</td>
          <td>{item.method || "—"}</td>
          <td>{item.endpoint || "—"}</td>
          <td>{item.status_code || item.status || "—"}</td>
          <td>{fmtDate(item.created_at || item.createdAt)}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function ModuleTable({ module, columns, children }) {
  if (module.loading) {
    return <div className="module-empty">Chargement...</div>;
  }

  if (!module.ready) {
    return <div className="module-empty">—</div>;
  }

  if (!module.data.length) {
    return <div className="module-empty">—</div>;
  }

  return (
    <div className="details-table-wrap">
      <table className="details-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Info({ icon, label, value, wide }) {
  return (
    <div className={wide ? "info-card wide-info" : "info-card"}>
      <div className="info-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value || "—"}</strong>
      </div>
    </div>
  );
}