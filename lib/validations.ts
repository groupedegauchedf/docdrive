import { z } from "zod";
import { Role } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const createUserSchema = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  name: z.string().min(2, "Nom trop court").max(100),
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial"),
  role: z.nativeEnum(Role),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Minimum 8 caractères")
    .regex(/[A-Z]/, "Au moins une majuscule")
    .regex(/[0-9]/, "Au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial"),
});

export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Nom requis")
    .max(100)
    .regex(/^[^/\\:*?"<>|]+$/, "Caractères non autorisés dans le nom"),
  parentId: z.string().uuid().optional().nullable(),
});

export const uploadDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  folderId: z.string().uuid().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
