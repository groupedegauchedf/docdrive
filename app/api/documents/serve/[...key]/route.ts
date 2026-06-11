import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readLocalFile } from "@/lib/storage";

// GET /api/documents/serve/[...key] — sert les fichiers locaux (dev uniquement)
export async function GET(req: NextRequest, { params }: { params: { key: string[] } }) {
  if (process.env.STORAGE_PROVIDER === "r2") {
    return NextResponse.json({ error: "Non disponible" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const key = params.key.join("/");
  try {
    const buffer = await readLocalFile(`documents/${key}`);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
