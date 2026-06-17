import "../styles/files.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import {
  API_BASE_URL,
  getToken,
  auditApi,
  filesApi,
  personsApi,
} from "../services/api";
import { fmtDate, number } from "../utils/format";
import {
  FaFileAlt,
  FaSearch,
  FaUpload,
  FaTrash,
  FaUser,
  FaTimes,
  FaDownload,
} from "react-icons/fa";

const emptyForm = {
  person_id: "",
  file: null,
  file_type: "",
  metadata: "",
};

export default function Files() {
  const [files, setFiles] = useState([]);
  const [persons, setPersons] = useState([]);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [personSearch, setPersonSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const personName = (p) =>
    `${p.last_name || p.nom || ""} ${p.first_name || p.prenom || ""}`.trim() ||
    p.full_name ||
    p.name ||
    "Personne sans nom";

  const fileName = (f) =>
    f.original_name || f.filename || f.file_name || f.name || "Fichier";

  const fileUrl = (f) => f.file_url || f.url || f.path || f.file_path || "";

  const loadPersons = async () => {
    try {
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

      const clean = people.filter(Boolean);
      setPersons(clean);
      return clean;
    } catch {
      setPersons([]);
      return [];
    }
  };

  const load = async () => {
    try {
      setLoading(true);

      const people = await loadPersons();

      const all = await Promise.all(
        people.map(async (p) => {
          try {
            const res = await filesApi.listByPerson(p.id);
            const list = res.data || res.files || res.results || [];

            return list.map((f) => ({
              ...f,
              person_id: p.id,
              person_name: personName(p),
            }));
          } catch {
            return [];
          }
        })
      );

      setFiles(all.flat());
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredPersons = useMemo(() => {
    const keyword = personSearch.toLowerCase();

    if (!keyword) return persons;

    return persons.filter((p) =>
      [
        p.last_name,
        p.first_name,
        p.nom,
        p.prenom,
        p.full_name,
        p.name,
        p.cin,
        p.phone,
        p.telephone,
        p.email,
        p.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [persons, personSearch]);

  const filteredFiles = useMemo(() => {
    const keyword = q.toLowerCase();

    if (!keyword) return files;

    return files.filter((f) =>
      [
        fileName(f),
        f.file_type,
        f.type,
        f.mime_type,
        f.person_name,
        f.person_id,
        JSON.stringify(f.metadata || {}),
        f.created_at,
        f.uploaded_at,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [files, q]);

  const openUpload = async () => {
    setForm(emptyForm);
    setPersonSearch("");
    setError("");
    setModal(true);
    await loadPersons();
  };

  const upload = async () => {
    try {
      setError("");

      if (!form.person_id) {
        setError("Veuillez choisir une personne.");
        return;
      }

      if (!form.file) {
        setError("Veuillez choisir un fichier.");
        return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append("person_id", form.person_id);
      formData.append("file", form.file);
      formData.append("file_type", form.file_type || "document");

      if (form.metadata) {
        formData.append(
          "metadata",
          JSON.stringify({ description: form.metadata })
        );
      }

      await filesApi.upload(form.person_id, formData);

      setModal(false);
      setForm(emptyForm);
      setPersonSearch("");
      await load();
    } catch (e) {
      setError(e.message || "Erreur lors de l’upload.");
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (file) => {
    try {
      const res = await fetch(`${API_BASE_URL}/files/${file.id}/download`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        alert("Téléchargement impossible.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName(file);
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors du téléchargement.");
    }
  };

  const remove = async (file) => {
    if (!window.confirm("Supprimer ce fichier ?")) return;

    try {
      await filesApi.remove(file.id);
      await load();
    } catch (e) {
      alert(e.message || "Suppression impossible.");
    }
  };

  return (
    <>
      <Topbar title="Gestion des fichiers" />

      <div className="files-page">
        <div className="files-stats">
          <div className="file-stat-card">
            <div className="file-stat-icon">
              <FaFileAlt />
            </div>
            <div>
              <h3>Total fichiers</h3>
              <p>{loading ? "…" : number(files.length)}</p>
            </div>
          </div>
        </div>

        <div className="files-table-box">
          <div className="files-table-header">
            <div>
              <h3>Liste des fichiers</h3>
              <span>Fichiers numériques attachés aux personnes</span>
            </div>

            <button className="file-add-btn" onClick={openUpload}>
              <FaUpload /> Importer
            </button>
          </div>

          <div className="files-filters">
            <div className="files-search-box">
              <FaSearch className="files-search-icon" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher fichier, personne, type..."
              />
            </div>
          </div>

          <div className="files-table-responsive">
            <table className="files-table">
              <thead>
                <tr>
                  <th>Fichier</th>
                  <th>Personne</th>
                  <th>Type</th>
                  <th>URL / Chemin</th>
                  <th>Date upload</th>
                  <th className="files-actions-col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="files-empty">
                      Chargement des fichiers...
                    </td>
                  </tr>
                )}

                {!loading && filteredFiles.length === 0 && (
                  <tr>
                    <td colSpan="6" className="files-empty">
                      Aucun fichier trouvé
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredFiles.map((file) => (
                    <tr key={file.id}>
                      <td>
                        <div className="file-info">
                          <div className="file-avatar">
                            <FaFileAlt />
                          </div>
                          <div>
                            <h4>{fileName(file)}</h4>
                            <span>
                              ID : {String(file.id || "").slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="file-person">
                          <FaUser /> {file.person_name || file.person_id || "—"}
                        </span>
                      </td>

                      <td>
                        <span className="file-type">
                          {file.file_type || file.mime_type || file.type || "—"}
                        </span>
                      </td>

                      <td className="file-url">{fileUrl(file) || "—"}</td>

                      <td>{fmtDate(file.created_at || file.uploaded_at)}</td>

                      <td>
                        <div className="file-action-buttons">
                          {file.id && (
                            <button
                              className="file-icon-action file-download-btn"
                              data-tooltip="Télécharger"
                              onClick={() => downloadFile(file)}
                            >
                              <FaDownload />
                            </button>
                          )}

                          <button
                            className="file-icon-action file-delete-btn"
                            data-tooltip="Supprimer"
                            onClick={() => remove(file)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="files-pagination">
            <span>
              Affichage de {filteredFiles.length} sur {number(files.length)}{" "}
              fichier(s)
            </span>
          </div>
        </div>
      </div>

      {modal && (
        <div className="files-modal-overlay">
          <div className="files-modal-box">
            <button className="files-modal-close" onClick={() => setModal(false)}>
              <FaTimes />
            </button>

            <h3>Importer un fichier</h3>

            {error && <div className="files-error">{error}</div>}

            <div className="files-form-grid">
              <div className="person-picker">
                <input
                  placeholder="Rechercher une personne..."
                  value={personSearch}
                  onChange={(e) => {
                    setPersonSearch(e.target.value);
                    setForm({ ...form, person_id: "" });
                  }}
                />

                <div className="person-picker-list">
                  {filteredPersons.length === 0 && (
                    <div className="person-picker-empty">
                      Aucune personne trouvée
                    </div>
                  )}

                  {filteredPersons.slice(0, 10).map((p) => {
                    const name = personName(p);

                    return (
                      <button
                        type="button"
                        key={p.id}
                        className={
                          form.person_id === p.id
                            ? "person-picker-item active"
                            : "person-picker-item"
                        }
                        onClick={() => {
                          setForm({ ...form, person_id: p.id });
                          setPersonSearch(name);
                        }}
                      >
                        <strong>{name}</strong>
                        <span>{p.cin || p.phone || p.telephone || p.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <input
                placeholder="Type de fichier"
                value={form.file_type}
                onChange={(e) => setForm({ ...form, file_type: e.target.value })}
              />

              <input
                type="file"
                onChange={(e) =>
                  setForm({ ...form, file: e.target.files?.[0] || null })
                }
              />

              <textarea
                placeholder="Metadata / description"
                value={form.metadata}
                onChange={(e) => setForm({ ...form, metadata: e.target.value })}
              />
            </div>

            <div className="files-modal-actions">
              <button className="files-cancel-btn" onClick={() => setModal(false)}>
                Annuler
              </button>

              <button className="files-save-btn" onClick={upload} disabled={uploading}>
                {uploading ? "Importation..." : "Importer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}