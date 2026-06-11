import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ACTION_LABELS: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "success" | "outline" }> = {
  LOGIN: { label: "Connexion", variant: "success" },
  LOGOUT: { label: "Déconnexion", variant: "secondary" },
  LOGIN_FAILED: { label: "Échec connexion", variant: "destructive" },
  DOCUMENT_UPLOAD: { label: "Upload", variant: "default" },
  DOCUMENT_DOWNLOAD: { label: "Téléchargement", variant: "default" },
  DOCUMENT_DELETE: { label: "Suppression doc", variant: "destructive" },
  FOLDER_CREATE: { label: "Dossier créé", variant: "default" },
  FOLDER_DELETE: { label: "Dossier supprimé", variant: "destructive" },
  USER_CREATE: { label: "Utilisateur créé", variant: "default" },
  USER_UPDATE: { label: "Utilisateur modifié", variant: "secondary" },
  USER_DELETE: { label: "Utilisateur supprimé", variant: "destructive" },
  PASSWORD_RESET: { label: "Réinit. mdp", variant: "secondary" },
};

export default async function AuditPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.auditLog.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Journal d'audit</h1>
        <p className="mt-1 text-sm text-gray-500">200 dernières entrées</p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Utilisateur</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
              <th className="hidden px-4 py-3 text-left font-medium text-gray-500 md:table-cell">IP</th>
              <th className="hidden px-4 py-3 text-left font-medium text-gray-500 lg:table-cell">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => {
              const action = ACTION_LABELS[log.action] ?? { label: log.action, variant: "outline" as const };
              return (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500 text-xs">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {log.user ? (
                      <div>
                        <p className="font-medium text-gray-900">{log.user.name}</p>
                        <p className="text-xs text-gray-400">{log.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={action.variant}>{action.label}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 text-xs md:table-cell">
                    {log.ipAddress ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 text-xs lg:table-cell">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
