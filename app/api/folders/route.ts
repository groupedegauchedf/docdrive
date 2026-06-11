import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createFolderSchema } from "@/lib/validations";
import { recordAudit } from "@/lib/audit";

// GET /api/folders
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");

  const folders = await prisma.folder.findMany({
    where: { parentId: parentId ?? null },
    include: {
      _count: { select: { documents: true, children: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(folders);
}

// POST /api/folders
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createFolderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    // Vérifier l'unicité du nom dans le parent
    const existing = await prisma.folder.findFirst({
      where: { name: parsed.data.name, parentId: parsed.data.parentId ?? null },
    });
    if (existing) {
      return NextResponse.json({ error: "Un dossier avec ce nom existe déjà ici" }, { status: 409 });
    }

    const folder = await prisma.folder.create({
      data: {
        name: parsed.data.name,
        parentId: parsed.data.parentId ?? null,
        createdById: session.user.id,
      },
    });

    await recordAudit({
      userId: session.user.id,
      action: "FOLDER_CREATE",
      resourceType: "folder",
      resourceId: folder.id,
      metadata: { name: folder.name },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (err) {
    console.error("[POST /api/folders]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
