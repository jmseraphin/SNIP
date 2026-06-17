import "../styles/documents.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { personsApi, auditApi } from "../services/api";
import { fmtDate, number } from "../utils/format";
import { FaIdCard, FaSearch, FaEdit, FaSave, FaTimes } from "react-icons/fa";

export default function Documents() {
  const [persons, setPersons] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    cin: "",
    passport_number: "",
    issued_by: "",
    issue_date: "",
    expiry_date: "",
    is_valid: true,
  });
  const [error, setError] = useState("");

  const personName = (p) =>
    `${p.last_name || p.nom || ""} ${p.first_name || p.prenom || ""}`.trim() ||
    p.full_name ||
    p.name ||
    "Personne sans nom";

  const loadPersons = async () => {
    try {
      setLoading(true);

      const logs = await auditApi.list({ page: 1, limit: 300 });

      const ids = (logs.data || [])
        .filter(
          (l) =>
            String(l.target_type || l.targetType || "").toLowerCase() ===
            "person"
        )
        .map((l) => l.target_id || l.targetId)
        .filter(Boolean);

      const uniqueIds = [...new Set(ids)];

      const people = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const res = await personsApi.get(id);
            return res?.data || res?.person || res;
          } catch {
            return null;
          }
        })
      );

      setPersons(people.filter(Boolean));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersons();
  }, []);

  const buildDocuments = (people) => {
    const list = [];

    people.forEach((p) => {
      const docs =
        p.identity_documents ||
        p.identityDocuments ||
        p.documents_identity ||
        p.documents ||
        [];

      if (Array.isArray(docs) && docs.length > 0) {
        docs.forEach((d) => {
          list.push({
            id: d.id || `${p.id}-${d.type}-${d.number}`,
            person: p,
            type: d.type || d.document_type || "Document",
            number: d.number || d.document_number || d.cin || "—",
            issued_by: d.issued_by || d.authority || d.delivered_by || "—",
            issue_date: d.issue_date || d.issued_at || d.delivered_at || null,
            expiry_date: d.expiry_date || d.expires_at || null,
            is_valid: d.is_valid ?? d.valid ?? null,
            raw: d,
          });
        });

        return;
      }

      if (p.cin) {
        list.push({
          id: `${p.id}-cin`,
          person: p,
          type: "CIN",
          number: p.cin,
          issued_by: p.issued_by || "—",
          issue_date: p.issue_date || null,
          expiry_date: p.expiry_date || null,
          is_valid: true,
          raw: p,
        });
      }

      if (p.passport_number) {
        list.push({
          id: `${p.id}-passport`,
          person: p,
          type: "Passeport",
          number: p.passport_number,
          issued_by: p.passport_issued_by || "—",
          issue_date: p.passport_issue_date || null,
          expiry_date: p.passport_expiry_date || null,
          is_valid: true,
          raw: p,
        });
      }
    });

    return list;
  };

  const documents = useMemo(() => {
    const list = buildDocuments(persons);
    const keyword = q.toLowerCase();

    if (!keyword) return list;

    return list.filter((d) =>
      [
        d.type,
        d.number,
        d.issued_by,
        d.issue_date,
        d.expiry_date,
        personName(d.person),
        d.person?.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [persons, q]);

  const openEdit = (person) => {
    setModal(person);
    setForm({
      cin: person.cin || "",
      passport_number: person.passport_number || "",
      issued_by: person.issued_by || "",
      issue_date: person.issue_date ? String(person.issue_date).slice(0, 10) : "",
      expiry_date: person.expiry_date ? String(person.expiry_date).slice(0, 10) : "",
      is_valid: true,
    });
    setError("");
  };

  const save = async () => {
    try {
      setError("");

      await personsApi.update(modal.id, {
        ...modal,
        cin: form.cin,
        passport_number: form.passport_number,
        issued_by: form.issued_by,
        issue_date: form.issue_date,
        expiry_date: form.expiry_date,
        is_valid: form.is_valid,
      });

      setModal(null);
      await loadPersons();
    } catch (e) {
      setError(e.message || "Erreur lors de l’enregistrement.");
    }
  };

  return (
    <>
      <Topbar title="Gestion des documents d’identité" />

      <div className="documents-page">
        <div className="documents-stats">
          <div className="document-stat-card">
            <div className="document-stat-icon">
              <FaIdCard />
            </div>
            <div>
              <h3>Total documents</h3>
              <p>{loading ? "…" : number(documents.length)}</p>
            </div>
          </div>
        </div>

        <div className="documents-table-box">
          <div className="documents-table-header">
            <div>
              <h3>Documents d’identité</h3>
              <span>CIN, passeport, autorité, délivrance, expiration et validité</span>
            </div>
          </div>

          <div className="documents-filters">
            <div className="documents-search-box">
              <FaSearch className="documents-search-icon" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher type, numéro, personne, autorité..."
              />
            </div>
          </div>

          <div className="documents-table-responsive">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Numéro</th>
                  <th>Personne</th>
                  <th>Délivré par</th>
                  <th>Date délivrance</th>
                  <th>Expiration</th>
                  <th>Validité</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="8" className="documents-empty">
                      Chargement...
                    </td>
                  </tr>
                )}

                {!loading && documents.length === 0 && (
                  <tr>
                    <td colSpan="8" className="documents-empty">
                      Aucun document trouvé
                    </td>
                  </tr>
                )}

                {!loading &&
                  documents.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <span className="document-type">{d.type || "—"}</span>
                      </td>
                      <td>{d.number || "—"}</td>
                      <td>{personName(d.person)}</td>
                      <td>{d.issued_by || "—"}</td>
                      <td>{d.issue_date ? fmtDate(d.issue_date) : "—"}</td>
                      <td>{d.expiry_date ? fmtDate(d.expiry_date) : "—"}</td>
                      <td>
                        <span
                          className={
                            d.is_valid === false
                              ? "document-invalid"
                              : d.is_valid === true
                              ? "document-valid"
                              : "document-unknown"
                          }
                        >
                          {d.is_valid === false
                            ? "Expiré"
                            : d.is_valid === true
                            ? "Valide"
                            : "—"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="document-icon-action"
                          onClick={() => openEdit(d.person)}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="documents-pagination">
            <span>Affichage de {documents.length} document(s)</span>
          </div>
        </div>
      </div>

      {modal && (
        <div className="documents-modal-overlay">
          <div className="documents-modal-box">
            <button className="documents-modal-close" onClick={() => setModal(null)}>
              <FaTimes />
            </button>

            <h3>Modifier documents de {personName(modal)}</h3>

            {error && <div className="documents-error">{error}</div>}

            <div className="documents-form-grid">
              <input
                placeholder="Numéro CIN"
                value={form.cin}
                onChange={(e) => setForm({ ...form, cin: e.target.value })}
              />

              <input
                placeholder="Numéro passeport"
                value={form.passport_number}
                onChange={(e) =>
                  setForm({ ...form, passport_number: e.target.value })
                }
              />

              <input
                placeholder="Délivré par"
                value={form.issued_by}
                onChange={(e) => setForm({ ...form, issued_by: e.target.value })}
              />

              <input
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              />

              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              />

              <select
                value={String(form.is_valid)}
                onChange={(e) =>
                  setForm({ ...form, is_valid: e.target.value === "true" })
                }
              >
                <option value="true">Valide</option>
                <option value="false">Expiré / invalide</option>
              </select>
            </div>

            <div className="documents-modal-actions">
              <button className="documents-cancel-btn" onClick={() => setModal(null)}>
                Annuler
              </button>
              <button className="documents-save-btn" onClick={save}>
                <FaSave /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}