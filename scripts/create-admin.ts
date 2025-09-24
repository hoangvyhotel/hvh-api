import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
    });

    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.userName);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        userName: "admin",
        email: "admin@hotel.com",
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        // Admin không cần hotelId ban đầu
      },
    });

    console.log("✅ Admin user created successfully:");
    console.log("Username:", adminUser.userName);
    console.log("Email:", adminUser.email);
    console.log("Password: admin123");
    console.log("Role:", adminUser.role);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createAdminUser();
}

export { createAdminUser };
