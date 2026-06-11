import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, generateStorageKey, validatePdfBuffer, validateFileSize } from "@/lib/storage";
import { recordAudit } from "@/lib/audit";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB ?? "50") * 1024 * 1024;

// GET /api/documents — liste avec filtre optionnel
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");
  const search = searchParams.get("q");

  const documents = await prisma.document.findMany({
    where: {
      ...(folderId !== "null" && folderId ? { folderId } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    include: { uploadedBy: { select: { name: true } }, folder: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

// POST /api/documents — upload
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const folderId = formData.get("folderId") as string | null;

    if (!file || !name?.trim()) {
      return NextResponse.json({ error: "Fichier et nom requis" }, { status: 400 });
    }

    // Validation type MIME déclaré
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 });
    }

    // Validation taille
    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        { error: `Taille maximale dépassée (${process.env.MAX_FILE_SIZE_MB ?? 50} MB)` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validation magic bytes (anti-spoofing)
    if (!validatePdfBuffer(buffer)) {
      return NextResponse.json({ error: "Le fichier n'est pas un PDF valide" }, { status: 400 });
    }

    // Valider que le dossier existe si fourni
    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    const storageKey = generateStorageKey(file.name);
    await uploadFile(storageKey, buffer, "application/pdf");

    const document = await prisma.document.create({
      data: {
        name: name.trim(),
        storageKey,
        size: file.size,
        mimeType: "application/pdf",
        folderId: folderId || null,
        uploadedById: session.user.id,
      },
    });

    await recordAudit({
      userId: session.user.id,
      action: "DOCUMENT_UPLOAD",
      resourceType: "document",
      resourceId: document.id,
      metadata: { name: document.name, size: document.size },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (err) {
    console.error("[POST /api/documents]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
