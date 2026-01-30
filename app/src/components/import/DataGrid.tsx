"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useImportStore, CSVRow } from "@/state/store";
import { ValidationError } from "@/lib/validations";

interface DataGridProps {
  onCellEdit?: (rowIndex: number, field: string, value: string) => void;
}

export default function DataGrid({ onCellEdit }: DataGridProps) {
  const { rawData, validationErrors, updateRow } = useImportStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: string;
  } | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  // Create error lookup map for quick access
  const errorMap = useMemo(() => {
    const map = new Map<string, ValidationError[]>();
    validationErrors.forEach((error) => {
      const key = `${error.row}-${error.field}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(error);
    });
    return map;
  }, [validationErrors]);

  const getCellErrors = useCallback(
    (rowIndex: number, field: string): ValidationError[] => {
      return errorMap.get(`${rowIndex}-${field}`) || [];
    },
    [errorMap]
  );

  const handleCellChange = useCallback(
    (rowIndex: number, field: string, value: string) => {
      updateRow(rowIndex, field, value);
      if (onCellEdit) {
        onCellEdit(rowIndex, field, value);
      }
    },
    [updateRow, onCellEdit]
  );

  // Define columns
  const columns = useMemo<ColumnDef<CSVRow>[]>(
    () => [
      {
        accessorKey: "_rowIndex",
        header: "#",
        size: 60,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted text-xs">{row.original._rowIndex + 1}</span>
        ),
      },
      {
        accessorKey: "case_id",
        header: "Case ID",
        size: 120,
        cell: ({ row }) => {
          const field = "case_id";
          const value = row.original[field] as string;
          const errors = getCellErrors(row.original._rowIndex, field);
          const isEditing =
            editingCell?.row === row.original._rowIndex &&
            editingCell?.col === field;

          return (
            <EditableCell
              value={value}
              errors={errors}
              isEditing={isEditing}
              onStartEdit={() =>
                setEditingCell({ row: row.original._rowIndex, col: field })
              }
              onEndEdit={() => setEditingCell(null)}
              onChange={(v) => handleCellChange(row.original._rowIndex, field, v)}
            />
          );
        },
      },
      {
        accessorKey: "applicant_name",
        header: "Applicant Name",
        size: 180,
        cell: ({ row }) => {
          const field = "applicant_name";
          const value = row.original[field] as string;
          const errors = getCellErrors(row.original._rowIndex, field);
          const isEditing =
            editingCell?.row === row.original._rowIndex &&
            editingCell?.col === field;

          return (
            <EditableCell
              value={value}
              errors={errors}
              isEditing={isEditing}
              onStartEdit={() =>
                setEditingCell({ row: row.original._rowIndex, col: field })
              }
              onEndEdit={() => setEditingCell(null)}
              onChange={(v) => handleCellChange(row.original._rowIndex, field, v)}
            />
          );
        },
      },
      {
        accessorKey: "dob",
        header: "Date of Birth",
        size: 130,
        cell: ({ row }) => {
          const field = "dob";
          const value = row.original[field] as string;
          const errors = getCellErrors(row.original._rowIndex, field);
          const isEditing =
            editingCell?.row === row.original._rowIndex &&
            editingCell?.col === field;

          return (
            <EditableCell
              value={value}
              errors={errors}
              isEditing={isEditing}
              onStartEdit={() =>
                setEditingCell({ row: row.original._rowIndex, col: field })
              }
              onEndEdit={() => setEditingCell(null)}
              onChange={(v) => handleCellChange(row.original._rowIndex, field, v)}
            />
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 200,
        cell: ({ row }) => {
          const field = "email";
          const value = row.original[field] as string;
          const errors = getCellErrors(row.original._rowIndex, field);
          const isEditing =
            editingCell?.row === row.original._rowIndex &&
            editingCell?.col === field;

          return (
            <EditableCell
              value={value}
              errors={errors}
              isEditing={isEditing}
              onStartEdit={() =>
                setEditingCell({ row: row.original._rowIndex, col: field })
              }
              onEndEdit={() => setEditingCell(null)}
              onChange={(v) => handleCellChange(row.original._rowIndex, field, v)}
            />
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Phone",
        size: 150,
        cell: ({ row }) => {
          const field = "phone";
          const value = row.original[field] as string;
          const errors = getCellErrors(row.original._rowIndex, field);
          const isEditing =
            editingCell?.row === row.original._rowIndex &&
            editingCell?.col === field;

          return (
            <EditableCell
              value={value}
              errors={errors}
              isEditing={isEditing}
              onStartEdit={() =>
                setEditingCell({ row: row.original._rowIndex, col: field })
              }
              onEndEdit={() => setEditingCell(null)}
              onChange={(v) => handleCellChange(row.original._rowIndex, field, v)}
            />
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        size: 120,
        cell: ({ row }) => {
          const field = "category";
          const value = row.original[field] as string;
          const errors = getCellErrors(row.original._rowIndex, field);
          const isEditing =
            editingCell?.row === row.original._rowIndex &&
            editingCell?.col === field;

          return (
            <SelectCell
              value={value}
              options={["TAX", "LICENSE", "PERMIT"]}
              errors={errors}
              isEditing={isEditing}
              onStartEdit={() =>
                setEditingCell({ row: row.original._rowIndex, col: field })
              }
              onEndEdit={() => setEditingCell(null)}
              onChange={(v) => handleCellChange(row.original._rowIndex, field, v)}
            />
          );
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        size: 100,
        cell: ({ row }) => {
          const field = "priority";
          const value = row.original[field] as string;
          const errors = getCellErrors(row.original._rowIndex, field);
          const isEditing =
            editingCell?.row === row.original._rowIndex &&
            editingCell?.col === field;

          return (
            <SelectCell
              value={value || "LOW"}
              options={["LOW", "MEDIUM", "HIGH"]}
              errors={errors}
              isEditing={isEditing}
              onStartEdit={() =>
                setEditingCell({ row: row.original._rowIndex, col: field })
              }
              onEndEdit={() => setEditingCell(null)}
              onChange={(v) => handleCellChange(row.original._rowIndex, field, v)}
            />
          );
        },
      },
    ],
    [getCellErrors, editingCell, handleCellChange]
  );

  const table = useReactTable({
    data: rawData,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  if (rawData.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <svg
          className="w-12 h-12 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
        <p>No data to display</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {/* Stats bar */}
      <div className="px-4 py-2 bg-muted-light border-b border-border flex items-center justify-between text-sm">
        <span className="text-muted">
          {rows.length.toLocaleString()} rows
        </span>
        {validationErrors.length > 0 && (
          <span className="text-error font-medium">
            {validationErrors.length} validation error
            {validationErrors.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Grid */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: "calc(100vh - 400px)", minHeight: "400px" }}
      >
        <table className="w-full border-collapse" role="grid" aria-rowcount={rows.length}>
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} role="row">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="grid-cell grid-header text-left"
                    style={{ width: header.getSize() }}
                    role="columnheader"
                    aria-sort={
                      header.column.getIsSorted()
                        ? header.column.getIsSorted() === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                    scope="col"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : ""
                          }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: " ↑",
                          desc: " ↓",
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className="hover:bg-muted-light/50 transition-colors"
                  role="row"
                  aria-rowindex={virtualRow.index + 2}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="grid-cell"
                      style={{ width: cell.column.getSize() }}
                      role="gridcell"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Editable cell component
interface EditableCellProps {
  value: string;
  errors: ValidationError[];
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onChange: (value: string) => void;
}

function EditableCell({
  value,
  errors,
  isEditing,
  onStartEdit,
  onEndEdit,
  onChange,
}: EditableCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasError = errors.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onChange(localValue);
      onEndEdit();
    } else if (e.key === "Escape") {
      setLocalValue(value);
      onEndEdit();
    }
  };

  const handleBlur = () => {
    onChange(localValue);
    onEndEdit();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary ${hasError ? "border-error bg-error-light" : "border-border"
          }`}
        autoFocus
      />
    );
  }

  return (
    <div
      className={`group relative cursor-text px-2 py-1 rounded ${hasError ? "bg-error-light text-error" : ""
        }`}
      onClick={onStartEdit}
      onKeyDown={(e) => e.key === "Enter" && onStartEdit()}
      tabIndex={0}
      role="button"
      aria-label={`Edit ${value || "empty cell"}`}
    >
      <span className="truncate block">{value || <span className="text-muted">—</span>}</span>
      {hasError && (
        <div className="absolute left-0 bottom-full mb-1 px-2 py-1 bg-error text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
          {errors[0].message}
        </div>
      )}
    </div>
  );
}

// Select cell component
interface SelectCellProps {
  value: string;
  options: string[];
  errors: ValidationError[];
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onChange: (value: string) => void;
}

function SelectCell({
  value,
  options,
  errors,
  isEditing,
  onStartEdit,
  onEndEdit,
  onChange,
}: SelectCellProps) {
  const hasError = errors.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
    onEndEdit();
  };

  if (isEditing) {
    return (
      <select
        value={value}
        onChange={handleChange}
        onBlur={onEndEdit}
        className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary ${hasError ? "border-error bg-error-light" : "border-border"
          }`}
        autoFocus
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  const colorMap: Record<string, string> = {
    TAX: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    LICENSE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    PERMIT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    LOW: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div
      className={`group relative cursor-pointer ${hasError ? "bg-error-light" : ""}`}
      onClick={onStartEdit}
      onKeyDown={(e) => e.key === "Enter" && onStartEdit()}
      tabIndex={0}
      role="button"
      aria-label={`Select ${value || "value"}`}
    >
      {value ? (
        <span
          className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${colorMap[value] || ""}`}
        >
          {value}
        </span>
      ) : (
        <span className="text-muted px-2 py-1">—</span>
      )}
      {hasError && (
        <div className="absolute left-0 bottom-full mb-1 px-2 py-1 bg-error text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
          {errors[0].message}
        </div>
      )}
    </div>
  );
}
