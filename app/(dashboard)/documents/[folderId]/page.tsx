import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { FileBrowser } from "@/components/documents/file-browser";

interface FolderPageProps {
  params: { folderId: string };
}

async function buildBreadcrumb(folderId: string): Promise<{ id: string; name: string }[]> {
  const crumbs: { id: string; name: string }[] = [];
  let current: { id: string; name: string; parentId: string | null } | null =
    await prisma.folder.findUnique({
      where: { id: folderId },
      select: { id: true, name: true, parentId: true },
    });

  while (current) {
    crumbs.unshift({ id: current.id, name: current.name });
    if (current.parentId) {
      current = await prisma.folder.findUnique({
        where: { id: current.parentId },
        select: { id: true, name: true, parentId: true },
      });
    } else {
      break;
    }
  }
  return crumbs;
}

export default async function FolderPage({ params }: FolderPageProps) {
  const session = await auth();
  if (!session?.user) return null;

  const folder = await prisma.folder.findUnique({
    where: { id: params.folderId },
  });

  if (!folder) notFound();

  const [subFolders, documents, breadcrumb] = await Promise.all([
    prisma.folder.findMany({
      where: { parentId: params.folderId },
      include: {
        _count: { select: { documents: true, children: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.document.findMany({
      where: { folderId: params.folderId },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    buildBreadcrumb(params.folderId),
  ]);

  return (
    <FileBrowser
      folders={subFolders as any}
      documents={documents as any}
      currentFolderId={params.folderId}
      breadcrumb={breadcrumb}
      userRole={session.user.role}
      userId={session.user.id}
    />
  );
}
