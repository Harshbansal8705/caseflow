import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BatchCaseSchema, CaseSchema } from "@/lib/validations";

interface BatchResult {
  success: boolean;
  caseId: string;
  error?: string;
  id?: string;
}

// POST /api/cases/batch - Batch create cases
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = BatchCaseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { cases, importId } = result.data;
    const results: BatchResult[] = [];
    const createdCaseIds: string[] = [];

    // Process each case
    for (const caseData of cases) {
      try {
        // Validate individual case
        const caseResult = CaseSchema.safeParse(caseData);
        if (!caseResult.success) {
          results.push({
            success: false,
            caseId: caseData.caseId,
            error: caseResult.error.issues.map((e) => e.message).join(", "),
          });
          continue;
        }

        const { caseId, applicantName, dob, email, phone, category, priority } =
          caseResult.data;

        // Check for duplicate caseId
        const existing = await prisma.case.findUnique({
          where: { caseId },
        });

        if (existing) {
          results.push({
            success: false,
            caseId,
            error: `Case with ID ${caseId} already exists`,
          });
          continue;
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
            importId: importId || null,
          },
        });

        // Create history entry
        await prisma.caseHistory.create({
          data: {
            caseId: newCase.id,
            action: "CREATED",
            changes: { created: true, batchImport: true },
            userId: session.user.id,
          },
        });

        results.push({
          success: true,
          caseId,
          id: newCase.id,
        });
        createdCaseIds.push(newCase.id);
      } catch (error) {
        results.push({
          success: false,
          caseId: caseData.caseId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    // Update import record if importId provided
    if (importId) {
      await prisma.import.update({
        where: { id: importId },
        data: {
          successCount: { increment: successCount },
          failureCount: { increment: failureCount },
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "BATCH_IMPORT",
        entityType: "Case",
        entityId: importId || "direct-batch",
        userId: session.user.id,
        metadata: {
          total: cases.length,
          successCount,
          failureCount,
          createdCaseIds,
        },
      },
    });

    return NextResponse.json({
      results,
      summary: {
        total: cases.length,
        success: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error("Batch create error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
