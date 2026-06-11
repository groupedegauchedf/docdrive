"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderOpen, FileText, Upload, FolderPlus, Trash2,
  Download, ChevronRight, Home, Search, MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UploadDialog } from "@/components/documents/upload-dialog";
import { FolderCreateDialog } from "@/components/documents/folder-create-dialog";
import { formatBytes, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@prisma/client";

interface FolderItem {
  id: string;
  name: string;
  createdAt: string;
  createdBy: { name: string };
  _count: { documents: number; children: number };
}

interface DocumentItem {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  uploadedBy: { name: string };
}

interface FileBrowserProps {
  folders: FolderItem[];
  documents: DocumentItem[];
  currentFolderId: string | null;
  breadcrumb: { id: string; name: string }[];
  userRole: Role;
  userId: string;
}

export function FileBrowser({
  folders,
  documents,
  currentFolderId,
  breadcrumb,
  userRole,
}: FileBrowserProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const isAdmin = userRole === "ADMIN";

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredDocs = documents.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = async (docId: string, docName: string) => {
    setLoading(docId);
    try {
      const res = await fetch(`/api/documents/${docId}/download`);
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = docName;
      a.click();
    } catch {
      toast({ title: "Erreur", description: "Impossible de télécharger le fichier.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (docId: string, docName: string) => {
    if (!confirm(`Supprimer définitivement "${docName}" ?`)) return;
    setLoading(docId);
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Supprimé", description: `"${docName}" a été supprimé.`, variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer le fichier.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Supprimer le dossier "${folderName}" et tout son contenu ?`)) return;
    setLoading(folderId);
    try {
      const res = await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Supprimé", description: `Dossier "${folderName}" supprimé.`, variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer le dossier.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-3 gap-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm min-w-0">
          <Link href="/documents" className="flex items-center gap-1 text-gray-500 hover:text-gray-900 shrink-0">
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumb.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              <Link
                href={`/documents/${crumb.id}`}
                className="truncate max-w-[120px] text-gray-500 hover:text-gray-900"
              >
                {crumb.name}
              </Link>
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher…"
              className="w-48 pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setFolderOpen(true)}>
            <FolderPlus className="h-4 w-4" />
            Nouveau dossier
          </Button>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            Téléverser
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredFolders.length === 0 && filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="mb-4 h-12 w-12 text-gray-200" />
            <p className="text-sm text-gray-500">
              {search ? "Aucun résultat pour cette recherche." : "Ce dossier est vide."}
            </p>
          </div>
        ) : (
          <>
            {/* Dossiers */}
            {filteredFolders.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Dossiers ({filteredFolders.length})
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="group relative flex items-center gap-3 rounded-lg border bg-white p-3 transition-shadow hover:shadow-sm"
                    >
                      <Link
                        href={`/documents/${folder.id}`}
                        className="flex flex-1 items-center gap-3 min-w-0"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                          <FolderOpen className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{folder.name}</p>
                          <p className="text-xs text-gray-400">
                            {folder._count.documents} doc{folder._count.documents !== 1 ? "s" : ""}
                            {folder._count.children > 0 ? ` · ${folder._count.children} sous-dossier${folder._count.children !== 1 ? "s" : ""}` : ""}
                          </p>
                        </div>
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteFolder(folder.id, folder.name)}
                          disabled={loading === folder.id}
                          className="shrink-0 rounded p-1 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Documents */}
            {filteredDocs.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Documents ({filteredDocs.length})
                </h2>
                <div className="overflow-hidden rounded-lg border bg-white">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Nom</th>
                        <th className="hidden px-4 py-3 text-left font-medium text-gray-500 md:table-cell">Ajouté par</th>
                        <th className="hidden px-4 py-3 text-left font-medium text-gray-500 sm:table-cell">Taille</th>
                        <th className="hidden px-4 py-3 text-left font-medium text-gray-500 lg:table-cell">Date</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredDocs.map((doc) => (
                        <tr key={doc.id} className="group hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-red-50">
                                <FileText className="h-4 w-4 text-red-400" />
                              </div>
                              <span className="font-medium text-gray-900 line-clamp-1">{doc.name}</span>
                              <Badge variant="outline" className="text-xs hidden xl:inline-flex">PDF</Badge>
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{doc.uploadedBy.name}</td>
                          <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{formatBytes(doc.size)}</td>
                          <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{formatDate(doc.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDownload(doc.id, doc.name)}
                                disabled={loading === doc.id}
                                title="Télécharger"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleDelete(doc.id, doc.name)}
                                  disabled={loading === doc.id}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        currentFolderId={currentFolderId}
        onSuccess={() => { setUploadOpen(false); router.refresh(); }}
      />
      <FolderCreateDialog
        open={folderOpen}
        onClose={() => setFolderOpen(false)}
        parentFolderId={currentFolderId}
        onSuccess={() => { setFolderOpen(false); router.refresh(); }}
      />
    </div>
  );
}
