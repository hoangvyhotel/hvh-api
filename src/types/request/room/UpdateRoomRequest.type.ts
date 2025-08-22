export interface UpdateRoomRequest {
  floor?: number;
  originalPrice?: number;
  afterHoursPrice?: number;
  dayPrice?: number;
  nightPrice?: number;
  description?: string;
  typeHire?: number;
  status?: boolean;
  hotelId?: string;
}
