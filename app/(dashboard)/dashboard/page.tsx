import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBytes, formatDate } from "@/lib/utils";
import { FileText, FolderOpen, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

async function getDashboardData(userId: string, role: string) {
  const [totalDocs, totalFolders, recentDocs, totalUsers] = await Promise.all([
    prisma.document.count(),
    prisma.folder.count(),
    prisma.document.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { name: true } }, folder: { select: { name: true } } },
    }),
    role === "ADMIN" ? prisma.user.count({ where: { isActive: true } }) : null,
  ]);

  return { totalDocs, totalFolders, recentDocs, totalUsers };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { totalDocs, totalFolders, recentDocs, totalUsers } = await getDashboardData(
    session.user.id,
    session.user.role
  );

  const stats = [
    { label: "Documents", value: totalDocs, icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Dossiers", value: totalFolders, icon: FolderOpen, color: "text-amber-600 bg-amber-50" },
    ...(totalUsers !== null
      ? [{ label: "Utilisateurs actifs", value: totalUsers, icon: Users, color: "text-green-600 bg-green-50" }]
      : []),
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {session.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Voici un aperçu de votre espace documentaire.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Documents récents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Documents récents</CardTitle>
          <Link
            href="/documents"
            className="text-sm text-primary hover:underline"
          >
            Voir tout
          </Link>
        </CardHeader>
        <CardContent>
          {recentDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">Aucun document pour le moment.</p>
              <Link href="/documents" className="mt-2 text-sm text-primary hover:underline">
                Ajouter un document
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded bg-red-50">
                      <FileText className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{doc.name}</p>
                      <p className="text-xs text-gray-400">
                        {doc.folder?.name ?? "Racine"} · {formatBytes(doc.size)} · {doc.uploadedBy.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    {formatDate(doc.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
