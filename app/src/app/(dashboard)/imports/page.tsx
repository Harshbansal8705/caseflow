"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Import {
  id: string;
  filename: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    cases: number;
  };
}

export default function ImportsPage() {
  const [imports, setImports] = useState<Import[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const fetchImports = useCallback(async (cursor?: string, append = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "20");

      const response = await fetch(`/api/imports?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch imports");

      const data = await response.json();

      if (append) {
        setImports((prev) => [...prev, ...data.imports]);
      } else {
        setImports(data.imports);
      }
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error fetching imports:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImports();
  }, [fetchImports]);

  const loadMore = () => {
    if (nextCursor) {
      fetchImports(nextCursor, true);
    }
  };

  const statusColors: Record<string, string> = {
    PROCESSING: "badge-primary",
    COMPLETED: "badge-success",
    FAILED: "badge-error",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import History</h1>
          <p className="text-muted mt-1">View all your CSV imports</p>
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
          New Import
        </Link>
      </div>

      {/* Imports list */}
      <div className="card">
        <div className="divide-y divide-border">
          {isLoading && imports.length === 0 ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="skeleton w-48 h-5" />
                    <div className="skeleton w-32 h-4" />
                  </div>
                  <div className="skeleton w-24 h-6" />
                </div>
              </div>
            ))
          ) : imports.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No imports yet
              </h2>
              <p className="text-muted mb-4">
                Start by importing your first CSV file
              </p>
              <Link href="/import" className="btn btn-primary">
                Import CSV
              </Link>
            </div>
          ) : (
            imports.map((importItem) => (
              <Link
                key={importItem.id}
                href={`/imports/${importItem.id}`}
                className="block p-4 hover:bg-muted-light transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-primary"
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
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {importItem.filename}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted">
                        <span>{importItem.totalRows} rows</span>
                        <span>•</span>
                        <span className="text-success">
                          {importItem.successCount} succeeded
                        </span>
                        {importItem.failureCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-error">
                              {importItem.failureCount} failed
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`badge ${statusColors[importItem.status]}`}>
                      {importItem.status}
                    </span>
                    <span className="text-sm text-muted">
                      {new Date(importItem.createdAt).toLocaleDateString()}
                    </span>
                    <svg
                      className="w-5 h-5 text-muted"
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
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="p-4 border-t border-border text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="btn btn-secondary"
            >
              {isLoading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
