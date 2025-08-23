export interface UpdatePrice {
  roomId: string;
  newPrice: number;
}

export interface UpdateRangePrice {
  data: UpdatePrice[];
  typePrice: "hours" | "day" | "night";
}


