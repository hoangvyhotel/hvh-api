import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lấy user theo username
export async function getUserByUserName(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  });
  console.log("User fetched by username:", user);
  return user;
}

// Đăng ký user kèm hotel
export const registerUserWithHotel = async (
  username: string,
  hashedPassword: string,
  hashedPasswordManage: string,
  hotelName: string
) => {
  try {
    // transaction để đảm bảo hotel + user được tạo cùng lúc
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const savedHotel = await tx.hotel.create({
        data: { name: hotelName },
      });

      const savedUser = await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          passwordManage: hashedPasswordManage,
          role: "STAFF",
          hotelId: savedHotel.id, // Prisma tự sinh id
        },
      });

      return { savedUser, savedHotel };
    });

    return result;
  } catch (error) {
    throw error;
  }
};

// Lấy user theo username (phiên bản khác)
export const getUserByUsername = async (username: string) => {
  return prisma.user.findUnique({
    where: { username },
  });
};

// Đổi mật khẩu user
export const modifyPasswordUser = async (userId: string, newPassword: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      password: newPassword,
      updatedAt: new Date(),
    },
  });
};

// Đổi mật khẩu quản lý
export const modifyPasswordManage = async (
  userId: string,
  newPasswordManage: string
) => {
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordManage: newPasswordManage,
      updatedAt: new Date(),
    },
  });
};
