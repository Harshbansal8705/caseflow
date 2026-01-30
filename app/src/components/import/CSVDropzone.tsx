"use client";

import { useCallback, useState } from "react";
import { useImportStore, CSVRow } from "@/state/store";
import Papa from "papaparse";

interface CSVDropzoneProps {
  onUploadComplete?: () => void;
}

export default function CSVDropzone({ onUploadComplete }: CSVDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { setRawData } = useImportStore();

  const parseFile = useCallback(
    (file: File) => {
      setIsLoading(true);
      setProgress(0);
      setError(null);

      // Validate file type
      if (!file.name.endsWith(".csv")) {
        setError("Please upload a CSV file");
        setIsLoading(false);
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB");
        setIsLoading(false);
        return;
      }

      const results: Record<string, string>[] = [];
      let headers: string[] = [];
      let rowCount = 0;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        chunk: (chunk) => {
          if (headers.length === 0 && chunk.meta.fields) {
            headers = chunk.meta.fields;
          }
          results.push(...(chunk.data as Record<string, string>[]));
          rowCount += chunk.data.length;

          // Update progress (estimate based on 50k rows max)
          const estimatedProgress = Math.min((rowCount / 50000) * 100, 95);
          setProgress(estimatedProgress);
        },
        complete: () => {
          setProgress(100);

          // Convert to CSVRow format
          const csvRows: CSVRow[] = results.map((row, index) => ({
            _rowIndex: index,
            case_id: row.case_id || row.caseId || "",
            applicant_name: row.applicant_name || row.applicantName || "",
            dob: row.dob || row.dateOfBirth || "",
            email: row.email || "",
            phone: row.phone || row.phoneNumber || "",
            category: row.category || "",
            priority: row.priority || "",
            ...row,
          }));

          setRawData(csvRows, headers, file.name);
          setIsLoading(false);

          if (onUploadComplete) {
            onUploadComplete();
          }
        },
        error: (parseError) => {
          setError(`Failed to parse CSV: ${parseError.message}`);
          setIsLoading(false);
        },
      });
    },
    [setRawData, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        parseFile(file);
      }
    },
    [parseFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        parseFile(file);
      }
    },
    [parseFile]
  );

  return (
    <div className="w-full">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`dropzone cursor-pointer ${isDragging ? "dropzone-active" : ""}`}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="sr-only"
          aria-label="Upload CSV file"
        />

        {isLoading ? (
          <div className="text-center w-full max-w-md">
            <svg
              className="w-12 h-12 mx-auto text-primary animate-spin mb-4"
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
            <p className="text-foreground font-medium mb-2">
              Parsing CSV file...
            </p>
            <div className="progress mb-2">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted">{Math.round(progress)}% complete</p>
          </div>
        ) : (
          <>
            <svg
              className={`w-16 h-16 mb-4 transition-colors ${isDragging ? "text-primary" : "text-muted"
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg font-medium text-foreground mb-1">
              {isDragging ? "Drop your file here" : "Drag & drop your CSV file"}
            </p>
            <p className="text-sm text-muted mb-4">or click to browse</p>
            <span className="btn btn-secondary btn-sm">Select File</span>
          </>
        )}
      </label>

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-error-light text-error flex items-center gap-3">
          <svg
            className="w-5 h-5 shrink-0"
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
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-muted text-center mt-4">
        Supports CSV files up to 50MB with up to 50,000 rows
      </p>
    </div>
  );
}
