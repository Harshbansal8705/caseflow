import { create } from "zustand";
import { ValidationError } from "@/lib/validations";

// Types for CSV data
export interface CSVRow {
  _rowIndex: number;
  case_id: string;
  applicant_name: string;
  dob: string;
  email: string;
  phone: string;
  category: string;
  priority: string;
  [key: string]: string | number;
}

export interface ColumnMapping {
  csvColumn: string;
  schemaField: string;
}

export interface ImportProgress {
  total: number;
  processed: number;
  success: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
}

export interface BatchResult {
  success: boolean;
  caseId: string;
  error?: string;
  id?: string;
}

// Import Store
interface ImportState {
  // CSV Data
  rawData: CSVRow[];
  headers: string[];
  columnMappings: ColumnMapping[];
  filename: string | null;

  // Validation
  validationErrors: ValidationError[];
  isValidating: boolean;

  // Import progress
  importId: string | null;
  progress: ImportProgress | null;
  batchResults: BatchResult[];
  isSubmitting: boolean;

  // Actions
  setRawData: (data: CSVRow[], headers: string[], filename: string) => void;
  setColumnMappings: (mappings: ColumnMapping[]) => void;
  updateRow: (rowIndex: number, field: string, value: string) => void;
  updateMultipleRows: (
    updates: { rowIndex: number; field: string; value: string }[]
  ) => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  setIsValidating: (isValidating: boolean) => void;
  setImportId: (id: string) => void;
  setProgress: (progress: ImportProgress | null) => void;
  addBatchResults: (results: BatchResult[]) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  clearImport: () => void;
}

export const useImportStore = create<ImportState>((set) => ({
  // Initial state
  rawData: [],
  headers: [],
  columnMappings: [],
  filename: null,
  validationErrors: [],
  isValidating: false,
  importId: null,
  progress: null,
  batchResults: [],
  isSubmitting: false,

  // Actions
  setRawData: (data, headers, filename) =>
    set({
      rawData: data.map((row, index) => ({ ...row, _rowIndex: index })),
      headers,
      filename,
      validationErrors: [],
      batchResults: [],
      progress: null,
    }),

  setColumnMappings: (mappings) => set({ columnMappings: mappings }),

  updateRow: (rowIndex, field, value) =>
    set((state) => ({
      rawData: state.rawData.map((row) =>
        row._rowIndex === rowIndex ? { ...row, [field]: value } : row
      ),
    })),

  updateMultipleRows: (updates) =>
    set((state) => {
      const newData = [...state.rawData];
      for (const update of updates) {
        const index = newData.findIndex(
          (row) => row._rowIndex === update.rowIndex
        );
        if (index !== -1) {
          newData[index] = { ...newData[index], [update.field]: update.value };
        }
      }
      return { rawData: newData };
    }),

  setValidationErrors: (errors) => set({ validationErrors: errors }),
  setIsValidating: (isValidating) => set({ isValidating }),
  setImportId: (id) => set({ importId: id }),
  setProgress: (progress) => set({ progress }),
  addBatchResults: (results) =>
    set((state) => ({ batchResults: [...state.batchResults, ...results] })),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  clearImport: () =>
    set({
      rawData: [],
      headers: [],
      columnMappings: [],
      filename: null,
      validationErrors: [],
      isValidating: false,
      importId: null,
      progress: null,
      batchResults: [],
      isSubmitting: false,
    }),
}));

// Auth store type
interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
}));
