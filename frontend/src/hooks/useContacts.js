import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

export function useContacts() {
  const [contacts, setContacts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({ page: 1, limit: 25, sort: "-createdAt" });
  const [filters, setFilters] = useState({});
  const [search, setSearchRaw] = useState("");

  const setSearch = (val) => {
    setSearchRaw(val);
    setParams((p) => ({ ...p, page: 1 }));
  };

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const hasFilters = Object.keys(filters).some((k) => filters[k] !== "" && filters[k] !== undefined);
      const queryParams = { ...params };
      if (search) queryParams.search = search;

      let data;
      if (hasFilters) {
        data = await api.filterContacts({ ...queryParams, ...filters });
      } else {
        data = await api.getContacts(queryParams);
      }
      setContacts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [params, filters, search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const setPage = (page) => setParams((p) => ({ ...p, page }));
  const setSort = (sort) => setParams((p) => ({ ...p, sort, page: 1 }));
  const setLimit = (limit) => setParams((p) => ({ ...p, limit, page: 1 }));

  const applyFilters = (newFilters) => {
    // Remove empty values
    const clean = {};
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v !== "" && v !== undefined && v !== null) clean[k] = v;
    });
    setFilters(clean);
    setParams((p) => ({ ...p, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setParams((p) => ({ ...p, page: 1 }));
  };

  return {
    contacts,
    pagination,
    loading,
    search,
    setSearch,
    setPage,
    setSort,
    setLimit,
    filters,
    applyFilters,
    clearFilters,
    refetch: fetchContacts,
  };
}
