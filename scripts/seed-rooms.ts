import mongoose from "mongoose";
import { RoomModel } from "../src/models/Room";
import { config } from "dotenv";

// Load environment variables
config();

// Sample hotel IDs (you need to replace these with actual hotel IDs from your database)
// To get hotel IDs, run this query in MongoDB:
// db.hotels.find({}, {_id: 1, name: 1})
// Or use MongoDB Compass to browse the hotels collection
const SAMPLE_HOTEL_IDS = [
  "60d5ecb54b24c2001f6479a1", // Replace with actual hotel ID
  "60d5ecb54b24c2001f6479a2", // Replace with actual hotel ID
];

// If you don't have hotels yet, create some first:
/*
db.hotels.insertMany([
  {
    name: "Grand Hotel",
    username: "grandhotel",
    password: "password123",
    passwordManage: "manage123",
    role: "hotel_manager"
  },
  {
    name: "City Hotel",
    username: "cityhotel", 
    password: "password123",
    passwordManage: "manage123",
    role: "hotel_manager"
  }
])
*/

const sampleRooms = [
  // Hotel 1 - Rooms
  {
    floor: 1,
    originalPrice: 500000,
    afterHoursPrice: 600000,
    dayPrice: 450000,
    nightPrice: 550000,
    description: "Phòng đơn tầng 1, view thành phố",
    typeHire: 1, // 1: hourly, 2: daily, 3: overnight
    status: true,
    hotelId: SAMPLE_HOTEL_IDS[0],
  },
  {
    floor: 1,
    originalPrice: 800000,
    afterHoursPrice: 900000,
    dayPrice: 750000,
    nightPrice: 850000,
    description: "Phòng đôi tầng 1, view vườn",
    typeHire: 2,
    status: true,
    hotelId: SAMPLE_HOTEL_IDS[0],
  },
  {
    floor: 2,
    originalPrice: 1200000,
    afterHoursPrice: 1400000,
    dayPrice: 1100000,
    nightPrice: 1300000,
    description: "Phòng VIP tầng 2, view biển",
    typeHire: 3,
    status: true,
    hotelId: SAMPLE_HOTEL_IDS[0],
  },
  {
    floor: 2,
    originalPrice: 600000,
    afterHoursPrice: 700000,
    dayPrice: 550000,
    nightPrice: 650000,
    description: "Phòng đơn tầng 2, view thành phố",
    typeHire: 1,
    status: false, // Occupied
    hotelId: SAMPLE_HOTEL_IDS[0],
  },
  {
    floor: 3,
    originalPrice: 1500000,
    afterHoursPrice: 1700000,
    dayPrice: 1400000,
    nightPrice: 1600000,
    description: "Phòng Suite tầng 3, view panorama",
    typeHire: 3,
    status: true,
    hotelId: SAMPLE_HOTEL_IDS[0],
  },

  // Hotel 2 - Rooms
  {
    floor: 1,
    originalPrice: 400000,
    afterHoursPrice: 500000,
    dayPrice: 350000,
    nightPrice: 450000,
    description: "Phòng tiêu chuẩn tầng 1",
    typeHire: 1,
    status: true,
    hotelId: SAMPLE_HOTEL_IDS[1],
  },
  {
    floor: 1,
    originalPrice: 700000,
    afterHoursPrice: 800000,
    dayPrice: 650000,
    nightPrice: 750000,
    description: "Phòng deluxe tầng 1, có ban công",
    typeHire: 2,
    status: true,
    hotelId: SAMPLE_HOTEL_IDS[1],
  },
  {
    floor: 2,
    originalPrice: 1000000,
    afterHoursPrice: 1200000,
    dayPrice: 950000,
    nightPrice: 1100000,
    description: "Phòng superior tầng 2, view núi",
    typeHire: 3,
    status: false, // Occupied
    hotelId: SAMPLE_HOTEL_IDS[1],
  },
  {
    floor: 2,
    originalPrice: 1800000,
    afterHoursPrice: 2000000,
    dayPrice: 1700000,
    nightPrice: 1900000,
    description: "Phòng Presidential Suite tầng 2",
    typeHire: 3,
    status: true,
    hotelId: SAMPLE_HOTEL_IDS[1],
  },
  {
    floor: 3,
    originalPrice: 550000,
    afterHoursPrice: 650000,
    dayPrice: 500000,
    nightPrice: 600000,
    description: "Phòng family tầng 3, 2 giường đôi",
    typeHire: 2,
    status: true,
    hotelId: SAMPLE_HOTEL_IDS[1],
  },
];

async function seedRooms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/hvh-hotel"
    );
    console.log("Connected to MongoDB");

    // Clear existing rooms
    await RoomModel.deleteMany({});
    console.log("Cleared existing rooms");

    // Insert sample rooms
    const insertedRooms = await RoomModel.insertMany(sampleRooms);
    console.log(`Inserted ${insertedRooms.length} sample rooms`);

    // Display inserted rooms
    insertedRooms.forEach((room, index) => {
      console.log(`Room ${index + 1}:`, {
        id: room._id,
        floor: room.floor,
        description: room.description,
        originalPrice: room.originalPrice,
        status: room.status ? "Available" : "Occupied",
        hotelId: room.hotelId,
      });
    });

    console.log("Room seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding rooms:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the seeding function
if (require.main === module) {
  seedRooms();
}

export default seedRooms;
