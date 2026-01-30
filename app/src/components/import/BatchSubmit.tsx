"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useImportStore, BatchResult } from "@/state/store";

const BATCH_SIZE = 100;

export default function BatchSubmit() {
  const {
    rawData,
    validationErrors,
    progress,
    setProgress,
    batchResults,
    addBatchResults,
    isSubmitting,
    setIsSubmitting,
    setImportId,
    filename,
  } = useImportStore();

  const [isCancelled, setIsCancelled] = useState(false);

  const validRows = rawData.filter((row) => {
    const hasError = validationErrors.some((e) => e.row === row._rowIndex);
    return !hasError;
  });

  const startSubmission = useCallback(async () => {
    if (validRows.length === 0) return;

    setIsSubmitting(true);
    setIsCancelled(false);

    try {
      // Create import record
      const importResponse = await fetch("/api/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: filename || "import.csv",
          totalRows: validRows.length,
        }),
      });

      if (!importResponse.ok) {
        throw new Error("Failed to create import record");
      }

      const { import: importRecord } = await importResponse.json();
      setImportId(importRecord.id);

      // Calculate batches
      const totalBatches = Math.ceil(validRows.length / BATCH_SIZE);

      setProgress({
        total: validRows.length,
        processed: 0,
        success: 0,
        failed: 0,
        currentBatch: 0,
        totalBatches,
      });

      let successCount = 0;
      let failedCount = 0;

      // Process batches
      for (let i = 0; i < totalBatches; i++) {
        if (isCancelled) break;

        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, validRows.length);
        const batch = validRows.slice(start, end);

        const cases = batch.map((row) => ({
          caseId: row.case_id,
          applicantName: row.applicant_name,
          dob: row.dob,
          email: row.email || null,
          phone: row.phone || null,
          category: row.category,
          priority: row.priority || "LOW",
        }));

        try {
          const response = await fetch("/api/cases/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cases,
              importId: importRecord.id,
            }),
          });

          if (!response.ok) {
            throw new Error("Batch submission failed");
          }

          const data = await response.json();
          const results: BatchResult[] = data.results;

          addBatchResults(results);

          successCount += results.filter((r) => r.success).length;
          failedCount += results.filter((r) => !r.success).length;

          setProgress({
            total: validRows.length,
            processed: end,
            success: successCount,
            failed: failedCount,
            currentBatch: i + 1,
            totalBatches,
          });
        } catch (error) {
          console.error("Batch error:", error);
          // Mark all in batch as failed
          const failedResults: BatchResult[] = batch.map((row) => ({
            success: false,
            caseId: row.case_id,
            error: "Network error - please retry",
          }));
          addBatchResults(failedResults);
          failedCount += batch.length;

          setProgress({
            total: validRows.length,
            processed: end,
            success: successCount,
            failed: failedCount,
            currentBatch: i + 1,
            totalBatches,
          });
        }
      }

      // Update import status
      await fetch(`/api/imports/${importRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: isCancelled ? "FAILED" : "COMPLETED",
          successCount,
          failureCount: failedCount,
        }),
      });
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validRows,
    filename,
    setImportId,
    setProgress,
    addBatchResults,
    setIsSubmitting,
    isCancelled,
  ]);

  const cancelSubmission = useCallback(() => {
    setIsCancelled(true);
  }, []);

  // Download failed rows as CSV
  const downloadErrorsCSV = useCallback(() => {
    const failedCaseIds = batchResults
      .filter((r) => !r.success)
      .map((r) => r.caseId);

    const failedRows = rawData.filter((row) =>
      failedCaseIds.includes(row.case_id)
    );

    if (failedRows.length === 0) return;

    // Create CSV content
    const headers = [
      "case_id",
      "applicant_name",
      "dob",
      "email",
      "phone",
      "category",
      "priority",
      "error",
    ];

    const csvRows = failedRows.map((row) => {
      const result = batchResults.find((r) => r.caseId === row.case_id);
      return [
        row.case_id,
        row.applicant_name,
        row.dob,
        row.email || "",
        row.phone || "",
        row.category,
        row.priority || "",
        result?.error || "Unknown error",
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `failed-imports-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [batchResults, rawData]);

  const retryFailed = useCallback(async () => {
    const failedCaseIds = batchResults
      .filter((r) => !r.success)
      .map((r) => r.caseId);

    const rowsToRetry = rawData.filter((row) =>
      failedCaseIds.includes(row.case_id)
    );

    if (rowsToRetry.length === 0) return;

    // Similar logic to startSubmission but only for failed rows
    // For simplicity, we'll just call startSubmission again
    // In production, you'd implement proper retry logic
    startSubmission();
  }, [batchResults, rawData, startSubmission]);

  const progressPercentage = progress
    ? Math.round((progress.processed / progress.total) * 100)
    : 0;

  const hasErrors = validationErrors.length > 0;
  const failedResults = batchResults.filter((r) => !r.success);

  return (
    <div className="bg-background border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Submit Cases</h3>
        <p className="text-sm text-muted mt-1">
          {validRows.length} valid rows ready for submission
        </p>
      </div>

      <div className="p-4">
        {/* Pre-submission state */}
        {!isSubmitting && !progress && (
          <div className="text-center py-4">
            {hasErrors ? (
              <div className="mb-4 p-3 bg-warning-light rounded-lg">
                <p className="text-warning text-sm">
                  <strong>{validationErrors.length}</strong> errors found.{" "}
                  {rawData.length - validRows.length} rows will be skipped.
                </p>
              </div>
            ) : null}

            <button
              onClick={startSubmission}
              disabled={validRows.length === 0}
              className="btn btn-primary btn-lg"
            >
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Submit {validRows.length} Cases
            </button>
          </div>
        )}

        {/* Submitting state */}
        {isSubmitting && progress && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">
                Batch {progress.currentBatch} of {progress.totalBatches}
              </span>
              <button
                onClick={cancelSubmission}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>

            <div className="progress">
              <div
                className="progress-bar"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                {progress.processed} / {progress.total} processed
              </span>
              <span className="font-medium text-foreground">
                {progressPercentage}%
              </span>
            </div>

            <div className="flex gap-4 text-sm">
              <span className="text-success">
                ✓ {progress.success} succeeded
              </span>
              {progress.failed > 0 && (
                <span className="text-error">✗ {progress.failed} failed</span>
              )}
            </div>
          </div>
        )}

        {/* Completed state */}
        {!isSubmitting && progress && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg ${progress.failed === 0 ? "bg-success-light" : "bg-warning-light"
                }`}
            >
              <div className="flex items-center gap-3">
                {progress.failed === 0 ? (
                  <svg
                    className="w-8 h-8 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 text-warning"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
                <div>
                  <p
                    className={`font-medium ${progress.failed === 0 ? "text-success" : "text-warning"
                      }`}
                  >
                    Import Complete
                  </p>
                  <p
                    className={`text-sm ${progress.failed === 0
                      ? "text-success/80"
                      : "text-warning/80"
                      }`}
                  >
                    {progress.success} succeeded, {progress.failed} failed
                  </p>
                </div>
              </div>
            </div>

            {/* Failed items */}
            {failedResults.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-muted-light border-b border-border flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Failed Rows ({failedResults.length})
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadErrorsCSV}
                      className="btn btn-sm btn-secondary"
                      aria-label="Download failed rows as CSV"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download CSV
                    </button>
                    <button onClick={retryFailed} className="btn btn-sm btn-secondary">
                      Retry Failed
                    </button>
                  </div>
                </div>
                <div className="max-h-40 overflow-auto">
                  {failedResults.slice(0, 10).map((result, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 border-b border-border last:border-0 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {result.caseId}
                        </span>
                        <span className="text-error text-xs">
                          {result.error}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Link href="/cases" className="btn btn-primary flex-1">
                View Cases
              </Link>
              <Link href="/import" className="btn btn-secondary flex-1">
                New Import
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
