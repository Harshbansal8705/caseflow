import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportCreateSchema } from "@/lib/validations";

// GET /api/imports - List imports for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor") || undefined;

    const imports = await prisma.import.findMany({
      where: { userId: session.user.id },
      take: limit + 1,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { cases: true },
        },
      },
    });

    let nextCursor: string | undefined;
    if (imports.length > limit) {
      const nextItem = imports.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({
      imports,
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error("Get imports error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/imports - Create a new import record
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = ImportCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { filename, totalRows } = result.data;

    const importRecord = await prisma.import.create({
      data: {
        filename,
        totalRows,
        userId: session.user.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "IMPORT_STARTED",
        entityType: "Import",
        entityId: importRecord.id,
        userId: session.user.id,
        metadata: { filename, totalRows },
      },
    });

    return NextResponse.json({ import: importRecord }, { status: 201 });
  } catch (error) {
    console.error("Create import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
