import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CaseNoteSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

// POST /api/cases/[id]/notes - Add a note to a case
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const result = CaseNoteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Check if case exists
    const caseData = await prisma.case.findUnique({
      where: { id },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Create note
    const note = await prisma.caseNote.create({
      data: {
        caseId: id,
        content: result.data.content,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create history entry
    await prisma.caseHistory.create({
      data: {
        caseId: id,
        action: "NOTE_ADDED",
        changes: { noteId: note.id },
        userId: session.user.id,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Add note error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
