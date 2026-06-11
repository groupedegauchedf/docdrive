"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatBytes } from "@/lib/utils";

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  currentFolderId: string | null;
  onSuccess: () => void;
}

export function UploadDialog({ open, onClose, currentFolderId, onSuccess }: UploadDialogProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Format invalide", description: "Seuls les fichiers PDF sont acceptés.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setDisplayName(file.name.replace(/\.pdf$/i, ""));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !displayName.trim()) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", displayName.trim());
      if (currentFolderId) formData.append("folderId", currentFolderId);

      const res = await fetch("/api/documents", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'upload");

      toast({ title: "Téléversé", description: `"${displayName}" a été ajouté avec succès.`, variant: "success" });
      handleClose();
      onSuccess();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDisplayName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Téléverser un document PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Zone de dépôt */}
          {!selectedFile ? (
            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
                dragOver ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mb-3 h-8 w-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Glissez votre PDF ici ou <span className="text-primary">parcourir</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">PDF uniquement · Max {process.env.NEXT_PUBLIC_MAX_MB ?? "50"} MB</p>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-red-50">
                <FileText className="h-5 w-5 text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-700">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(selectedFile.size)}</p>
              </div>
              <button
                onClick={() => { setSelectedFile(null); setDisplayName(""); }}
                className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Nom d'affichage */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-name">Nom du document</Label>
            <Input
              id="doc-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Programme électoral 2028"
              disabled={!selectedFile}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || !displayName.trim() || uploading}
          >
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi…</> : <><Upload className="h-4 w-4" />Téléverser</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
