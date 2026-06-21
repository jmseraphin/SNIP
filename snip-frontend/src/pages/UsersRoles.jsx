import "../styles/documents.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { usersApi } from "../services/api";
import { fmtDate, number } from "../utils/format";
import { t, tr, useLang } from "../i18n";
import {
  FaUserShield,
  FaSearch,
  FaSyncAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaKey,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

const emptyUserForm = {
  id: "",
  username: "",
  email: "",
  full_name: "",
  role_id: "",
  status: "active",
  password: "",
};

function label(lang, fr, en) {
  return lang === "en" ? en : fr;
}

function getUserId(user) {
  return user.id || user.user_id || "";
}

function getUserName(user) {
  return user.username || user.login || "—";
}

function getUserEmail(user) {
  return user.email || "—";
}

function getUserFullName(user) {
  return (
    user.full_name ||
    user.fullName ||
    user.name ||
    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
    "—"
  );
}

function getUserRoleId(user) {
  return user.role_id || user.roleId || user.role?.id || "";
}

function getRoleId(role) {
  return role.id || role.role_id || role.roleId || "";
}

function getRoleName(role) {
  return role.name || role.role_name || role.roleName || "—";
}

function getUserRoleName(user, roles = []) {
  if (user.role_name) return user.role_name;
  if (user.roleName) return user.roleName;
  if (user.role?.name) return user.role.name;

  const roleId = getUserRoleId(user);
  const found = roles.find((role) => String(getRoleId(role)) === String(roleId));

  return found ? getRoleName(found) : roleId || "—";
}

function getUserStatus(user) {
  return (
    user.status ||
    user.state ||
    (user.is_active === false ? "inactive" : "active")
  );
}

function displayStatus(status, lang) {
  const value = String(status || "active").toLowerCase();

  if (value === "active") return t("users.active");
  if (value === "inactive") return t("users.inactive");
  if (value === "locked") return t("users.locked");

  return label(lang, status || "active", status || "active");
}

function getRolePermissions(role) {
  const value = role.permissions || role.permission || role.rules || "";

  if (!value) return "—";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return "—";
  }
}

function normalizeList(response, key) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.[key])) return response[key];
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

function passwordIsValid(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(
    password
  );
}

function getBackendError(error, fallback) {
  return (
    error?.data?.message ||
    error?.data?.error ||
    error?.data?.details ||
    error?.message ||
    fallback
  );
}

export default function UsersRoles() {
  const lang = useLang();

  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [q, setQ] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [usersReady, setUsersReady] = useState(true);
  const [rolesReady, setRolesReady] = useState(true);
  const [userModal, setUserModal] = useState(null);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    try {
      setLoadingUsers(true);
      setUsersReady(true);
      setError("");

      const response = await usersApi.list({
        page: 1,
        limit: 200,
      });

      setUsers(normalizeList(response, "users"));
    } catch {
      setUsers([]);
      setUsersReady(false);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadRoles() {
    try {
      setLoadingRoles(true);
      setRolesReady(true);

      const response = await usersApi.roles();

      setRoles(normalizeList(response, "roles"));
    } catch {
      setRoles([]);
      setRolesReady(false);
    } finally {
      setLoadingRoles(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadUsers(), loadRoles()]);
  }

  useEffect(() => {
    refreshAll();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = String(q || "").toLowerCase().trim();

    if (!keyword) return users;

    return users.filter((user) => {
      const values = [
        getUserName(user),
        getUserEmail(user),
        getUserFullName(user),
        getUserRoleName(user, roles),
        getUserStatus(user),
        displayStatus(getUserStatus(user), lang),
        getUserId(user),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }, [users, roles, q, lang]);

  const filteredRoles = useMemo(() => {
    const keyword = String(q || "").toLowerCase().trim();

    if (!keyword) return roles;

    return roles.filter((role) => {
      const values = [
        getRoleId(role),
        getRoleName(role),
        role.description,
        getRolePermissions(role),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }, [roles, q]);

  function openCreateUser() {
    setUserForm(emptyUserForm);
    setShowPassword(false);
    setError("");
    setUserModal("create");
  }

  function openEditUser(user) {
    setUserForm({
      id: getUserId(user),
      username: getUserName(user) === "—" ? "" : getUserName(user),
      email: getUserEmail(user) === "—" ? "" : getUserEmail(user),
      full_name: getUserFullName(user) === "—" ? "" : getUserFullName(user),
      role_id: getUserRoleId(user),
      status: getUserStatus(user),
      password: "",
    });

    setShowPassword(false);
    setError("");
    setUserModal("edit");
  }

  async function saveUser() {
    try {
      setSaving(true);
      setError("");

      if (!userForm.full_name) {
        setError(label(lang, "Le nom complet est obligatoire.", "Full name is required."));
        return;
      }

      if (!userForm.username) {
        setError(label(lang, "Le nom d’utilisateur est obligatoire.", "Username is required."));
        return;
      }

      if (!userForm.email) {
        setError(label(lang, "L’email est obligatoire.", "Email is required."));
        return;
      }

      if (!userForm.role_id) {
        setError(label(lang, "Le rôle est obligatoire.", "Role is required."));
        return;
      }

      if (userModal === "create" && !userForm.password) {
        setError(label(lang, "Le mot de passe est obligatoire.", "Password is required."));
        return;
      }

      if (userForm.password && !passwordIsValid(userForm.password)) {
        setError(
          label(
            lang,
            "Mot de passe invalide : 8 caractères minimum, majuscule, minuscule, chiffre et caractère spécial.",
            "Invalid password: minimum 8 characters, uppercase, lowercase, number and special character."
          )
        );
        return;
      }

      const selectedRole = roles.find(
        (role) =>
          String(getRoleId(role)) === String(userForm.role_id) ||
          String(getRoleName(role)) === String(userForm.role_id)
      );

      const payload = {
        username: userForm.username,
        email: userForm.email,
        full_name: userForm.full_name,
        role_id: selectedRole ? getRoleId(selectedRole) : userForm.role_id,
      };

      if (userModal === "create") {
        payload.password = userForm.password;
      }

      if (userModal === "edit") {
        payload.status = userForm.status;

        if (userForm.password) {
          payload.password = userForm.password;
        }
      }

      if (userModal === "edit" && userForm.id) {
        await usersApi.update(userForm.id, payload);
      } else {
        await usersApi.create(payload);
      }

      setUserModal(null);
      setError("");
      setUserForm(emptyUserForm);
      await loadUsers();
    } catch (error) {
      if (userModal === "create") {
        try {
          const response = await usersApi.list({
            page: 1,
            limit: 200,
          });

          const freshUsers = normalizeList(response, "users");
          const createdUser = freshUsers.find(
            (user) =>
              String(getUserName(user)).toLowerCase() ===
              String(userForm.username).toLowerCase()
          );

          if (createdUser) {
            setUsers(freshUsers);
            setUserModal(null);
            setError("");
            setUserForm(emptyUserForm);
            return;
          }
        } catch {
          setError("");
        }
      }

      setError(getBackendError(error, t("users.saveError")));
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(user) {
    try {
      const id = getUserId(user);
      if (!id) return;

      const confirmed = window.confirm(t("users.deleteConfirm"));
      if (!confirmed) return;

      await usersApi.remove(id);
      await loadUsers();
    } catch (error) {
      setError(getBackendError(error, t("users.deleteError")));
    }
  }

  return (
    <>
      <Topbar title={t("users.title")} />

      <div className="documents-page">
        <div className="documents-stats">
          <div className="document-stat-card">
            <div className="document-stat-icon">
              <FaUserShield />
            </div>

            <div>
              <h3>{t("users.total")}</h3>
              <p>
                {loadingUsers
                  ? "…"
                  : usersReady
                  ? number(filteredUsers.length)
                  : "—"}
              </p>
            </div>
          </div>

          <div className="document-stat-card">
            <div className="document-stat-icon">
              <FaKey />
            </div>

            <div>
              <h3>{label(lang, "Total rôles", "Total roles")}</h3>
              <p>
                {loadingRoles
                  ? "…"
                  : rolesReady
                  ? number(filteredRoles.length)
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="documents-table-box">
          <div className="documents-table-header">
            <div>
              <h3>{label(lang, "Gestion des accès", "Access management")}</h3>
              <span>
                {label(
                  lang,
                  "Utilisateurs, rôles et permissions du système SNIP",
                  "Users, roles and permissions of the SNIP system"
                )}
              </span>
            </div>

            <div className="documents-header-actions">
              <button type="button" className="document-add-btn" onClick={refreshAll}>
                <FaSyncAlt /> {t("common.refresh")}
              </button>

              {activeTab === "users" && (
                <button
                  type="button"
                  className="document-add-btn"
                  onClick={openCreateUser}
                >
                  <FaPlus /> {t("common.add")}
                </button>
              )}
            </div>
          </div>

          <div className="details-tabs">
            <button
              type="button"
              className={activeTab === "users" ? "active" : ""}
              onClick={() => setActiveTab("users")}
            >
              <FaUserShield /> {t("users.list")}
            </button>

            <button
              type="button"
              className={activeTab === "roles" ? "active" : ""}
              onClick={() => setActiveTab("roles")}
            >
              <FaKey /> {t("settings.roles")}
            </button>
          </div>

          <div className="documents-filters">
            <div className="documents-search-box">
              <FaSearch className="documents-search-icon" />

              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={
                  activeTab === "users"
                    ? t("users.searchPlaceholder")
                    : label(lang, "Rechercher rôle ou permission...", "Search role or permission...")
                }
              />
            </div>
          </div>

          {error && !userModal && <div className="documents-error">{error}</div>}

          {activeTab === "users" && (
            <div className="documents-table-responsive">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>{t("users.fullName")}</th>
                    <th>{t("users.username")}</th>
                    <th>{t("users.email")}</th>
                    <th>{t("users.role")}</th>
                    <th>{t("users.status")}</th>
                    <th>{t("common.createdAt")}</th>
                    <th>{t("common.actions")}</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingUsers && (
                    <tr>
                      <td colSpan="7" className="documents-empty">
                        {t("common.loading")}
                      </td>
                    </tr>
                  )}

                  {!loadingUsers && !usersReady && (
                    <tr>
                      <td colSpan="7" className="documents-empty">
                        —
                      </td>
                    </tr>
                  )}

                  {!loadingUsers && usersReady && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="documents-empty">
                        {t("users.notFound")}
                      </td>
                    </tr>
                  )}

                  {!loadingUsers &&
                    usersReady &&
                    filteredUsers.map((user, index) => (
                      <tr key={getUserId(user) || index}>
                        <td>{getUserFullName(user)}</td>
                        <td>{getUserName(user)}</td>
                        <td>{getUserEmail(user)}</td>

                        <td>
                          <span className="document-type">
                            {getUserRoleName(user, roles)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              getUserStatus(user) === "active"
                                ? "document-valid"
                                : "document-unknown"
                            }
                          >
                            {displayStatus(getUserStatus(user), lang)}
                          </span>
                        </td>

                        <td>
                          {user.created_at || user.createdAt
                            ? fmtDate(user.created_at || user.createdAt)
                            : "—"}
                        </td>

                        <td>
                          <div className="document-action-buttons">
                            <button
                              type="button"
                              className="document-icon-action"
                              onClick={() => openEditUser(user)}
                              title={t("common.edit")}
                            >
                              <FaEdit />
                            </button>

                            <button
                              type="button"
                              className="document-icon-action document-delete-btn"
                              onClick={() => removeUser(user)}
                              title={t("common.delete")}
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
          )}

          {activeTab === "roles" && (
            <div className="documents-table-responsive">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>{t("common.role")}</th>
                    <th>{t("common.description")}</th>
                    <th>{t("users.permissions")}</th>
                    <th>{t("common.createdAt")}</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingRoles && (
                    <tr>
                      <td colSpan="4" className="documents-empty">
                        {t("common.loading")}
                      </td>
                    </tr>
                  )}

                  {!loadingRoles && !rolesReady && (
                    <tr>
                      <td colSpan="4" className="documents-empty">
                        —
                      </td>
                    </tr>
                  )}

                  {!loadingRoles && rolesReady && filteredRoles.length === 0 && (
                    <tr>
                      <td colSpan="4" className="documents-empty">
                        {label(lang, "Aucun rôle trouvé", "No role found")}
                      </td>
                    </tr>
                  )}

                  {!loadingRoles &&
                    rolesReady &&
                    filteredRoles.map((role, index) => (
                      <tr key={getRoleId(role) || index}>
                        <td>
                          <span className="document-type">
                            {getRoleName(role)}
                          </span>
                        </td>

                        <td>{role.description || "—"}</td>
                        <td>{getRolePermissions(role)}</td>

                        <td>
                          {role.created_at || role.createdAt
                            ? fmtDate(role.created_at || role.createdAt)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="documents-pagination">
            <span>
              {tr("users.display", {
                shown:
                  activeTab === "users"
                    ? usersReady
                      ? filteredUsers.length
                      : "—"
                    : rolesReady
                    ? filteredRoles.length
                    : "—",
                total:
                  activeTab === "users"
                    ? usersReady
                      ? filteredUsers.length
                      : "—"
                    : rolesReady
                    ? filteredRoles.length
                    : "—",
              })}
            </span>
          </div>
        </div>
      </div>

      {userModal && (
        <div className="documents-modal-overlay">
          <div className="documents-modal-box">
            <button
              type="button"
              className="documents-modal-close"
              onClick={() => setUserModal(null)}
            >
              <FaTimes />
            </button>

            <h3>{userModal === "create" ? t("users.add") : t("users.edit")}</h3>

            {error && <div className="documents-error">{error}</div>}

            <div className="documents-form-grid">
              <div className="document-field">
                <label>{t("users.fullName")}</label>
                <input
                  value={userForm.full_name}
                  onChange={(event) =>
                    setUserForm({ ...userForm, full_name: event.target.value })
                  }
                  placeholder={t("users.fullName")}
                />
              </div>

              <div className="document-field">
                <label>{t("users.username")}</label>
                <input
                  value={userForm.username}
                  onChange={(event) =>
                    setUserForm({ ...userForm, username: event.target.value })
                  }
                  placeholder={t("users.username")}
                />
              </div>

              <div className="document-field">
                <label>{t("users.email")}</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm({ ...userForm, email: event.target.value })
                  }
                  placeholder={t("users.email")}
                />
              </div>

              <div className="document-field">
                <label>{t("users.role")}</label>
                <select
                  value={userForm.role_id}
                  onChange={(event) =>
                    setUserForm({ ...userForm, role_id: event.target.value })
                  }
                >
                  <option value="">
                    {label(lang, "Sélectionner un rôle", "Select a role")}
                  </option>

                  {roles.map((role) => (
                    <option key={getRoleId(role)} value={getRoleId(role)}>
                      {getRoleName(role)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="document-field">
                <label>{t("users.status")}</label>
                <select
                  value={userForm.status}
                  onChange={(event) =>
                    setUserForm({ ...userForm, status: event.target.value })
                  }
                  disabled={userModal === "create"}
                >
                  <option value="active">{t("users.active")}</option>
                  <option value="inactive">{t("users.inactive")}</option>
                  <option value="locked">{t("users.locked")}</option>
                </select>
              </div>

              <div className="document-field password-field">
                <label>{t("users.password")}</label>

                <div className="password-input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={(event) =>
                      setUserForm({ ...userForm, password: event.target.value })
                    }
                    placeholder={
                      userModal === "edit"
                        ? label(
                            lang,
                            "Laisser vide pour ne pas changer",
                            "Leave empty to keep unchanged"
                          )
                        : "Ex: Admin@123"
                    }
                  />

                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((value) => !value)}
                    title={
                      showPassword
                        ? label(lang, "Masquer le mot de passe", "Hide password")
                        : label(lang, "Afficher le mot de passe", "Show password")
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>

            <div className="documents-modal-actions">
              <button
                type="button"
                className="documents-cancel-btn"
                onClick={() => setUserModal(null)}
                disabled={saving}
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                className="documents-save-btn"
                onClick={saveUser}
                disabled={saving}
              >
                <FaSave /> {saving ? t("common.loading") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}