const BASE = "http://localhost:5000/api/contacts";

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
    const res = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  },

  searchApolloLeads: async (params) => {
    const res = await fetch("http://localhost:5000/api/apollo/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Search failed");
    return data;
  },

  importApolloLeads: async (leads) => {
    const res = await fetch("http://localhost:5000/api/apollo/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Import failed");
    return data;
  },

  getSequences: () => request("http://localhost:5000/api/sequences"),
  getSequence: (id) => request(`http://localhost:5000/api/sequences/${id}`),
  createSequence: (data) => request("http://localhost:5000/api/sequences", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  updateSequence: (id, data) => request(`http://localhost:5000/api/sequences/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  }),
  deleteSequence: (id) => request(`http://localhost:5000/api/sequences/${id}`, {
    method: "DELETE"
  }),
  manageSequenceContacts: (id, payload) => request(`http://localhost:5000/api/sequences/${id}/contacts`, {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  runSequence: (id) => request(`http://localhost:5000/api/sequences/${id}/run`, {
    method: "POST"
  }),
  getSettings: () => request("http://localhost:5000/api/settings"),
  updateSettings: (data) => request("http://localhost:5000/api/settings", {
    method: "PUT",
    body: JSON.stringify(data)
  }),
};
