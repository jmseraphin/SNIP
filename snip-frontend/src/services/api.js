const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

function getToken() {
  return (
    localStorage.getItem("snip_access_token") ||
    sessionStorage.getItem("snip_access_token") ||
    ""
  );
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

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      data?.error ||
        data?.message ||
        "Erreur de communication avec le backend."
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function toQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  return query.toString() ? `?${query}` : "";
}

function normalize(payload, listKeys = []) {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      total: payload.length,
      raw: payload,
    };
  }

  const key = listKeys.find((k) => Array.isArray(payload?.[k]));
  const data = key
    ? payload[key]
    : payload?.data || payload?.items || payload?.results || [];

  const total =
    payload?.pagination?.total ??
    payload?.total ??
    payload?.count ??
    data.length ??
    0;

  return {
    ...payload,
    data,
    total,
  };
}

function extractArray(payload, listKeys = []) {
  if (Array.isArray(payload)) return payload;

  for (const key of listKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;

  return [];
}

export const authApi = {
  async login(credentials) {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });

    if (data.token) setToken(data.token, credentials.remember);
    if (data.user) localStorage.setItem("snip_user", JSON.stringify(data.user));

    return data;
  },

  async logout() {
    try {
      await request("/auth/logout", { method: "POST" });
    } finally {
      clearToken();
      localStorage.removeItem("snip_user");
    }
  },

  profile() {
    return request("/auth/profile");
  },
};

export const personsApi = {
  async list(params = {}) {
    return normalize(
      await request(`/persons/search${toQuery(params)}`),
      ["persons"]
    );
  },

  get(id) {
    return request(`/persons/${id}${toQuery({ includeDetails: true })}`);
  },

  create(payload) {
    return request("/persons", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id, payload) {
    return request(`/persons/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  remove(id) {
    return request(`/persons/${id}`, {
      method: "DELETE",
    });
  },
};

export const usersApi = {
  async list(params = {}) {
    return normalize(await request(`/users${toQuery(params)}`), ["users"]);
  },

  async roles() {
    return normalize(await request("/users/roles"));
  },

  create(payload) {
    return request("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id, payload) {
    return request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  remove(id) {
    return request(`/users/${id}`, {
      method: "DELETE",
    });
  },
};

export const auditApi = {
  async list(params = {}) {
    return normalize(await request(`/audit/logs${toQuery(params)}`), ["logs"]);
  },

  stats() {
    return request("/audit/stats");
  },
};

export const eventsApi = {
  async list(params = {}) {
    const logsResponse = await auditApi.list({
      page: 1,
      limit: params.limit || 200,
    });

    const logs = logsResponse.data || [];

    const eventIds = logs
      .filter(
        (log) =>
          String(log.target_type || log.targetType || "").toLowerCase() ===
          "event"
      )
      .map((log) => log.target_id || log.targetId)
      .filter(Boolean);

    const uniqueIds = [...new Set(eventIds)];

    const events = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const event = await request(`/events/${id}`);
          return event?.data || event?.event || event;
        } catch {
          return null;
        }
      })
    );

    const data = events.filter(Boolean);

    return {
      data,
      total: data.length,
    };
  },

  async listByPerson(personId, params = {}) {
    return normalize(
      await request(`/events/person/${personId}${toQuery(params)}`),
      ["events"]
    );
  },

  get(id) {
    return request(`/events/${id}`);
  },

  create(payload) {
    return request("/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id, payload) {
    return request(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  remove(id) {
    return request(`/events/${id}`, {
      method: "DELETE",
    });
  },
};

export const filesApi = {
  async listByPerson(personId, params = {}) {
    return normalize(
      await request(`/files/person/${personId}${toQuery(params)}`),
      ["files"]
    );
  },

  upload(personId, formData) {
    formData.set("person_id", personId);
    return request("/files/upload", {
      method: "POST",
      body: formData,
    });
  },

  remove(id) {
    return request(`/files/${id}`, {
      method: "DELETE",
    });
  },
};

export const dashboardApi = {
  async summary() {
    const safe = async (fn, fallback) => {
      try {
        return await fn();
      } catch {
        return fallback;
      }
    };

    const [persons, users, events, audit] = await Promise.all([
      safe(() => personsApi.list({ page: 1, limit: 1 }), {
        total: 0,
        data: [],
      }),
      safe(() => usersApi.list({ page: 1, limit: 1 }), {
        total: 0,
        data: [],
      }),
      safe(() => eventsApi.list({ limit: 200 }), {
        total: 0,
        data: [],
      }),
      safe(() => auditApi.stats(), {
        stats: {},
        recentActivities: [],
        actionsByDay: [],
      }),
    ]);

    return {
      persons: persons.total || 0,
      users: users.total || 0,
      documents: 0,
      events: events.total || 0,
      recent_activities: audit.recentActivities || [],
      actions_by_day: audit.actionsByDay || [],
      persons_by_region: [],
      audit_stats: audit.stats || {},
    };
  },
};

export const searchApi = {
  async global(q) {
    return personsApi.list({
      q,
      search: q,
      query: q,
      keyword: q,
      page: 1,
      limit: 50,
    });
  },
};

export const relationshipsApi = {
  async list(params = {}) {
    return normalize(
      await request(`/relationships${toQuery(params)}`),
      ["relationships"]
    );
  },

  async listByPerson(personId, params = {}) {
    return normalize(
      await request(`/relationships/person/${personId}${toQuery(params)}`),
      ["relationships"]
    );
  },

  get(id) {
    return request(`/relationships/${id}`);
  },

  create(payload) {
    return request("/relationships", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id, payload) {
    return request(`/relationships/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  remove(id) {
    return request(`/relationships/${id}`, {
      method: "DELETE",
    });
  },
};
export const identityDocumentsApi = {
  async list(params = {}) {
    return normalize(
      await request(`/identity-documents${toQuery(params)}`),
      ["identity_documents", "identityDocuments", "documents"]
    );
  },

  async listByPerson(personId, params = {}) {
    return normalize(
      await request(`/identity-documents/person/${personId}${toQuery(params)}`),
      ["identity_documents", "identityDocuments", "documents"]
    );
  },

  get(id) {
    return request(`/identity-documents/${id}`);
  },

  create(payload) {
    return request("/identity-documents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id, payload) {
    return request(`/identity-documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  remove(id) {
    return request(`/identity-documents/${id}`, {
      method: "DELETE",
    });
  },
};
export { API_BASE_URL, getToken, clearToken, toQuery, normalize, extractArray };