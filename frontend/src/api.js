const API_URL = import.meta.env.VITE_API_URL || "";
const BASE = `${API_URL}/api/contacts`;

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  getContacts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`${BASE}?${qs}`);
  },

  filterContacts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`${BASE}/filter?${qs}`);
  },

  getContact: (id) => request(`${BASE}/${id}`),

  createContact: (data) =>
    request(`${BASE}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateContact: (id, data) =>
    request(`${BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  bulkUpdate: (ids, update) =>
    request(`${BASE}/bulk`, {
      method: "PATCH",
      body: JSON.stringify({ ids, update }),
    }),

  sendEmails: (contactIds) =>
    request(`${BASE}/emails/send`, {
      method: "POST",
      body: JSON.stringify({ contactIds }),
    }),

  sendFollowups: (contactIds) =>
    request(`${BASE}/emails/followup`, {
      method: "POST",
      body: JSON.stringify({ contactIds }),
    }),

  getStats: () => request(`${BASE}/stats`),

  uploadCSV: async (file, purpose) => {
    const formData = new FormData();
    formData.append("file", file);
    if (purpose) {
      formData.append("purpose", purpose);
    }
    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  },

  searchApolloLeads: async (params) => {
    const res = await fetch(`${API_URL}/api/apollo/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Search failed");
    return data;
  },

  importApolloLeads: async (leads) => {
    const res = await fetch(`${API_URL}/api/apollo/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Import failed");
    return data;
  },

  getSequences: () => request(`${API_URL}/api/sequences`),
  getSequence: (id) => request(`${API_URL}/api/sequences/${id}`),
  createSequence: (data) => request(`${API_URL}/api/sequences`, {
    method: "POST",
    body: JSON.stringify(data)
  }),
  updateSequence: (id, data) => request(`${API_URL}/api/sequences/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  }),
  deleteSequence: (id) => request(`${API_URL}/api/sequences/${id}`, {
    method: "DELETE"
  }),
  manageSequenceContacts: (id, payload) => request(`${API_URL}/api/sequences/${id}/contacts`, {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  runSequence: (id, payload) => request(`${API_URL}/api/sequences/${id}/run`, {
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined
  }),
  getEligibleContacts: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`${API_URL}/api/sequences/${id}/eligible?${qs}`);
  },
  sendSingleSequenceEmail: (id, payload) => request(`${API_URL}/api/sequences/${id}/send-single`, {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  getSettings: () => request(`${API_URL}/api/settings`),
  updateSettings: (data) => request(`${API_URL}/api/settings`, {
    method: "PUT",
    body: JSON.stringify(data)
  }),
};
