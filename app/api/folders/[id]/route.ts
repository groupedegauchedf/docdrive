import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { recordAudit } from "@/lib/audit";

// DELETE /api/folders/[id] — admin uniquement, suppression récursive
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const folder = await prisma.folder.findUnique({ where: { id: params.id } });
  if (!folder) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  try {
    // Supprimer tous les fichiers du dossier et sous-dossiers
    await deleteDocumentsRecursive(params.id);

    // Supprimer le dossier (cascade via Prisma)
    await prisma.folder.delete({ where: { id: params.id } });

    await recordAudit({
      userId: session.user.id,
      action: "FOLDER_DELETE",
      resourceType: "folder",
      resourceId: params.id,
      metadata: { name: folder.name },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/folders/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function deleteDocumentsRecursive(folderId: string): Promise<void> {
  const docs = await prisma.document.findMany({ where: { folderId } });
  for (const doc of docs) {
    try { await deleteFile(doc.storageKey); } catch {}
  }
  await prisma.document.deleteMany({ where: { folderId } });

  const subFolders = await prisma.folder.findMany({ where: { parentId: folderId } });
  for (const sub of subFolders) {
    await deleteDocumentsRecursive(sub.id);
  }
}
