"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Pencil, Trash2, KeyRound, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface UsersTableProps {
  users: UserRow[];
}

type ModalMode = "create" | "edit" | "reset-password" | null;

export function UsersTable({ users: initialUsers }: UsersTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);

  // Formulaire
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<Role>("USER");

  const openCreate = () => {
    setFormName(""); setFormEmail(""); setFormPassword(""); setFormRole("USER");
    setModal("create");
  };

  const openEdit = (user: UserRow) => {
    setSelectedUser(user);
    setFormName(user.name); setFormEmail(user.email); setFormRole(user.role);
    setModal("edit");
  };

  const openReset = (user: UserRow) => {
    setSelectedUser(user);
    setFormPassword("");
    setModal("reset-password");
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, password: formPassword, role: formRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Utilisateur créé", variant: "success" });
      setModal(null);
      router.refresh();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, role: formRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Utilisateur modifié", variant: "success" });
      setModal(null);
      router.refresh();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Mot de passe réinitialisé", variant: "success" });
      setModal(null);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleToggleActive = async (user: UserRow) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error();
      toast({ title: user.isActive ? "Compte désactivé" : "Compte activé", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleDelete = async (user: UserRow) => {
    if (!confirm(`Supprimer définitivement ${user.name} ?`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Utilisateur supprimé", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <UserPlus className="h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Utilisateur</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Rôle</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Statut</th>
              <th className="hidden px-4 py-3 text-left font-medium text-gray-500 lg:table-cell">Dernière connexion</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {user.role === "ADMIN" ? (
                    <Badge className="gap-1"><ShieldCheck className="h-3 w-3" />Admin</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><User className="h-3 w-3" />Utilisateur</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.isActive ? "success" : "outline"}>
                    {user.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 text-gray-500 text-xs lg:table-cell">
                  {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Jamais"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)} title="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openReset(user)} title="Réinitialiser mdp">
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDelete(user)} title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Créer / Modifier */}
      <Dialog open={modal === "create" || modal === "edit"} onOpenChange={() => setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{modal === "create" ? "Nouvel utilisateur" : "Modifier l'utilisateur"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nom complet</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Marie Dupont" />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse e-mail</Label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="marie@exemple.fr" />
            </div>
            {modal === "create" && (
              <div className="space-y-1.5">
                <Label>Mot de passe</Label>
                <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Minimum 8 car., majuscule, chiffre, spécial" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as Role)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="USER">Utilisateur</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)} disabled={loading}>Annuler</Button>
            <Button onClick={modal === "create" ? handleCreate : handleEdit} disabled={loading}>
              {modal === "create" ? "Créer" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Réinitialiser mot de passe */}
      <Dialog open={modal === "reset-password"} onOpenChange={() => setModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm text-gray-500">Pour : <strong>{selectedUser?.name}</strong></p>
            <div className="space-y-1.5">
              <Label>Nouveau mot de passe</Label>
              <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)} disabled={loading}>Annuler</Button>
            <Button onClick={handleResetPassword} disabled={loading || formPassword.length < 8}>Réinitialiser</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
