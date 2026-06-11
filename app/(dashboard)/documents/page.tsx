import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FileBrowser } from "@/components/documents/file-browser";

async function getRootData() {
  const [folders, documents] = await Promise.all([
    prisma.folder.findMany({
      where: { parentId: null },
      include: {
        _count: { select: { documents: true, children: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.document.findMany({
      where: { folderId: null },
      include: { uploadedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { folders, documents };
}

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { folders, documents } = await getRootData();

  return (
    <FileBrowser
      folders={folders as any}
      documents={documents as any}
      currentFolderId={null}
      breadcrumb={[]}
      userRole={session.user.role}
      userId={session.user.id}
    />
  );
}
