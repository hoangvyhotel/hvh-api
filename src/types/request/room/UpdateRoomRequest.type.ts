export interface UpdateRoomRequest {
  floor?: number;
  name?: string;
  originalPrice?: number;
  afterHoursPrice?: number;
  dayPrice?: number;
  nightPrice?: number;
  description?: string;
  typeHire?: number;
  status?: boolean;
  hotelId?: string;
}
