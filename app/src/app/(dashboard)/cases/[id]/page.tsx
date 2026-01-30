"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CaseDetails {
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
  updatedAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  import: {
    id: string;
    filename: string;
    createdAt: string;
  } | null;
  history: Array<{
    id: string;
    action: string;
    changes: Record<string, { from: unknown; to: unknown }>;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
}

export default function CaseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    applicantName: "",
    email: "",
    phone: "",
    category: "",
    priority: "",
    status: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const fetchCase = useCallback(async () => {
    try {
      const response = await fetch(`/api/cases/${id}`);
      if (!response.ok) throw new Error("Failed to fetch case");
      const data = await response.json();
      setCaseData(data.case);
      setEditForm({
        applicantName: data.case.applicantName,
        email: data.case.email || "",
        phone: data.case.phone || "",
        category: data.case.category,
        priority: data.case.priority,
        status: data.case.status,
      });
    } catch (error) {
      console.error("Error fetching case:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error("Failed to update case");

      await fetchCase();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating case:", error);
      alert("Failed to update case");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const response = await fetch(`/api/cases/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });

      if (!response.ok) throw new Error("Failed to add note");

      setNewNote("");
      await fetchCase();
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note");
    } finally {
      setIsAddingNote(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton w-64 h-8" />
        <div className="card">
          <div className="card-body space-y-4">
            <div className="skeleton w-full h-6" />
            <div className="skeleton w-3/4 h-6" />
            <div className="skeleton w-1/2 h-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
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
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Case not found
        </h2>
        <p className="text-muted mb-4">
          The case you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/cases" className="btn btn-primary">
          Back to Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {caseData.caseId}
            </h1>
            <p className="text-muted">{caseData.applicantName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${statusColors[caseData.status]}`}>
            {caseData.status.replace("_", " ")}
          </span>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-secondary"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-primary"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case details */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-foreground">Case Details</h2>
            </div>
            <div className="card-body">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Applicant Name
                    </label>
                    <input
                      type="text"
                      value={editForm.applicantName}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          applicantName: e.target.value,
                        }))
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Category
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="input"
                    >
                      <option value="TAX">Tax</option>
                      <option value="LICENSE">License</option>
                      <option value="PERMIT">Permit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Priority
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          priority: e.target.value,
                        }))
                      }
                      className="input"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="input"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </div>
              ) : (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <dt className="text-sm text-muted">Case ID</dt>
                    <dd className="font-medium text-foreground">
                      {caseData.caseId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Applicant Name</dt>
                    <dd className="font-medium text-foreground">
                      {caseData.applicantName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Date of Birth</dt>
                    <dd className="font-medium text-foreground">
                      {new Date(caseData.dob).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Email</dt>
                    <dd className="font-medium text-foreground">
                      {caseData.email || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Phone</dt>
                    <dd className="font-medium text-foreground">
                      {caseData.phone || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Category</dt>
                    <dd>
                      <span className="badge badge-primary">
                        {caseData.category}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Priority</dt>
                    <dd>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${priorityColors[caseData.priority]}`}
                      >
                        {caseData.priority}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Created</dt>
                    <dd className="font-medium text-foreground">
                      {new Date(caseData.createdAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-foreground">Notes</h2>
            </div>
            <div className="card-body">
              {/* Add note form */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  className="input flex-1"
                />
                <button
                  onClick={handleAddNote}
                  disabled={isAddingNote || !newNote.trim()}
                  className="btn btn-primary"
                >
                  {isAddingNote ? "Adding..." : "Add"}
                </button>
              </div>

              {/* Notes list */}
              {caseData.notes.length === 0 ? (
                <p className="text-muted text-center py-4">No notes yet</p>
              ) : (
                <div className="space-y-3">
                  {caseData.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-muted-light rounded-lg"
                    >
                      <p className="text-foreground">{note.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                        <span>{note.user.name || note.user.email}</span>
                        <span>•</span>
                        <span>
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Import info */}
          {caseData.import && (
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold text-foreground">Import Info</h2>
              </div>
              <div className="card-body">
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted">Filename</dt>
                    <dd className="font-medium text-foreground">
                      {caseData.import.filename}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">Imported</dt>
                    <dd className="font-medium text-foreground">
                      {new Date(caseData.import.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* History timeline */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-foreground">History</h2>
            </div>
            <div className="card-body">
              {caseData.history.length === 0 ? (
                <p className="text-muted text-center py-4">No history yet</p>
              ) : (
                <div className="space-y-4">
                  {caseData.history.map((item, index) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-light"
                            }`}
                        />
                        {index < caseData.history.length - 1 && (
                          <div className="w-0.5 flex-1 bg-muted-light" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium text-foreground">
                          {item.action.replace("_", " ")}
                        </p>
                        <p className="text-xs text-muted">
                          {item.user.name || item.user.email} •{" "}
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                        {Object.keys(item.changes).length > 0 &&
                          !item.changes.created && (
                            <div className="mt-1 text-xs text-muted">
                              {Object.entries(item.changes).map(
                                ([field, change]) => (
                                  <p key={field}>
                                    {field}: {String(change.from)} →{" "}
                                    {String(change.to)}
                                  </p>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
