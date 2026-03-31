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

  uploadCSV: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  },
};
