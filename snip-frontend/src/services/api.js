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

function extractArray(payload, listKeys = []) {
  if (Array.isArray(payload)) return payload;

  for (const key of listKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;

  return [];
}

function normalize(payload, listKeys = []) {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      total: payload.length,
      raw: payload,
    };
  }

  const data = extractArray(payload, listKeys);

  const total =
    payload?.pagination?.total ??
    payload?.meta?.total ??
    payload?.total ??
    payload?.count ??
    payload?.totalCount ??
    data.length ??
    0;

  return {
    ...payload,
    data,
    total,
  };
}

function countFrom(response, listKeys = []) {
  if (!response) return 0;

  const data = extractArray(response, listKeys);
  const dataLength = data.length;

  const declaredTotal =
    response?.pagination?.total ??
    response?.meta?.total ??
    response?.total ??
    response?.count ??
    response?.totalCount ??
    0;

  return Math.max(Number(declaredTotal) || 0, dataLength);
}

function uniqueById(list = []) {
  const seen = new Set();

  return list.filter((item, index) => {
    const key =
      item?.id ||
      item?.uuid ||
      item?.relationship_id ||
      item?.file_id ||
      `${item?.person_id || item?.personId || ""}-${
        item?.related_person_id || item?.relatedPersonId || ""
      }-${item?.relationship_type || item?.type || ""}-${index}`;

    if (!key) return true;

    const normalizedKey = String(key);

    if (seen.has(normalizedKey)) return false;

    seen.add(normalizedKey);
    return true;
  });
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
    return normalize(await request("/users/roles"), ["roles"]);
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

  async listByTarget(targetType, targetId, params = {}) {
    return normalize(
      await request(
        `/audit/logs${toQuery({
          target_type: targetType,
          target_id: targetId,
          ...params,
        })}`
      ),
      ["logs"]
    );
  },

  stats() {
    return request("/audit/stats");
  },
};

export const eventsApi = {
  async list(params = {}) {
    try {
      const direct = normalize(await request(`/events${toQuery(params)}`), [
        "events",
      ]);

      if ((direct.data || []).length > 0) return direct;
    } catch {
      // fallback audit logs etsy ambany
    }

    const logsResponse = await auditApi.list({
      page: 1,
      limit: params.limit || 300,
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
  async list(params = {}) {
    try {
      const direct = normalize(await request(`/files${toQuery(params)}`), [
        "files",
      ]);

      if ((direct.data || []).length > 0) return direct;
    } catch {
      // fallback etsy ambany
    }

    let persons = [];

    try {
      const logs = await auditApi.list({ page: 1, limit: 500 });

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

      persons = people.filter(Boolean);
    } catch {
      const personsResponse = await personsApi.list({
        page: 1,
        limit: 500,
      });

      persons = personsResponse.data || [];
    }

    const results = await Promise.all(
      persons.map(async (person) => {
        try {
          const response = await filesApi.listByPerson(person.id, {
            page: 1,
            limit: 100,
          });

          return (response.data || []).map((file) => ({
            ...file,
            person_id: file.person_id || person.id,
          }));
        } catch {
          return [];
        }
      })
    );

    const data = uniqueById(results.flat());

    return {
      data,
      total: data.length,
    };
  },

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

export const relationshipsApi = {
  async list(params = {}) {
    try {
      const response = await request(`/relationships${toQuery(params)}`);

      const direct = normalize(response, ["relationships"]);

      if ((direct.data || []).length > 0) {
        return {
          data: direct.data,
          total: direct.data.length,
        };
      }
    } catch {
      
    }

    let persons = [];

    try {
      const personsResponse = await personsApi.list();
      persons = extractArray(personsResponse, ["persons"]);
    } catch {
      persons = [];
    }

    const allRelations = [];

    for (const person of persons) {
      try {
        const response = await request(
          `/relationships/person/${person.id}${toQuery({
            page: 1,
            limit: 100,
          })}`
        );

        const rows = extractArray(response, ["relationships"]);

        rows.forEach((relation) => {
          allRelations.push({
            ...relation,
            person_id: relation.person_id || person.id,
          });
        });
      } catch {
        
      }
    }

    const data = uniqueById(allRelations);

    return {
      data,
      total: data.length,
    };
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

export const addressesApi = {
  async list(params = {}) {
    return normalize(
      await request(`/addresses${toQuery(params)}`),
      ["addresses"]
    );
  },

  async listByPerson(personId, params = {}) {
    return normalize(
      await request(`/addresses/person/${personId}${toQuery(params)}`),
      ["addresses"]
    );
  },

  get(id) {
    return request(`/addresses/${id}`);
  },

  create(payload) {
    return request("/addresses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id, payload) {
    return request(`/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  remove(id) {
    return request(`/addresses/${id}`, {
      method: "DELETE",
    });
  },
};

export const contactsApi = {
  async list(params = {}) {
    return normalize(
      await request(`/contacts${toQuery(params)}`),
      ["contacts"]
    );
  },

  async listByPerson(personId, params = {}) {
    return normalize(
      await request(`/contacts/person/${personId}${toQuery(params)}`),
      ["contacts"]
    );
  },

  get(id) {
    return request(`/contacts/${id}`);
  },

  create(payload) {
    return request("/contacts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id, payload) {
    return request(`/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  remove(id) {
    return request(`/contacts/${id}`, {
      method: "DELETE",
    });
  },
};

function getAddressRegion(address) {
  return (
    address?.region ||
    address?.region_name ||
    address?.regionName ||
    address?.province ||
    address?.state ||
    address?.district ||
    address?.city ||
    address?.commune ||
    "Non défini"
  );
}

function buildPersonsByRegionFromAddresses(addresses = []) {
  const groups = new Map();

  addresses.forEach((address, index) => {
    const region = String(getAddressRegion(address) || "Non défini").trim();
    const personId =
      address.person_id ||
      address.personId ||
      address.person?.id ||
      address.owner_id ||
      `address-${address.id || index}`;

    if (!groups.has(region)) {
      groups.set(region, new Set());
    }

    groups.get(region).add(String(personId));
  });

  return [...groups.entries()]
    .map(([region, persons]) => ({
      region,
      total: persons.size,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);
}

export const dashboardApi = {
  async summary() {
    const safe = async (fn, fallback) => {
      try {
        return await fn();
      } catch {
        return fallback;
      }
    };

    const [
      persons,
      users,
      documents,
      relationships,
      events,
      files,
      contacts,
      addresses,
      auditLogs,
      auditStats,
    ] = await Promise.all([
      safe(() => personsApi.list({ page: 1, limit: 1 }), {
        total: 0,
        data: [],
      }),

      safe(() => usersApi.list({ page: 1, limit: 1 }), {
        total: 0,
        data: [],
      }),

      safe(() => identityDocumentsApi.list({ page: 1, limit: 1 }), {
        total: 0,
        data: [],
      }),

      safe(() => relationshipsApi.list({ page: 1, limit: 300 }), {
        total: 0,
        data: [],
      }),

      safe(() => eventsApi.list({ page: 1, limit: 300 }), {
        total: 0,
        data: [],
      }),

      safe(() => filesApi.list({ page: 1, limit: 300 }), {
        total: 0,
        data: [],
      }),

      safe(() => contactsApi.list({ page: 1, limit: 300 }), {
        total: 0,
        data: [],
      }),

      safe(() => addressesApi.list({ page: 1, limit: 500 }), {
        total: 0,
        data: [],
      }),

      safe(() => auditApi.list({ page: 1, limit: 300 }), {
        total: 0,
        data: [],
      }),

      safe(() => auditApi.stats(), {
        stats: {},
        recentActivities: [],
        recent_activities: [],
        actionsByDay: [],
        actions_by_day: [],
      }),
    ]);

    const recentActivities =
      auditStats.recentActivities ||
      auditStats.recent_activities ||
      auditStats.activities ||
      auditLogs.data ||
      [];

    const addressesData = extractArray(addresses, ["addresses"]);

    const regionsFromAddresses =
      buildPersonsByRegionFromAddresses(addressesData);

    const regionsFromPersons =
      persons.persons_by_region ||
      persons.personsByRegion ||
      persons.regions ||
      persons.data?.persons_by_region ||
      [];

    return {
      persons: countFrom(persons, ["persons"]),
      users: countFrom(users, ["users"]),
      documents: countFrom(documents, [
        "identity_documents",
        "identityDocuments",
        "documents",
      ]),
      relationships: countFrom(relationships, ["relationships"]),
      events: countFrom(events, ["events"]),
      files: countFrom(files, ["files"]),
      contacts: countFrom(contacts, ["contacts"]),
      audit_logs: countFrom(auditLogs, ["logs"]),

      recent_activities: recentActivities,
      actions_by_day: auditStats.actionsByDay || auditStats.actions_by_day || [],

      persons_by_region:
        regionsFromAddresses.length > 0 ? regionsFromAddresses : regionsFromPersons,

      audit_stats: auditStats.stats || {},
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

export const rolesApi = {
  async list() {
    return usersApi.roles();
  },

  get(id) {
    return request(`/users/roles/${id}`);
  },

  create(payload) {
    return request("/users/roles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id, payload) {
    return request(`/users/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  remove(id) {
    return request(`/users/roles/${id}`, {
      method: "DELETE",
    });
  },
};

export {
  API_BASE_URL,
  getToken,
  clearToken,
  toQuery,
  normalize,
  extractArray,
  countFrom,
};