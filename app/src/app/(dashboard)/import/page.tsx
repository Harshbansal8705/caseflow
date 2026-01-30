"use client";

import { useState, useEffect, useCallback } from "react";
import { useImportStore } from "@/state/store";
import {
  CaseSchema,
  ValidationError,
  CategoryEnum,
  PriorityEnum,
} from "@/lib/validations";
import CSVDropzone from "@/components/import/CSVDropzone";
import DataGrid from "@/components/import/DataGrid";
import FixAllToolbar from "@/components/import/FixAllToolbar";
import ValidationPanel from "@/components/import/ValidationPanel";
import BatchSubmit from "@/components/import/BatchSubmit";

type Step = "upload" | "review" | "submit";

export default function ImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const { rawData, setValidationErrors, clearImport, filename } =
    useImportStore();

  // Validate data when it changes
  const validateData = useCallback(() => {
    const errors: ValidationError[] = [];

    // Check for duplicate case IDs
    const seenIds = new Map<string, number>();

    rawData.forEach((row, index) => {
      // Duplicate check
      const caseId = row.case_id;
      if (caseId) {
        if (seenIds.has(caseId)) {
          errors.push({
            row: index,
            field: "case_id",
            value: caseId,
            message: `Duplicate case ID (first seen at row ${seenIds.get(caseId)! + 1})`,
          });
        } else {
          seenIds.set(caseId, index);
        }
      }

      // Validate each field
      const result = CaseSchema.safeParse({
        caseId: row.case_id,
        applicantName: row.applicant_name,
        dob: row.dob,
        email: row.email || undefined,
        phone: row.phone || undefined,
        category: row.category,
        priority: row.priority || undefined,
      });

      if (!result.success) {
        result.error.issues.forEach((err) => {
          const field = err.path[0] as string;
          const mappedField =
            {
              caseId: "case_id",
              applicantName: "applicant_name",
            }[field] || field;

          errors.push({
            row: index,
            field: mappedField,
            value: row[mappedField] as string,
            message: err.message,
          });
        });
      }

      // Additional validation for category
      if (row.category && !CategoryEnum.safeParse(row.category).success) {
        errors.push({
          row: index,
          field: "category",
          value: row.category,
          message: "Category must be TAX, LICENSE, or PERMIT",
        });
      }

      // Additional validation for priority
      if (row.priority && !PriorityEnum.safeParse(row.priority).success) {
        errors.push({
          row: index,
          field: "priority",
          value: row.priority,
          message: "Priority must be LOW, MEDIUM, or HIGH",
        });
      }
    });

    setValidationErrors(errors);
  }, [rawData, setValidationErrors]);

  useEffect(() => {
    if (rawData.length > 0) {
      validateData();
    }
  }, [rawData, validateData]);

  const handleUploadComplete = () => {
    setStep("review");
  };

  const handleStartNewImport = () => {
    clearImport();
    setStep("upload");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import CSV</h1>
          <p className="text-muted mt-1">
            Upload, validate, and submit cases from a CSV file
          </p>
        </div>
        {step !== "upload" && (
          <button onClick={handleStartNewImport} className="btn btn-secondary">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Start New Import
          </button>
        )}
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-4">
        {(["upload", "review", "submit"] as Step[]).map((s, index) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s
                ? "bg-primary text-white"
                : index <
                  (["upload", "review", "submit"] as Step[]).indexOf(step)
                  ? "bg-success text-white"
                  : "bg-muted-light text-muted"
                }`}
            >
              {index <
                (["upload", "review", "submit"] as Step[]).indexOf(step) ? (
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
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`text-sm font-medium capitalize ${step === s ? "text-primary" : "text-muted"
                }`}
            >
              {s}
            </span>
            {index < 2 && (
              <div className="w-12 h-0.5 bg-muted-light mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === "upload" && (
        <div className="card">
          <div className="card-body">
            <CSVDropzone onUploadComplete={handleUploadComplete} />
          </div>
        </div>
      )}

      {step === "review" && rawData.length > 0 && (
        <div className="space-y-6">
          {/* File info */}
          <div className="card">
            <div className="card-body flex items-center justify-between">
              <div className="flex items-center gap-3">
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
                  <p className="font-medium text-foreground">{filename}</p>
                  <p className="text-sm text-muted">
                    {rawData.length.toLocaleString()} rows loaded
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep("submit")}
                className="btn btn-primary"
              >
                Continue to Submit
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
              </button>
            </div>
          </div>

          {/* Validation panel */}
          <ValidationPanel />

          {/* Fix all toolbar */}
          <FixAllToolbar />

          {/* Data grid */}
          <DataGrid />
        </div>
      )}

      {step === "submit" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Summary */}
            <div className="card mb-6">
              <div className="card-header">
                <h2 className="font-semibold text-foreground">Import Summary</h2>
              </div>
              <div className="card-body">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-muted">File</dt>
                    <dd className="font-medium text-foreground">{filename}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Total Rows</dt>
                    <dd className="font-medium text-foreground">
                      {rawData.length.toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => setStep("review")}
              className="btn btn-secondary mb-6"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Review
            </button>
          </div>

          <div>
            <BatchSubmit />
          </div>
        </div>
      )}
    </div>
  );
}
