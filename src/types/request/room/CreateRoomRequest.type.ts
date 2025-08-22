export interface CreateRoomRequest {
  floor: number;
  originalPrice: number;
  afterHoursPrice: number;
  dayPrice: number;
  nightPrice: number;
  description: string;
  typeHire: number; // Assuming this is an enum or a specific set of values
  hotelId: string; // Reference to the Hotel model, should be a valid ObjectId string
  status: boolean; // true for available, false for not available
}
