import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    const adminUsers = await prisma.users.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log("🔍 Admin users found:");
    console.table(adminUsers);

    const totalUsers = await prisma.users.count();
    console.log(`\n📊 Total users in database: ${totalUsers}`);

    const hotels = await prisma.hotel.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        createdAt: true,
      },
    });

    console.log("\n🏨 Hotels in database:");
    console.table(hotels);
  } catch (error) {
    console.error("❌ Error checking admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
