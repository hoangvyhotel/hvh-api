export interface UtilityResponse {
  _id: string;
  name: string;
  price: number;
  icon?: string;
  status: boolean;
  hotelId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListUtilitiesResponse {
  items: UtilityResponse[];
  total: number;
  page: number;
  pageSize: number;
}
