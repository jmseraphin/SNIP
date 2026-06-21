import "../styles/documents.css";
import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { usersApi } from "../services/api";
import { fmtDate, number } from "../utils/format";
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

function getBackendError(e, fallback) {
  return (
    e?.data?.message ||
    e?.data?.error ||
    e?.data?.details ||
    e?.message ||
    fallback
  );
}

export default function UsersRoles() {
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
        getUserId(user),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(keyword);
    });
  }, [users, roles, q]);

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
        setError("Le nom complet est obligatoire.");
        return;
      }

      if (!userForm.username) {
        setError("Le nom d’utilisateur est obligatoire.");
        return;
      }

      if (!userForm.email) {
        setError("L’email est obligatoire.");
        return;
      }

      if (!userForm.role_id) {
        setError("Le rôle est obligatoire.");
        return;
      }

      if (userModal === "create" && !userForm.password) {
        setError("Le mot de passe est obligatoire.");
        return;
      }

      if (userForm.password && !passwordIsValid(userForm.password)) {
        setError(
          "Mot de passe invalide : 8 caractères minimum, majuscule, minuscule, chiffre et caractère spécial."
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
    } catch (e) {
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
    
        }
      }

      setError(getBackendError(e, "Erreur lors de l’enregistrement."));
    } finally {
      setSaving(false);
    }
  }

  async function removeUser(user) {
    try {
      const id = getUserId(user);
      if (!id) return;

      const confirmed = window.confirm("Supprimer cet utilisateur ?");
      if (!confirmed) return;

      await usersApi.remove(id);
      await loadUsers();
    } catch (e) {
      setError(getBackendError(e, "Erreur lors de la suppression."));
    }
  }

  return (
    <>
      <Topbar title="Utilisateurs & rôles" />

      <div className="documents-page">
        <div className="documents-stats">
          <div className="document-stat-card">
            <div className="document-stat-icon">
              <FaUserShield />
            </div>

            <div>
              <h3>Total utilisateurs</h3>
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
              <h3>Total rôles</h3>
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
              <h3>Gestion des accès</h3>
              <span>Utilisateurs, rôles et permissions du système SNIP</span>
            </div>

            <div className="documents-header-actions">
              <button className="document-add-btn" onClick={refreshAll}>
                <FaSyncAlt /> Actualiser
              </button>

              {activeTab === "users" && (
                <button className="document-add-btn" onClick={openCreateUser}>
                  <FaPlus /> Ajouter
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
              <FaUserShield /> Utilisateurs
            </button>

            <button
              type="button"
              className={activeTab === "roles" ? "active" : ""}
              onClick={() => setActiveTab("roles")}
            >
              <FaKey /> Rôles & permissions
            </button>
          </div>

          <div className="documents-filters">
            <div className="documents-search-box">
              <FaSearch className="documents-search-icon" />

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  activeTab === "users"
                    ? "Rechercher utilisateur, email, rôle..."
                    : "Rechercher rôle ou permission..."
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
                    <th>Nom complet</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingUsers && (
                    <tr>
                      <td colSpan="7" className="documents-empty">
                        Chargement...
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
                        —
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
                            {getUserStatus(user)}
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
                              className="document-icon-action"
                              onClick={() => openEditUser(user)}
                              title="Modifier"
                            >
                              <FaEdit />
                            </button>

                            <button
                              className="document-icon-action document-delete-btn"
                              onClick={() => removeUser(user)}
                              title="Supprimer"
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
                    <th>Rôle</th>
                    <th>Description</th>
                    <th>Permissions</th>
                    <th>Créé le</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingRoles && (
                    <tr>
                      <td colSpan="4" className="documents-empty">
                        Chargement...
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
                        —
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
              Affichage de{" "}
              {activeTab === "users"
                ? usersReady
                  ? filteredUsers.length
                  : "—"
                : rolesReady
                ? filteredRoles.length
                : "—"}{" "}
              élément(s)
            </span>
          </div>
        </div>
      </div>

      {userModal && (
        <div className="documents-modal-overlay">
          <div className="documents-modal-box">
            <button
              className="documents-modal-close"
              onClick={() => setUserModal(null)}
            >
              <FaTimes />
            </button>

            <h3>
              {userModal === "create"
                ? "Ajouter un utilisateur"
                : "Modifier utilisateur"}
            </h3>

            {error && <div className="documents-error">{error}</div>}

            <div className="documents-form-grid">
              <div className="document-field">
                <label>Nom complet</label>
                <input
                  value={userForm.full_name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, full_name: e.target.value })
                  }
                  placeholder="Nom complet"
                />
              </div>

              <div className="document-field">
                <label>Username</label>
                <input
                  value={userForm.username}
                  onChange={(e) =>
                    setUserForm({ ...userForm, username: e.target.value })
                  }
                  placeholder="Nom d’utilisateur"
                />
              </div>

              <div className="document-field">
                <label>Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  placeholder="Email"
                />
              </div>

              <div className="document-field">
                <label>Rôle</label>
                <select
                  value={userForm.role_id}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role_id: e.target.value })
                  }
                >
                  <option value="">Sélectionner un rôle</option>

                  {roles.map((role) => (
                    <option key={getRoleId(role)} value={getRoleId(role)}>
                      {getRoleName(role)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="document-field">
                <label>Statut</label>
                <select
                  value={userForm.status}
                  onChange={(e) =>
                    setUserForm({ ...userForm, status: e.target.value })
                  }
                  disabled={userModal === "create"}
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="locked">Verrouillé</option>
                </select>
              </div>

              <div className="document-field password-field">
                <label>Mot de passe</label>

                <div className="password-input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    placeholder={
                      userModal === "edit"
                        ? "Laisser vide pour ne pas changer"
                        : "Ex: Admin@123"
                    }
                  />

                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((value) => !value)}
                    title={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>

            <div className="documents-modal-actions">
              <button
                className="documents-cancel-btn"
                onClick={() => setUserModal(null)}
                disabled={saving}
              >
                Annuler
              </button>

              <button
                className="documents-save-btn"
                onClick={saveUser}
                disabled={saving}
              >
                <FaSave /> {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}