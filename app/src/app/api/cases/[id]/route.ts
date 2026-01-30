import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CaseUpdateSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

// GET /api/cases/[id] - Get case details with history
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        import: {
          select: { id: true, filename: true, createdAt: true },
        },
        history: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json({ case: caseData });
  } catch (error) {
    console.error("Get case error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/cases/[id] - Update case
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const result = CaseUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Get current case
    const currentCase = await prisma.case.findUnique({
      where: { id },
    });

    if (!currentCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Build changes object for history
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(result.data)) {
      if (value !== undefined) {
        const currentValue = currentCase[key as keyof typeof currentCase];
        if (currentValue !== value) {
          changes[key] = { from: currentValue, to: value };
          updateData[key] = key === "dob" ? new Date(value as string) : value;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ case: currentCase, message: "No changes made" });
    }

    // Update case
    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create history entry
    const action = changes.status ? "STATUS_CHANGED" : "UPDATED";
    await prisma.caseHistory.create({
      data: {
        caseId: id,
        action,
        changes: JSON.parse(JSON.stringify(changes)),
        userId: session.user.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: `CASE_${action}`,
        entityType: "Case",
        entityId: id,
        userId: session.user.id,
        metadata: JSON.parse(JSON.stringify({ changes })),
      },
    });

    return NextResponse.json({ case: updatedCase });
  } catch (error) {
    console.error("Update case error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id] - Delete case (Admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const caseData = await prisma.case.findUnique({
      where: { id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Delete case (history and notes will cascade)
    await prisma.case.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CASE_DELETED",
        entityType: "Case",
        entityId: id,
        userId: session.user.id,
        metadata: { caseId: caseData.caseId },
      },
    });

    return NextResponse.json({ message: "Case deleted successfully" });
  } catch (error) {
    console.error("Delete case error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
