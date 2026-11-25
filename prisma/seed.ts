import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const rooms = [
  { code: "R101", name: "Raum 101", building: "Hauptgebäude" },
  { code: "R204", name: "Raum 204", building: "Hauptgebäude" },
  { code: "INFO1", name: "Informatikraum 1", building: "Naturwissenschaften" },
  { code: "AULA", name: "Aula", building: "Hauptgebäude" },
  { code: "BIB", name: "Bibliothek", building: "Nebengebäude" },
];

async function main() {
  for (const room of rooms) {
    await prisma.room.upsert({
      where: { code: room.code },
      update: {
        name: room.name,
        building: room.building,
      },
      create: room,
    });
  }
  console.log("Seeded 5 rooms.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
