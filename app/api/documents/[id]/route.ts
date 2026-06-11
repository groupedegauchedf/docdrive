import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { recordAudit } from "@/lib/audit";

// GET /api/documents/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const document = await prisma.document.findUnique({
    where: { id: params.id },
    include: { uploadedBy: { select: { name: true } }, folder: { select: { name: true } } },
  });

  if (!document) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  return NextResponse.json(document);
}

// DELETE /api/documents/[id] — admin uniquement
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const document = await prisma.document.findUnique({ where: { id: params.id } });
  if (!document) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  try {
    await deleteFile(document.storageKey);
    await prisma.document.delete({ where: { id: params.id } });

    await recordAudit({
      userId: session.user.id,
      action: "DOCUMENT_DELETE",
      resourceType: "document",
      resourceId: params.id,
      metadata: { name: document.name },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/documents/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
