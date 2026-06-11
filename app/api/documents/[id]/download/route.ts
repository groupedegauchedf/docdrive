import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl } from "@/lib/storage";
import { recordAudit } from "@/lib/audit";

// GET /api/documents/[id]/download — retourne une URL signée temporaire
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const document = await prisma.document.findUnique({ where: { id: params.id } });
  if (!document) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const url = await getDownloadUrl(document.storageKey);

  await recordAudit({
    userId: session.user.id,
    action: "DOCUMENT_DOWNLOAD",
    resourceType: "document",
    resourceId: params.id,
    metadata: { name: document.name },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ url });
}
