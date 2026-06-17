const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

function getToken() {
  return localStorage.getItem("snip_access_token") || sessionStorage.getItem("snip_access_token") || "";
}
function setToken(token, remember = false) {
  (remember ? localStorage : sessionStorage).setItem("snip_access_token", token);
}
function clearToken() {
  localStorage.removeItem("snip_access_token");
  sessionStorage.removeItem("snip_access_token");
}
async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || "Erreur de communication avec le backend.");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
function toQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") query.append(k, v); });
  return query.toString() ? `?${query}` : "";
}
function normalize(payload, listKeys = []) {
  if (Array.isArray(payload)) return { data: payload, total: payload.length, raw: payload };
  const key = listKeys.find((k) => Array.isArray(payload?.[k]));
  const data = key ? payload[key] : payload?.data || payload?.items || payload?.results || [];
  const total = payload?.pagination?.total ?? payload?.total ?? payload?.count ?? data.length ?? 0;
  return { ...payload, data, total };
}

export const authApi = {
  async login(credentials) {
    const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ username: credentials.username, password: credentials.password }) });
    if (data.token) setToken(data.token, credentials.remember);
    if (data.user) localStorage.setItem("snip_user", JSON.stringify(data.user));
    return data;
  },
  async logout() { try { await request("/auth/logout", { method: "POST" }); } finally { clearToken(); localStorage.removeItem("snip_user"); } },
  profile() { return request("/auth/profile"); },
};

export const personsApi = {
  async list(params = {}) { return normalize(await request(`/persons/search${toQuery(params)}`), ["persons"]); },
  get(id) { return request(`/persons/${id}${toQuery({ includeDetails: true })}`); },
  create(payload) { return request("/persons", { method: "POST", body: JSON.stringify(payload) }); },
  update(id, payload) { return request(`/persons/${id}`, { method: "PUT", body: JSON.stringify(payload) }); },
  remove(id) { return request(`/persons/${id}`, { method: "DELETE" }); },
};
export const usersApi = {
  async list(params = {}) { return normalize(await request(`/users${toQuery(params)}`), ["users"]); },
  async roles() { return normalize(await request("/users/roles")); },
  create(payload) { return request("/users", { method: "POST", body: JSON.stringify(payload) }); },
  update(id, payload) { return request(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) }); },
  remove(id) { return request(`/users/${id}`, { method: "DELETE" }); },
};
export const auditApi = {
  async list(params = {}) { return normalize(await request(`/audit/logs${toQuery(params)}`), ["logs"]); },
  stats() { return request("/audit/stats"); },
};
export const eventsApi = {
  async listByPerson(personId, params = {}) { return normalize(await request(`/events/person/${personId}${toQuery(params)}`), ["events"]); },
  create(payload) { return request("/events", { method: "POST", body: JSON.stringify(payload) }); },
  update(id, payload) { return request(`/events/${id}`, { method: "PUT", body: JSON.stringify(payload) }); },
  remove(id) { return request(`/events/${id}`, { method: "DELETE" }); },
};
export const filesApi = {
  async listByPerson(personId, params = {}) { return normalize(await request(`/files/person/${personId}${toQuery(params)}`), ["files"]); },
  upload(personId, formData) { formData.set("person_id", personId); return request("/files/upload", { method: "POST", body: formData }); },
  remove(id) { return request(`/files/${id}`, { method: "DELETE" }); },
};
export const dashboardApi = {
  async summary() {
    const safe = async (fn, fallback) => { try { return await fn(); } catch { return fallback; } };
    const [persons, users, audit] = await Promise.all([
      safe(() => personsApi.list({ page: 1, limit: 1 }), { total: 0, data: [] }),
      safe(() => usersApi.list({ page: 1, limit: 1 }), { total: 0, data: [] }),
      safe(() => auditApi.stats(), { stats: {}, recentActivities: [], actionsByDay: [] }),
    ]);
    return {
      persons: persons.total || 0,
      users: users.total || 0,
      documents: 0,
      events: 0,
      recent_activities: audit.recentActivities || [],
      actions_by_day: audit.actionsByDay || [],
      persons_by_region: [],
      audit_stats: audit.stats || {},
    };
  },
};
export const searchApi = { async global(q) { return personsApi.list({ q, page: 1, limit: 50 }); } };
export { API_BASE_URL, getToken, clearToken };
