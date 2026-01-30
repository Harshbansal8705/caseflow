import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getStats(userId: string) {
  const [totalCases, pendingCases, completedCases, totalImports] =
    await Promise.all([
      prisma.case.count({ where: { createdById: userId } }),
      prisma.case.count({ where: { createdById: userId, status: "PENDING" } }),
      prisma.case.count({
        where: { createdById: userId, status: "COMPLETED" },
      }),
      prisma.import.count({ where: { userId } }),
    ]);

  return { totalCases, pendingCases, completedCases, totalImports };
}

interface RecentCase {
  id: string;
  caseId: string;
  applicantName: string;
  status: string;
  category: string;
  createdAt: Date;
}

interface RecentImport {
  id: string;
  filename: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  status: string;
  createdAt: Date;
}

async function getRecentCases(userId: string): Promise<RecentCase[]> {
  return prisma.case.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      caseId: true,
      applicantName: true,
      status: true,
      category: true,
      createdAt: true,
    },
  });
}

async function getRecentImports(userId: string): Promise<RecentImport[]> {
  return prisma.import.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      filename: true,
      totalRows: true,
      successCount: true,
      failureCount: true,
      status: true,
      createdAt: true,
    },
  });
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const [stats, recentCases, recentImports] = await Promise.all([
    getStats(userId),
    getRecentCases(userId),
    getRecentImports(userId),
  ]);

  const statCards = [
    {
      title: "Total Cases",
      value: stats.totalCases,
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      color: "primary",
    },
    {
      title: "Pending",
      value: stats.pendingCases,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "warning",
    },
    {
      title: "Completed",
      value: stats.completedCases,
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      color: "success",
    },
    {
      title: "Imports",
      value: stats.totalImports,
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      color: "primary",
    },
  ];

  const statusColors: Record<string, string> = {
    PENDING: "badge-warning",
    IN_PROGRESS: "badge-primary",
    COMPLETED: "badge-success",
    REJECTED: "badge-error",
    PROCESSING: "badge-primary",
    FAILED: "badge-error",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted mt-1">
            Welcome back, {session?.user?.name || "User"}
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
          New Import
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="card">
            <div className="card-body flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color === "primary"
                  ? "bg-primary-light text-primary"
                  : stat.color === "success"
                    ? "bg-success-light text-success"
                    : "bg-warning-light text-warning"
                  }`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-muted">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Cases</h2>
            <Link
              href="/cases"
              className="text-sm text-primary hover:text-primary-hover"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentCases.length === 0 ? (
              <div className="p-6 text-center text-muted">
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
                <p>No cases yet</p>
                <Link href="/import" className="text-primary text-sm mt-2 inline-block">
                  Import your first CSV
                </Link>
              </div>
            ) : (
              recentCases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  href={`/cases/${caseItem.id}`}
                  className="block px-6 py-4 hover:bg-muted-light transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {caseItem.caseId}
                      </p>
                      <p className="text-sm text-muted">
                        {caseItem.applicantName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${statusColors[caseItem.status]}`}>
                        {caseItem.status}
                      </span>
                      <p className="text-xs text-muted mt-1">
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Imports */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Imports</h2>
            <Link
              href="/imports"
              className="text-sm text-primary hover:text-primary-hover"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentImports.length === 0 ? (
              <div className="p-6 text-center text-muted">
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p>No imports yet</p>
                <Link href="/import" className="text-primary text-sm mt-2 inline-block">
                  Start your first import
                </Link>
              </div>
            ) : (
              recentImports.map((importItem) => (
                <Link
                  key={importItem.id}
                  href={`/imports/${importItem.id}`}
                  className="block px-6 py-4 hover:bg-muted-light transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {importItem.filename}
                      </p>
                      <p className="text-sm text-muted">
                        {importItem.successCount} succeeded,{" "}
                        {importItem.failureCount} failed
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${statusColors[importItem.status]}`}>
                        {importItem.status}
                      </span>
                      <p className="text-xs text-muted mt-1">
                        {new Date(importItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
