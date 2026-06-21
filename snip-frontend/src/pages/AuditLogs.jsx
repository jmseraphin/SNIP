import "../styles/documents.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { auditApi } from "../services/api";
import { fmtDate, number } from "../utils/format";
import { t, tr, useLang } from "../i18n";
import { FaClipboardList, FaSearch, FaSyncAlt } from "react-icons/fa";

function label(lang, fr, en) {
  return lang === "en" ? en : fr;
}

function getLogId(log) {
  return log.id || log.log_id || "";
}

function getLogUser(log) {
  return (
    log.username ||
    log.user_name ||
    log.userName ||
    log.user?.username ||
    log.user?.name ||
    log.user_id ||
    "—"
  );
}

function getLogAction(log) {
  return log.action || "—";
}

function getLogTargetType(log) {
  return log.target_type || log.targetType || log.entity_type || "—";
}

function getLogTargetId(log) {
  return log.target_id || log.targetId || log.entity_id || "—";
}

function getLogDetails(log) {
  const value = log.details || log.detail || "";

  if (!value) return "—";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return "—";
  }
}

function getLogMethod(log) {
  return log.method || "—";
}

function getLogEndpoint(log) {
  return log.endpoint || log.path || "—";
}

function getLogStatus(log) {
  return log.status_code || log.statusCode || log.status || "—";
}

function getLogIp(log) {
  return log.ip_address || log.ipAddress || log.ip || "—";
}

function getLogUserAgent(log) {
  return log.user_agent || log.userAgent || "—";
}

function getLogDate(log) {
  return log.created_at || log.createdAt || log.date || "";
}

function normalizeLogs(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.logs)) return response.logs;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

export default function AuditLogs() {
  const lang = useLang();

  const [logs, setLogs] = useState([]);
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(true);

  async function loadLogs() {
    try {
      setLoading(true);
      setReady(true);

      const response = await auditApi.list({
        page: 1,
        limit: 300,
      });

      setLogs(normalizeLogs(response));
    } catch {
      setLogs([]);
      setReady(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const keyword = String(q || "").toLowerCase().trim();
    const action = String(actionFilter || "").toLowerCase().trim();
    const target = String(targetFilter || "").toLowerCase().trim();
    const status = String(statusFilter || "").toLowerCase().trim();

    return logs.filter((log) => {
      const values = [
        getLogUser(log),
        getLogAction(log),
        getLogTargetType(log),
        getLogTargetId(log),
        getLogDetails(log),
        getLogMethod(log),
        getLogEndpoint(log),
        getLogStatus(log),
        getLogIp(log),
        getLogUserAgent(log),
        getLogDate(log),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesKeyword = !keyword || values.includes(keyword);
      const matchesAction =
        !action || String(getLogAction(log)).toLowerCase().includes(action);
      const matchesTarget =
        !target || String(getLogTargetType(log)).toLowerCase().includes(target);
      const matchesStatus =
        !status || String(getLogStatus(log)).toLowerCase().includes(status);

      return matchesKeyword && matchesAction && matchesTarget && matchesStatus;
    });
  }, [logs, q, actionFilter, targetFilter, statusFilter, lang]);

  return (
    <>
      <Topbar title={t("audit.title")} />

      <div className="documents-page">
        <div className="documents-stats">
          <div className="document-stat-card">
            <div className="document-stat-icon">
              <FaClipboardList />
            </div>

            <div>
              <h3>{t("audit.total")}</h3>
              <p>{loading ? "…" : ready ? number(filteredLogs.length) : "—"}</p>
            </div>
          </div>
        </div>

        <div className="documents-table-box">
          <div className="documents-table-header">
            <div>
              <h3>{t("audit.list")}</h3>
              <span>
                {label(
                  lang,
                  "Traçabilité des actions, cibles, endpoints et statuts HTTP",
                  "Traceability of actions, targets, endpoints and HTTP statuses"
                )}
              </span>
            </div>

            <div className="documents-header-actions">
              <button type="button" className="document-add-btn" onClick={loadLogs}>
                <FaSyncAlt /> {t("common.refresh")}
              </button>
            </div>
          </div>

          <div className="documents-filters">
            <div className="documents-search-box">
              <FaSearch className="documents-search-icon" />

              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={t("audit.searchPlaceholder")}
              />
            </div>
          </div>

          <div className="documents-filters">
            <div className="documents-search-box">
              <input
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                placeholder={label(lang, "Filtrer par action", "Filter by action")}
              />
            </div>

            <div className="documents-search-box">
              <input
                value={targetFilter}
                onChange={(event) => setTargetFilter(event.target.value)}
                placeholder={label(lang, "Filtrer par cible", "Filter by target")}
              />
            </div>

            <div className="documents-search-box">
              <input
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                placeholder={label(lang, "Filtrer par statut", "Filter by status")}
              />
            </div>
          </div>

          <div className="documents-table-responsive">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>{t("audit.user")}</th>
                  <th>{t("audit.action")}</th>
                  <th>{t("audit.targetType")}</th>
                  <th>{t("audit.targetId")}</th>
                  <th>{label(lang, "Méthode", "Method")}</th>
                  <th>Endpoint</th>
                  <th>{t("common.status")}</th>
                  <th>{t("audit.ip")}</th>
                  <th>{t("audit.date")}</th>
                  <th>{t("audit.details")}</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="10" className="documents-empty">
                      {t("common.loading")}
                    </td>
                  </tr>
                )}

                {!loading && !ready && (
                  <tr>
                    <td colSpan="10" className="documents-empty">
                      —
                    </td>
                  </tr>
                )}

                {!loading && ready && filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="10" className="documents-empty">
                      {t("audit.notFound")}
                    </td>
                  </tr>
                )}

                {!loading &&
                  ready &&
                  filteredLogs.map((log, index) => (
                    <tr key={getLogId(log) || index}>
                      <td>{getLogUser(log)}</td>

                      <td>
                        <span className="document-type">{getLogAction(log)}</span>
                      </td>

                      <td>{getLogTargetType(log)}</td>
                      <td>{getLogTargetId(log)}</td>
                      <td>{getLogMethod(log)}</td>
                      <td>{getLogEndpoint(log)}</td>

                      <td>
                        <span
                          className={
                            String(getLogStatus(log)).startsWith("2")
                              ? "document-valid"
                              : String(getLogStatus(log)).startsWith("4") ||
                                String(getLogStatus(log)).startsWith("5")
                              ? "document-invalid"
                              : "document-unknown"
                          }
                        >
                          {getLogStatus(log)}
                        </span>
                      </td>

                      <td>{getLogIp(log)}</td>

                      <td>
                        {getLogDate(log) ? fmtDate(getLogDate(log)) : "—"}
                      </td>

                      <td>{getLogDetails(log)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="documents-pagination">
            <span>
              {tr("audit.display", {
                shown: ready ? filteredLogs.length : "—",
                total: ready ? filteredLogs.length : "—",
              })}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}