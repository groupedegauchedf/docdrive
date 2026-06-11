import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface AuditParams {
  userId?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function recordAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        resourceType: params.resourceType ?? null,
        resourceId: params.resourceId ?? null,
        metadata: params.metadata ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch {
    // Ne jamais faire échouer une opération métier à cause d'un échec de journalisation
    console.error("[AuditLog] Échec de journalisation:", params.action);
  }
}
