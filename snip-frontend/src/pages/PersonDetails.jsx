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
import { t, useLang } from "../i18n";
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
      type: t("persons.phone"),
      value: person.phone || person.telephone || person.tel,
      is_primary: true,
    });
  }

  if (person?.email) {
    contacts.push({
      type: t("common.email"),
      value: person.email,
      is_primary: !contacts.length,
    });
  }

  return contacts;
}

function translateStatus(status) {
  const valueStatus = String(status || "active").toLowerCase();

  if (valueStatus === "active") return t("common.active");
  if (valueStatus === "inactive") return t("common.inactive");

  return status || t("common.active");
}

function translateGender(gender) {
  if (!gender) return DASH;

  const current = String(gender).toLowerCase();

  if (current === "m" || current === "masculin" || current === "male") {
    return t("persons.male");
  }

  if (
    current === "f" ||
    current === "féminin" ||
    current === "feminin" ||
    current === "female"
  ) {
    return t("persons.female");
  }

  if (current === "homme" || current === "man") {
    return t("persons.man");
  }

  if (current === "femme" || current === "woman") {
    return t("persons.woman");
  }

  return gender;
}

export default function PersonDetails() {
  const lang = useLang();
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

  const tabs = useMemo(
    () => [
      { key: "info", label: t("personDetails.identity"), icon: <FaUser /> },
      { key: "documents", label: t("personDetails.documents"), icon: <FaIdCard /> },
      { key: "addresses", label: t("personDetails.addresses"), icon: <FaMapMarkerAlt /> },
      { key: "contacts", label: t("personDetails.contacts"), icon: <FaAddressBook /> },
      { key: "relationships", label: t("personDetails.relationships"), icon: <FaUsers /> },
      { key: "events", label: t("personDetails.events"), icon: <FaHistory /> },
      { key: "files", label: t("personDetails.files"), icon: <FaFileAlt /> },
      { key: "audit", label: t("audit.title"), icon: <FaClipboardList /> },
    ],
    [lang]
  );

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
      <Topbar title={t("personDetails.title")} />

      <div className="person-details-page">
        <button type="button" className="back-btn" onClick={() => navigate("/persons")}>
          <FaArrowLeft /> {t("common.back")}
        </button>

        {loading && (
          <div className="details-card">
            <p>{t("common.loading")}</p>
          </div>
        )}

        {!loading && !person && (
          <div className="details-card">
            <h3>{t("persons.notFound")}</h3>
          </div>
        )}

        {!loading && person && (
          <div className="details-card pro-details uml-ready">
            <div className="details-header">
              <div className="details-avatar">{personInitial}</div>

              <div>
                <h2>{fullName(person) || DASH}</h2>
                <p>
                  {t("personDetails.identity")}, {t("personDetails.documents")},{" "}
                  {t("personDetails.addresses")}, {t("personDetails.contacts")},{" "}
                  {t("personDetails.relationships")}, {t("personDetails.events")},{" "}
                  {t("personDetails.files")} {t("common.source").toLowerCase()}{" "}
                  {t("audit.title").toLowerCase()}.
                </p>
              </div>

              <span
                className={
                  (person.status || "active") === "active"
                    ? "status active"
                    : "status inactive"
                }
              >
                {translateStatus(person.status)}
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
      <Info
        icon={<FaIdCard />}
        label={t("persons.nationalId")}
        value={nationalId(person)}
      />

      <Info
        icon={<FaUser />}
        label={t("persons.firstName")}
        value={value(person.first_name, person.firstName, person.prenom)}
      />

      <Info
        icon={<FaUser />}
        label={t("persons.lastName")}
        value={value(person.last_name, person.lastName, person.nom)}
      />

      <Info
        icon={<FaCalendarAlt />}
        label={t("persons.birth")}
        value={fmtDate(person.birth_date || person.birthDate)}
      />

      <Info
        icon={<FaMapMarkerAlt />}
        label={t("persons.birthPlace")}
        value={value(person.birth_place, person.birthPlace)}
      />

      <Info
        icon={<FaVenusMars />}
        label={t("persons.gender")}
        value={translateGender(value(person.gender, person.sexe))}
      />

      <Info
        icon={<FaFlag />}
        label={t("persons.nationality")}
        value={value(person.nationality)}
      />

      <Info
        icon={<FaInfoCircle />}
        label={t("common.status")}
        value={translateStatus(person.status)}
      />

      <Info icon={<FaPhone />} label={t("common.phone")} value={phone(person)} />

      <Info
        icon={<FaInfoCircle />}
        label={t("common.email")}
        value={value(person.email)}
      />

      <Info
        icon={<FaCalendarAlt />}
        label={t("common.createdAt")}
        value={fmtDate(person.created_at || person.createdAt)}
      />

      <Info
        icon={<FaCalendarAlt />}
        label={t("common.updatedAt")}
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
        t("documents.type"),
        t("documents.number"),
        t("documents.authority"),
        t("documents.issueDate"),
        t("documents.expiryDate"),
        t("documents.validity"),
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
              ? t("common.yes")
              : doc.is_valid === false
              ? t("common.no")
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
      columns={[
        t("addresses.type"),
        t("addresses.address"),
        t("addresses.city"),
        t("addresses.region"),
        t("addresses.country"),
        t("relationships.startDate"),
        t("relationships.endDate"),
      ]}
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
      columns={[t("contacts.type"), t("contacts.value"), t("common.active")]}
    >
      {data.map((item, index) => (
        <tr key={item.id || index}>
          <td>{value(item.type, item.contact_type)}</td>
          <td>{value(item.value, item.phone, item.email)}</td>
          <td>{item.is_primary || item.isPrimary ? t("common.yes") : DASH}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function RelationshipsTab({ module }) {
  return (
    <ModuleTable
      module={module}
      columns={[
        t("relationships.type"),
        t("relationships.person2"),
        t("relationships.startDate"),
        t("relationships.endDate"),
        t("common.status"),
      ]}
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
          <td>{item.is_active === false ? t("common.inactive") : t("common.active")}</td>
        </tr>
      ))}
    </ModuleTable>
  );
}

function EventsTab({ module }) {
  return (
    <ModuleTable
      module={module}
      columns={[
        t("events.type"),
        t("events.description"),
        t("events.date"),
        t("common.source"),
        t("common.createdAt"),
      ]}
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
      columns={[
        t("files.type"),
        t("files.name"),
        "Metadata",
        "Upload",
        t("audit.user"),
      ]}
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
        t("audit.action"),
        t("audit.targetType"),
        t("audit.targetId"),
        "Méthode",
        "Endpoint",
        t("common.status"),
        t("audit.ip"),
        t("audit.date"),
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
    return <div className="module-empty module-loading">{t("common.loading")}</div>;
  }

  if (!module.ready) {
    return (
      <div className="module-empty">
        <strong>{DASH}</strong>
        <span>{t("common.noData")}</span>
      </div>
    );
  }

  if (!module.data.length) {
    return (
      <div className="module-empty">
        <strong>{DASH}</strong>
        <span>{t("personDetails.noModuleData")}</span>
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