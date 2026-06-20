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

const DASH = "—";

const tabs = [
  { key: "info", label: "Identité", icon: <FaUser /> },
  { key: "documents", label: "Documents", icon: <FaIdCard /> },
  { key: "addresses", label: "Adresses", icon: <FaMapMarkerAlt /> },
  { key: "contacts", label: "Contacts", icon: <FaAddressBook /> },
  { key: "relationships", label: "Relations", icon: <FaUsers /> },
  { key: "events", label: "Événements", icon: <FaHistory /> },
  { key: "files", label: "Fichiers", icon: <FaFileAlt /> },
  { key: "audit", label: "Audit", icon: <FaClipboardList /> },
];

function emptyModule() {
  return { data: [], loading: false, ready: true, error: null };
}

function value(...values) {
  const found = values.find(
    (v) => v !== undefined && v !== null && String(v).trim() !== ""
  );

  return found === undefined ? DASH : found;
}

function normalizeList(response, keys = []) {
  if (!response) return [];
  if (Array.isArray(response)) return response;

  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
    if (Array.isArray(response?.data?.[key])) return response.data[key];
  }

  const genericKeys = [
    "data",
    "items",
    "results",
    "rows",
    "documents",
    "identity_documents",
    "identityDocuments",
    "addresses",
    "contacts",
    "relationships",
    "events",
    "files",
    "logs",
  ];

  for (const key of genericKeys) {
    if (Array.isArray(response?.[key])) return response[key];
    if (Array.isArray(response?.data?.[key])) return response.data[key];
  }

  return [];
}

function fallbackDocuments(person) {
  const docs = [];

  if (person?.cin || person?.national_id || person?.nationalId) {
    docs.push({
      type: "CIN",
      number: person.cin || person.national_id || person.nationalId,
      issued_by: person.issued_by,
      issue_date: person.issue_date,
      expiry_date: person.expiry_date,
      is_valid: true,
    });
  }

  return docs;
}

function fallbackContacts(person) {
  const contacts = [];

  if (person?.phone || person?.telephone || person?.tel) {
    contacts.push({
      type: "Téléphone",
      value: person.phone || person.telephone || person.tel,
      is_primary: true,
    });
  }

  if (person?.email) {
    contacts.push({
      type: "Email",
      value: person.email,
      is_primary: !contacts.length,
    });
  }

  return contacts;
}

export default function PersonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  const [modules, setModules] = useState({
    documents: emptyModule(),
    addresses: emptyModule(),
    contacts: emptyModule(),
    relationships: emptyModule(),
    events: emptyModule(),
    files: emptyModule(),
    audit: emptyModule(),
  });

  async function safeList(key, loader, listKeys = []) {
    setModules((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        loading: true,
        ready: true,
        error: null,
      },
    }));

    try {
      const response = await loader();

      setModules((prev) => ({
        ...prev,
        [key]: {
          data: normalizeList(response, listKeys),
          loading: false,
          ready: true,
          error: null,
        },
      }));
    } catch (error) {
      setModules((prev) => ({
        ...prev,
        [key]: {
          data: [],
          loading: false,
          ready: false,
          error,
        },
      }));
    }
  }

  useEffect(() => {
    if (!id) return;

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

    loadPerson();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    safeList(
      "documents",
      () => identityDocumentsApi.listByPerson(id, { page: 1, limit: 100 }),
      ["identity_documents", "identityDocuments", "documents"]
    );

    safeList(
      "addresses",
      () => addressesApi.listByPerson(id, { page: 1, limit: 100 }),
      ["addresses"]
    );

    safeList(
      "contacts",
      () => contactsApi.listByPerson(id, { page: 1, limit: 100 }),
      ["contacts"]
    );

    safeList(
      "relationships",
      () => relationshipsApi.listByPerson(id, { page: 1, limit: 100 }),
      ["relationships"]
    );

    safeList(
      "events",
      () => eventsApi.listByPerson(id, { page: 1, limit: 100 }),
      ["events"]
    );

    safeList(
      "files",
      () => filesApi.listByPerson(id, { page: 1, limit: 100 }),
      ["files"]
    );

    safeList(
      "audit",
      () => auditApi.listByTarget("person", id, { page: 1, limit: 100 }),
      ["logs"]
    );
  }, [id]);

  const personInitial = useMemo(() => {
    return (fullName(person || {}).charAt(0) || "?").toUpperCase();
  }, [person]);

  const counters = {
    documents: modules.documents.data.length || fallbackDocuments(person).length,
    addresses: modules.addresses.data.length,
    contacts: modules.contacts.data.length || fallbackContacts(person).length,
    relationships: modules.relationships.data.length,
    events: modules.events.data.length,
    files: modules.files.data.length,
    audit: modules.audit.data.length,
  };

  return (
    <>
      <Topbar title="Vue 360° personne" />

      <div className="person-details-page">
        <button className="back-btn" onClick={() => navigate("/persons")}>
          <FaArrowLeft /> Retour aux personnes
        </button>

        {loading && (
          <div className="details-card">
            <p>Chargement...</p>
          </div>
        )}

        {!loading && !person && (
          <div className="details-card">
            <h3>Personne introuvable</h3>
          </div>
        )}

        {!loading && person && (
          <div className="details-card pro-details uml-ready">
            <div className="details-header">
              <div className="details-avatar">{personInitial}</div>

              <div>
                <h2>{fullName(person) || DASH}</h2>
                <p>
                  Vue complète UML : identité, documents, adresses, contacts,
                  relations, événements, fichiers et audit.
                </p>
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
                  <span>{tab.label}</span>

                  {tab.key !== "info" && <b>{counters[tab.key] || 0}</b>}
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

            {activeTab === "events" && (
              <EventsTab module={modules.events} />
            )}

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
      <Info
        icon={<FaIdCard />}
        label="CIN / Identifiant national"
        value={nationalId(person)}
      />

      <Info
        icon={<FaUser />}
        label="Prénom"
        value={value(person.first_name, person.firstName, person.prenom)}
      />

      <Info
        icon={<FaUser />}
        label="Nom"
        value={value(person.last_name, person.lastName, person.nom)}
      />

      <Info
        icon={<FaCalendarAlt />}
        label="Date de naissance"
        value={fmtDate(person.birth_date || person.birthDate)}
      />

      <Info
        icon={<FaMapMarkerAlt />}
        label="Lieu de naissance"
        value={value(person.birth_place, person.birthPlace)}
      />

      <Info
        icon={<FaVenusMars />}
        label="Genre"
        value={value(person.gender, person.sexe)}
      />

      <Info
        icon={<FaFlag />}
        label="Nationalité"
        value={value(person.nationality)}
      />

      <Info
        icon={<FaInfoCircle />}
        label="Statut"
        value={value(person.status)}
      />

      <Info icon={<FaPhone />} label="Téléphone" value={phone(person)} />

      <Info
        icon={<FaInfoCircle />}
        label="Email"
        value={value(person.email)}
      />

      <Info
        icon={<FaCalendarAlt />}
        label="Créé le"
        value={fmtDate(person.created_at || person.createdAt)}
      />

      <Info
        icon={<FaCalendarAlt />}
        label="Modifié le"
        value={fmtDate(person.updated_at || person.updatedAt)}
      />
    </div>
  );
}

function DocumentsTab({ module, person }) {
  const data = module.data.length ? module.data : fallbackDocuments(person);

  return (
    <ModuleTable
      module={{ ...module, data, ready: module.ready || data.length > 0 }}
      columns={[
        "Type",
        "Numéro",
        "Délivré par",
        "Date émission",
        "Expiration",
        "Valide",
      ]}
    >
      {data.map((doc, index) => (
        <tr key={doc.id || index}>
          <td>{value(doc.type, doc.document_type)}</td>
          <td>
            {value(
              doc.number,
              doc.document_number,
              doc.cin,
              doc.passport_number
            )}
          </td>
          <td>{value(doc.issued_by, doc.issuer)}</td>
          <td>{fmtDate(doc.issue_date || doc.issued_at)}</td>
          <td>{fmtDate(doc.expiry_date || doc.expires_at)}</td>
          <td>
            {doc.is_valid === true
              ? "Oui"
              : doc.is_valid === false
              ? "Non"
              : DASH}
          </td>
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
          <td>{value(item.type, item.address_type)}</td>
          <td>{value(item.address, item.full_address)}</td>
          <td>{value(item.city)}</td>
          <td>{value(item.region)}</td>
          <td>{value(item.country)}</td>
          <td>{fmtDate(item.start_date || item.startDate)}</td>
          <td>{fmtDate(item.end_date || item.endDate)}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function ContactsTab({ module, person }) {
  const data = module.data.length ? module.data : fallbackContacts(person);

  return (
    <ModuleTable
      module={{ ...module, data, ready: module.ready || data.length > 0 }}
      columns={["Type", "Valeur", "Principal"]}
    >
      {data.map((item, index) => (
        <tr key={item.id || index}>
          <td>{value(item.type, item.contact_type)}</td>
          <td>{value(item.value, item.phone, item.email)}</td>
          <td>{item.is_primary || item.isPrimary ? "Oui" : DASH}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function RelationshipsTab({ module }) {
  return (
    <ModuleTable
      module={module}
      columns={["Relation", "Personne liée", "Début", "Fin", "Statut"]}
    >
      {module.data.map((item, index) => (
        <tr key={item.id || index}>
          <td>{value(item.relationship_type, item.type)}</td>
          <td>
            {value(
              item.related_person_name,
              item.relatedPersonName,
              item.related_person_id,
              item.person2_id
            )}
          </td>
          <td>{fmtDate(item.start_date || item.startDate)}</td>
          <td>{fmtDate(item.end_date || item.endDate)}</td>
          <td>{item.is_active === false ? "Inactive" : "Active"}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function EventsTab({ module }) {
  return (
    <ModuleTable
      module={module}
      columns={["Type", "Titre / Description", "Date", "Source", "Créé le"]}
    >
      {module.data.map((item, index) => (
        <tr key={item.id || index}>
          <td>{value(item.event_type, item.type)}</td>
          <td>{value(item.title, item.description)}</td>
          <td>{fmtDate(item.event_date || item.eventDate)}</td>
          <td>{value(item.source)}</td>
          <td>{fmtDate(item.created_at || item.createdAt)}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function FilesTab({ module }) {
  return (
    <ModuleTable
      module={module}
      columns={["Type", "Nom / URL", "Metadata", "Uploadé le", "Uploadé par"]}
    >
      {module.data.map((item, index) => (
        <tr key={item.id || index}>
          <td>{value(item.file_type, item.type, item.mime_type)}</td>
          <td>
            {value(
              item.file_name,
              item.name,
              item.filename,
              item.file_url,
              item.url
            )}
          </td>
          <td>{item.metadata ? JSON.stringify(item.metadata) : DASH}</td>
          <td>
            {fmtDate(item.uploaded_at || item.uploadedAt || item.created_at)}
          </td>
          <td>{value(item.uploaded_by, item.uploadedBy, item.user_id)}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function AuditTab({ module }) {
  return (
    <ModuleTable
      module={module}
      columns={[
        "Action",
        "Cible",
        "ID cible",
        "Méthode",
        "Endpoint",
        "Statut",
        "IP",
        "Date",
      ]}
    >
      {module.data.map((item, index) => (
        <tr key={item.id || index}>
          <td>{value(item.action)}</td>
          <td>{value(item.target_type, item.entity_type)}</td>
          <td>{value(item.target_id, item.entity_id)}</td>
          <td>{value(item.method)}</td>
          <td>{value(item.endpoint)}</td>
          <td>{value(item.status_code, item.status)}</td>
          <td>{value(item.ip_address, item.ip)}</td>
          <td>{fmtDate(item.created_at || item.createdAt)}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function ModuleTable({ module, columns, children }) {
  if (module.loading) {
    return <div className="module-empty module-loading">Chargement...</div>;
  }

  if (!module.ready) {
    return (
      <div className="module-empty">
        <strong>{DASH}</strong>
        <span>
          Module backend pas encore disponible. Dès que l'endpoint sera ajouté,
          les données s'afficheront automatiquement.
        </span>
      </div>
    );
  }

  if (!module.data.length) {
    return (
      <div className="module-empty">
        <strong>{DASH}</strong>
        <span>Aucune donnée enregistrée pour ce module.</span>
      </div>
    );
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

function Info({ icon, label, value: itemValue }) {
  return (
    <div className="info-card">
      <div className="info-icon">{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value(itemValue)}</strong>
      </div>
    </div>
  );
}