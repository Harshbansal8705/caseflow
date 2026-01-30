"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Case {
  id: string;
  caseId: string;
  applicantName: string;
  dob: string;
  email: string | null;
  phone: string | null;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Filters {
  status: string;
  category: string;
  priority: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: "",
    category: "",
    priority: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  const fetchCases = useCallback(
    async (cursor?: string, append = false) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        if (filters.status) params.set("status", filters.status);
        if (filters.category) params.set("category", filters.category);
        if (filters.priority) params.set("priority", filters.priority);
        if (filters.search) params.set("search", filters.search);
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);
        params.set("limit", "20");

        const response = await fetch(`/api/cases?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch cases");

        const data = await response.json();

        if (append) {
          setCases((prev) => [...prev, ...data.cases]);
        } else {
          setCases(data.cases);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error("Error fetching cases:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const loadMore = () => {
    if (nextCursor) {
      fetchCases(nextCursor, true);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      category: "",
      priority: "",
      search: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const statusColors: Record<string, string> = {
    PENDING: "badge-warning",
    IN_PROGRESS: "badge-primary",
    COMPLETED: "badge-success",
    REJECTED: "badge-error",
  };

  const priorityColors: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    MEDIUM:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cases</h1>
          <p className="text-muted mt-1">
            View and manage all imported cases
          </p>
        </div>
        <Link href="/import" className="btn btn-primary">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Import New
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by case ID or name..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="input"
              />
            </div>

            {/* Status */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="input w-auto"
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Category */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="input w-auto"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              <option value="TAX">Tax</option>
              <option value="LICENSE">License</option>
              <option value="PERMIT">Permit</option>
            </select>

            {/* Priority */}
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="input w-auto"
              aria-label="Filter by priority"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            {/* Date range */}
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              className="input w-auto"
              aria-label="From date"
            />
            <span className="text-muted">to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              className="input w-auto"
              aria-label="To date"
            />

            {/* Clear filters */}
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-ghost btn-sm">
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cases table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Applicant</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && cases.length === 0 ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div className="skeleton w-24 h-4" />
                    </td>
                    <td>
                      <div className="skeleton w-32 h-4" />
                    </td>
                    <td>
                      <div className="skeleton w-16 h-4" />
                    </td>
                    <td>
                      <div className="skeleton w-16 h-4" />
                    </td>
                    <td>
                      <div className="skeleton w-20 h-4" />
                    </td>
                    <td>
                      <div className="skeleton w-24 h-4" />
                    </td>
                    <td>
                      <div className="skeleton w-8 h-4" />
                    </td>
                  </tr>
                ))
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-muted">No cases found</p>
                    <Link
                      href="/import"
                      className="text-primary text-sm mt-2 inline-block"
                    >
                      Import your first CSV
                    </Link>
                  </td>
                </tr>
              ) : (
                cases.map((caseItem) => (
                  <tr key={caseItem.id}>
                    <td>
                      <Link
                        href={`/cases/${caseItem.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {caseItem.caseId}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-foreground">
                          {caseItem.applicantName}
                        </p>
                        {caseItem.email && (
                          <p className="text-xs text-muted">{caseItem.email}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {caseItem.category}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${priorityColors[caseItem.priority]}`}
                      >
                        {caseItem.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusColors[caseItem.status]}`}>
                        {caseItem.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(caseItem.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link
                        href={`/cases/${caseItem.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="p-4 border-t border-border text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="btn btn-secondary"
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
