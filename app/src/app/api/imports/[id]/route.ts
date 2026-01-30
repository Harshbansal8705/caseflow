import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET /api/imports/[id] - Get import details with stats
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const importRecord = await prisma.import.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        cases: {
          select: {
            id: true,
            caseId: true,
            applicantName: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        },
        _count: {
          select: { cases: true },
        },
      },
    });

    if (!importRecord) {
      return NextResponse.json({ error: "Import not found" }, { status: 404 });
    }

    // Check access - only allow access to own imports or admin
    if (
      importRecord.userId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ import: importRecord });
  } catch (error) {
    console.error("Get import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/imports/[id] - Update import status (complete/fail)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const importRecord = await prisma.import.findUnique({
      where: { id },
    });

    if (!importRecord) {
      return NextResponse.json({ error: "Import not found" }, { status: 404 });
    }

    // Check access
    if (importRecord.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedImport = await prisma.import.update({
      where: { id },
      data: {
        status: body.status,
        errorDetails: body.errorDetails || undefined,
        successCount: body.successCount ?? importRecord.successCount,
        failureCount: body.failureCount ?? importRecord.failureCount,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: `IMPORT_${body.status}`,
        entityType: "Import",
        entityId: id,
        userId: session.user.id,
        metadata: {
          successCount: updatedImport.successCount,
          failureCount: updatedImport.failureCount,
        },
      },
    });

    return NextResponse.json({ import: updatedImport });
  } catch (error) {
    console.error("Update import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
