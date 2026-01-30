"use client";

import { useMemo } from "react";
import { useImportStore } from "@/state/store";

export default function ValidationPanel() {
  const { validationErrors, rawData } = useImportStore();

  const errorsByField = useMemo(() => {
    const grouped: Record<string, number> = {};
    validationErrors.forEach((error) => {
      grouped[error.field] = (grouped[error.field] || 0) + 1;
    });
    return grouped;
  }, [validationErrors]);

  const errorsByType = useMemo(() => {
    const grouped: Record<string, number> = {};
    validationErrors.forEach((error) => {
      // Extract error type from message
      const type = error.message.includes("required")
        ? "Missing Required"
        : error.message.includes("Invalid")
          ? "Invalid Format"
          : "Validation Error";
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  }, [validationErrors]);

  const affectedRows = useMemo(() => {
    const rows = new Set(validationErrors.map((e) => e.row));
    return rows.size;
  }, [validationErrors]);

  const validRows = rawData.length - affectedRows;
  const validPercentage =
    rawData.length > 0 ? Math.round((validRows / rawData.length) * 100) : 0;

  if (validationErrors.length === 0) {
    return (
      <div className="bg-success-light border border-success/20 rounded-lg p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-success"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <p className="font-medium text-success">All rows are valid!</p>
          <p className="text-sm text-success/80">
            Ready to submit {rawData.length} cases
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border border-border rounded-lg overflow-hidden">
      {/* Summary header */}
      <div className="p-4 border-b border-border bg-error-light">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium text-error">
              {validationErrors.length} validation error
              {validationErrors.length !== 1 ? "s" : ""} found
            </p>
            <p className="text-sm text-error/80">
              {affectedRows} of {rawData.length} rows affected
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted">Valid rows</span>
          <span className="font-medium text-foreground">
            {validRows} / {rawData.length} ({validPercentage}%)
          </span>
        </div>
        <div className="progress">
          <div
            className={`progress-bar ${validPercentage === 100 ? "progress-bar-success" : ""}`}
            style={{ width: `${validPercentage}%` }}
          />
        </div>
      </div>

      {/* Error breakdown */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* By field */}
          <div>
            <h4 className="text-sm font-medium text-muted mb-2">
              Errors by Field
            </h4>
            <div className="space-y-2">
              {Object.entries(errorsByField).map(([field, count]) => (
                <div
                  key={field}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground capitalize">
                    {field.replace(/_/g, " ")}
                  </span>
                  <span className="badge badge-error">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By type */}
          <div>
            <h4 className="text-sm font-medium text-muted mb-2">
              Errors by Type
            </h4>
            <div className="space-y-2">
              {Object.entries(errorsByType).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{type}</span>
                  <span className="badge badge-warning">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent errors list */}
      <div className="border-t border-border">
        <div className="px-4 py-2 bg-muted-light">
          <h4 className="text-sm font-medium text-muted">
            Recent Errors (showing first 5)
          </h4>
        </div>
        <div className="divide-y divide-border max-h-48 overflow-auto">
          {validationErrors.slice(0, 5).map((error, index) => (
            <div key={index} className="px-4 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Row {error.row + 1}</span>
                <span className="font-medium text-foreground capitalize">
                  {error.field.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-error text-xs mt-1">{error.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
