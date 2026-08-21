import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

export function useContacts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });

  // Get active filters from URL (excluding built-in pagination params)
  const filters = {};
  searchParams.forEach((value, key) => {
    if (key !== "page" && key !== "limit" && key !== "sort" && key !== "search") {
      filters[key] = value;
    }
  });

  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 25;
  const sort = searchParams.get("sort") || "-createdAt";

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const hasFilters = Object.keys(filters).some((k) => filters[k] !== "" && filters[k] !== undefined);
      const queryParams = { page, limit, sort };
      if (search) queryParams.search = search;

      console.log("📡 Fetching contacts...", { queryParams, hasFilters, search, filters });

      let data;
      if (hasFilters) {
        data = await api.filterContacts({ ...queryParams, ...filters });
      } else {
        data = await api.getContacts(queryParams);
      }

      setContacts(data.data || []);
      setPagination(data.pagination || { page, limit, total: 0, pages: 0 });
    } catch (err) {
      console.error("❌ Failed to fetch contacts:", err);
    } finally {
      setLoading(false);
    }
    // Deep comparison of filters using JSON stringify to avoid infinite loop
  }, [page, limit, sort, search, JSON.stringify(filters)]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const setPage = (newPage) => {
    setSearchParams((prev) => {
      prev.set("page", newPage.toString());
      return prev;
    }, { replace: true });
  };

  const setSort = (newSort) => {
    setSearchParams((prev) => {
      prev.set("sort", newSort);
      prev.set("page", "1");
      return prev;
    }, { replace: true });
  };

  const setLimit = (newLimit) => {
    setSearchParams((prev) => {
      prev.set("limit", newLimit.toString());
      prev.set("page", "1");
      return prev;
    }, { replace: true });
  };

  const setSearch = (newSearch) => {
    setSearchParams((prev) => {
      if (newSearch) {
        prev.set("search", newSearch);
      } else {
        prev.delete("search");
      }
      prev.set("page", "1");
      return prev;
    }, { replace: true });
  };

  const applyFilters = (newFilters) => {
    setSearchParams((prev) => {
      // Clear old filter parameters (non-pagination parameters)
      const keys = [];
      prev.forEach((_, key) => {
        if (key !== "page" && key !== "limit" && key !== "sort" && key !== "search") {
          keys.push(key);
        }
      });
      keys.forEach((key) => prev.delete(key));

      // Set new ones
      Object.entries(newFilters).forEach(([k, v]) => {
        if (v !== "" && v !== undefined && v !== null) {
          prev.set(k, v.toString());
        }
      });
      prev.set("page", "1");
      return prev;
    }, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams((prev) => {
      const keys = [];
      prev.forEach((_, key) => {
        if (key !== "page" && key !== "limit" && key !== "sort" && key !== "search") {
          keys.push(key);
        }
      });
      keys.forEach((key) => prev.delete(key));
      prev.set("page", "1");
      return prev;
    }, { replace: true });
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
