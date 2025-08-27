export interface CreateBillRequest {
  totalRoomPrice: number;
  totalUtilitiesPrice: number;
  roomId: string;
  // optional createdAt to allow backdating in tests or imports
  createdAt?: string | Date;
}
