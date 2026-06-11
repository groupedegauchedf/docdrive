import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin
  const adminHash = await hash("Admin@2028!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@docdrive.fr" },
    update: {},
    create: {
      email: "admin@docdrive.fr",
      passwordHash: adminHash,
      name: "Administrateur",
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // Utilisateur de test
  const userHash = await hash("User@2028!", 12);
  await prisma.user.upsert({
    where: { email: "utilisateur@docdrive.fr" },
    update: {},
    create: {
      email: "utilisateur@docdrive.fr",
      passwordHash: userHash,
      name: "Utilisateur Test",
      role: Role.USER,
      isActive: true,
    },
  });

  // Dossiers de démonstration
  const rootFolder = await prisma.folder.create({
    data: {
      name: "Documents électoraux",
      createdById: admin.id,
    },
  });

  await prisma.folder.createMany({
    data: [
      { name: "Programmes", createdById: admin.id, parentId: rootFolder.id },
      { name: "Réunions", createdById: admin.id, parentId: rootFolder.id },
      { name: "Tracts", createdById: admin.id, parentId: rootFolder.id },
      { name: "Juridique", createdById: admin.id },
    ],
  });

  console.log("✅ Seed terminé.");
  console.log("   Admin:        admin@docdrive.fr  /  Admin@2028!");
  console.log("   Utilisateur:  utilisateur@docdrive.fr  /  User@2028!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
