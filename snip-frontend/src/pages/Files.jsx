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
import { t, tr, useLang } from "../i18n";
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

function label(lang, fr, en) {
  return lang === "en" ? en : fr;
}

export default function Files() {
  const lang = useLang();

  const [files, setFiles] = useState([]);
  const [persons, setPersons] = useState([]);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [personSearch, setPersonSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const personName = (person) =>
    `${person.last_name || person.nom || ""} ${
      person.first_name || person.prenom || ""
    }`.trim() ||
    person.full_name ||
    person.name ||
    label(lang, "Personne sans nom", "Unnamed person");

  const fileName = (file) =>
    file.original_name || file.filename || file.file_name || file.name || t("files.name");

  const fileUrl = (file) => file.file_url || file.url || file.path || file.file_path || "";

  const loadPersons = async () => {
    try {
      const logs = await auditApi.list({ page: 1, limit: 300 });

      const ids = (logs.data || [])
        .filter(
          (log) =>
            String(log.target_type || log.targetType || "").toLowerCase() ===
            "person"
        )
        .map((log) => log.target_id || log.targetId)
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
        people.map(async (person) => {
          try {
            const res = await filesApi.listByPerson(person.id);
            const list = res.data || res.files || res.results || [];

            return list.map((file) => ({
              ...file,
              person_id: person.id,
              person_name: personName(person),
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

    return persons.filter((person) =>
      [
        person.last_name,
        person.first_name,
        person.nom,
        person.prenom,
        person.full_name,
        person.name,
        person.cin,
        person.phone,
        person.telephone,
        person.email,
        person.id,
        personName(person),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [persons, personSearch, lang]);

  const filteredFiles = useMemo(() => {
    const keyword = q.toLowerCase();

    if (!keyword) return files;

    return files.filter((file) =>
      [
        fileName(file),
        file.file_type,
        file.type,
        file.mime_type,
        file.person_name,
        file.person_id,
        JSON.stringify(file.metadata || {}),
        file.created_at,
        file.uploaded_at,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [files, q, lang]);

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
        setError(label(lang, "Veuillez choisir une personne.", "Please choose a person."));
        return;
      }

      if (!form.file) {
        setError(label(lang, "Veuillez choisir un fichier.", "Please choose a file."));
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
    } catch (error) {
      setError(error.message || t("files.saveError"));
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
        alert(t("files.downloadError"));
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName(file);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      alert(t("files.downloadError"));
    }
  };

  const remove = async (file) => {
    if (!window.confirm(t("files.deleteConfirm"))) return;

    try {
      await filesApi.remove(file.id);
      await load();
    } catch (error) {
      alert(error.message || t("files.deleteError"));
    }
  };

  return (
    <>
      <Topbar title={t("files.title")} />

      <div className="files-page">
        <div className="files-stats">
          <div className="file-stat-card">
            <div className="file-stat-icon">
              <FaFileAlt />
            </div>

            <div>
              <h3>{t("files.total")}</h3>
              <p>{loading ? "…" : number(files.length)}</p>
            </div>
          </div>
        </div>

        <div className="files-table-box">
          <div className="files-table-header">
            <div>
              <h3>{t("files.list")}</h3>
              <span>
                {label(
                  lang,
                  "Fichiers numériques attachés aux personnes",
                  "Digital files attached to persons"
                )}
              </span>
            </div>

            <button type="button" className="file-add-btn" onClick={openUpload}>
              <FaUpload /> {t("files.upload")}
            </button>
          </div>

          <div className="files-filters">
            <div className="files-search-box">
              <FaSearch className="files-search-icon" />

              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={t("files.searchPlaceholder")}
              />
            </div>
          </div>

          <div className="files-table-responsive">
            <table className="files-table">
              <thead>
                <tr>
                  <th>{t("files.name")}</th>
                  <th>{t("files.person")}</th>
                  <th>{t("files.type")}</th>
                  <th>{t("files.url")}</th>
                  <th>{label(lang, "Date upload", "Upload date")}</th>
                  <th className="files-actions-col">{t("common.actions")}</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="files-empty">
                      {t("files.loadingData")}
                    </td>
                  </tr>
                )}

                {!loading && filteredFiles.length === 0 && (
                  <tr>
                    <td colSpan="6" className="files-empty">
                      {t("files.notFound")}
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
                              type="button"
                              className="file-icon-action file-download-btn"
                              data-tooltip={t("common.download")}
                              onClick={() => downloadFile(file)}
                            >
                              <FaDownload />
                            </button>
                          )}

                          <button
                            type="button"
                            className="file-icon-action file-delete-btn"
                            data-tooltip={t("common.delete")}
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
              {tr("files.display", {
                shown: filteredFiles.length,
                total: number(files.length),
              })}
            </span>
          </div>
        </div>
      </div>

      {modal && (
        <div className="files-modal-overlay">
          <div className="files-modal-box">
            <button
              type="button"
              className="files-modal-close"
              onClick={() => setModal(false)}
            >
              <FaTimes />
            </button>

            <h3>{t("files.upload")}</h3>

            {error && <div className="files-error">{error}</div>}

            <div className="files-form-grid">
              <div className="person-picker">
                <input
                  placeholder={t("files.person")}
                  value={personSearch}
                  onChange={(event) => {
                    setPersonSearch(event.target.value);
                    setForm({ ...form, person_id: "" });
                  }}
                />

                <div className="person-picker-list">
                  {filteredPersons.length === 0 && (
                    <div className="person-picker-empty">
                      {t("relationships.noPerson")}
                    </div>
                  )}

                  {filteredPersons.slice(0, 10).map((person) => {
                    const name = personName(person);

                    return (
                      <button
                        type="button"
                        key={person.id}
                        className={
                          form.person_id === person.id
                            ? "person-picker-item active"
                            : "person-picker-item"
                        }
                        onClick={() => {
                          setForm({ ...form, person_id: person.id });
                          setPersonSearch(name);
                        }}
                      >
                        <strong>{name}</strong>
                        <span>
                          {person.cin ||
                            person.phone ||
                            person.telephone ||
                            person.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <input
                placeholder={t("files.type")}
                value={form.file_type}
                onChange={(event) =>
                  setForm({ ...form, file_type: event.target.value })
                }
              />

              <input
                type="file"
                onChange={(event) =>
                  setForm({ ...form, file: event.target.files?.[0] || null })
                }
              />

              <textarea
                placeholder={t("files.description")}
                value={form.metadata}
                onChange={(event) =>
                  setForm({ ...form, metadata: event.target.value })
                }
              />
            </div>

            <div className="files-modal-actions">
              <button
                type="button"
                className="files-cancel-btn"
                onClick={() => setModal(false)}
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                className="files-save-btn"
                onClick={upload}
                disabled={uploading}
              >
                {uploading
                  ? label(lang, "Importation...", "Uploading...")
                  : t("files.upload")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}