import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // First, create default hotel if not exists
    let defaultHotel = await prisma.hotel.findFirst({
      where: { id: 1 },
    });

    if (!defaultHotel) {
      defaultHotel = await prisma.hotel.create({
        data: {
          name: "Default Hotel",
        },
      });
      console.log("✅ Default hotel created:", defaultHotel.name);
    }

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
      },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists:", existingAdmin.username);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        username: "admin",
        password: hashedPassword,
        passwordManage: hashedPassword, // Copy password for passwordManage field
        role: "ADMIN",
        hotelId: defaultHotel.id,
      },
    });

    console.log("✅ Admin user created successfully:");
    console.log("Username:", adminUser.username);
    console.log("Password: admin123");
    console.log("Role:", adminUser.role);
    console.log("Hotel ID:", adminUser.hotelId);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
}

export { createAdminUser };
