import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUserSchema, resetPasswordSchema } from "@/lib/validations";
import { hash } from "bcryptjs";
import { recordAudit } from "@/lib/audit";

// PATCH /api/users/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  try {
    const body = await req.json();

    // Réinitialisation de mot de passe
    if (body.password !== undefined) {
      const parsed = resetPasswordSchema.safeParse({ password: body.password });
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
      }
      const passwordHash = await hash(parsed.data.password, 12);
      await prisma.user.update({ where: { id: params.id }, data: { passwordHash } });
      await recordAudit({
        userId: session.user.id,
        action: "PASSWORD_RESET",
        resourceType: "user",
        resourceId: params.id,
      });
      return NextResponse.json({ success: true });
    }

    // Mise à jour générale
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    await recordAudit({
      userId: session.user.id,
      action: "USER_UPDATE",
      resourceType: "user",
      resourceId: params.id,
      metadata: parsed.data as Record<string, unknown>,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/users/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/users/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Ne pas s'auto-supprimer
  if (params.id === session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous supprimer vous-même" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  await prisma.user.delete({ where: { id: params.id } });

  await recordAudit({
    userId: session.user.id,
    action: "USER_DELETE",
    resourceType: "user",
    resourceId: params.id,
    metadata: { email: target.email },
  });

  return NextResponse.json({ success: true });
}
