import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CaseSchema, CaseQuerySchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

// GET /api/cases - List cases with cursor-based pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryResult = CaseQuerySchema.safeParse({
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || undefined,
      status: searchParams.get("status") || undefined,
      category: searchParams.get("category") || undefined,
      priority: searchParams.get("priority") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      search: searchParams.get("search") || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { cursor, limit, status, category, priority, dateFrom, dateTo, search } =
      queryResult.data;

    // Build where clause
    const where: Prisma.CaseWhereInput = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { caseId: { contains: search, mode: "insensitive" } },
        { applicantName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch cases with cursor pagination
    const cases = await prisma.case.findMany({
      where,
      take: limit + 1, // Fetch one extra to check if there's more
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        import: {
          select: { id: true, filename: true },
        },
      },
    });

    // Check if there are more results
    let nextCursor: string | undefined;
    if (cases.length > limit) {
      const nextItem = cases.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({
      cases,
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (error) {
    console.error("Get cases error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/cases - Create a single case
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = CaseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { caseId, applicantName, dob, email, phone, category, priority } =
      result.data;

    // Check for duplicate caseId
    const existing = await prisma.case.findUnique({
      where: { caseId },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Case with ID ${caseId} already exists` },
        { status: 409 }
      );
    }

    // Create case
    const newCase = await prisma.case.create({
      data: {
        caseId,
        applicantName,
        dob: new Date(dob),
        email: email || null,
        phone,
        category,
        priority: priority || "LOW",
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create history entry
    await prisma.caseHistory.create({
      data: {
        caseId: newCase.id,
        action: "CREATED",
        changes: { created: true },
        userId: session.user.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CASE_CREATED",
        entityType: "Case",
        entityId: newCase.id,
        userId: session.user.id,
        metadata: { caseId: newCase.caseId },
      },
    });

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (error) {
    console.error("Create case error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
