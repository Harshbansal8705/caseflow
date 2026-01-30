"use client";

import { useCallback } from "react";
import { useImportStore } from "@/state/store";
import { titleCase, normalizePhone } from "@/lib/validations";

export default function FixAllToolbar() {
  const { rawData, updateMultipleRows } = useImportStore();

  const trimWhitespace = useCallback(() => {
    const updates: { rowIndex: number; field: string; value: string }[] = [];

    rawData.forEach((row) => {
      const fields = ["case_id", "applicant_name", "email", "phone"] as const;
      fields.forEach((field) => {
        const value = row[field];
        if (typeof value === "string" && value !== value.trim()) {
          updates.push({
            rowIndex: row._rowIndex,
            field,
            value: value.trim(),
          });
        }
      });
    });

    if (updates.length > 0) {
      updateMultipleRows(updates);
    }

    return updates.length;
  }, [rawData, updateMultipleRows]);

  const titleCaseNames = useCallback(() => {
    const updates: { rowIndex: number; field: string; value: string }[] = [];

    rawData.forEach((row) => {
      const name = row.applicant_name;
      if (typeof name === "string" && name.trim()) {
        const titleCased = titleCase(name);
        if (titleCased !== name) {
          updates.push({
            rowIndex: row._rowIndex,
            field: "applicant_name",
            value: titleCased,
          });
        }
      }
    });

    if (updates.length > 0) {
      updateMultipleRows(updates);
    }

    return updates.length;
  }, [rawData, updateMultipleRows]);

  const normalizePhones = useCallback(() => {
    const updates: { rowIndex: number; field: string; value: string }[] = [];

    rawData.forEach((row) => {
      const phone = row.phone;
      if (typeof phone === "string" && phone.trim()) {
        const normalized = normalizePhone(phone);
        if (normalized && normalized !== phone) {
          updates.push({
            rowIndex: row._rowIndex,
            field: "phone",
            value: normalized,
          });
        }
      }
    });

    if (updates.length > 0) {
      updateMultipleRows(updates);
    }

    return updates.length;
  }, [rawData, updateMultipleRows]);

  const setDefaultPriority = useCallback(() => {
    const updates: { rowIndex: number; field: string; value: string }[] = [];

    rawData.forEach((row) => {
      const priority = row.priority;
      if (!priority || priority.trim() === "") {
        updates.push({
          rowIndex: row._rowIndex,
          field: "priority",
          value: "LOW",
        });
      }
    });

    if (updates.length > 0) {
      updateMultipleRows(updates);
    }

    return updates.length;
  }, [rawData, updateMultipleRows]);

  const fixAll = useCallback(() => {
    const trimmed = trimWhitespace();
    const titled = titleCaseNames();
    const normalized = normalizePhones();
    const defaulted = setDefaultPriority();

    return trimmed + titled + normalized + defaulted;
  }, [trimWhitespace, titleCaseNames, normalizePhones, setDefaultPriority]);

  const actions = [
    {
      label: "Trim Whitespace",
      description: "Remove leading/trailing spaces",
      icon: (
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
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      ),
      onClick: () => {
        const count = trimWhitespace();
        alert(`Fixed ${count} cell(s)`);
      },
    },
    {
      label: "Title Case Names",
      description: "Capitalize names properly",
      icon: (
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
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
      ),
      onClick: () => {
        const count = titleCaseNames();
        alert(`Fixed ${count} name(s)`);
      },
    },
    {
      label: "Normalize Phones",
      description: "Convert to E.164 format",
      icon: (
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
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      ),
      onClick: () => {
        const count = normalizePhones();
        alert(`Normalized ${count} phone number(s)`);
      },
    },
    {
      label: "Set Default Priority",
      description: "Set empty priority to LOW",
      icon: (
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
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      ),
      onClick: () => {
        const count = setDefaultPriority();
        alert(`Set default for ${count} row(s)`);
      },
    },
  ];

  return (
    <div className="bg-background border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Quick Fix Actions</h3>
          <p className="text-sm text-muted">
            Apply bulk fixes to clean up your data
          </p>
        </div>
        <button onClick={fixAll} className="btn btn-primary">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
          Fix All Issues
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:bg-muted-light hover:border-primary transition-colors text-center group"
          >
            <div className="w-10 h-10 rounded-full bg-muted-light group-hover:bg-primary-light flex items-center justify-center mb-2 text-muted group-hover:text-primary transition-colors">
              {action.icon}
            </div>
            <span className="text-sm font-medium text-foreground">
              {action.label}
            </span>
            <span className="text-xs text-muted">{action.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
