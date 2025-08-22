export type GetAllExpensesRequest = {
  id: string; // Hotel ID
  date: string; // Optional date filter in ISO format
};

export type ExpenseBody = {
  date: string; // Date of the expense in ISO format
  amount: number; // Amount of the expense
  reason: string; // Reason for the expense
  note?: string; // Optional note for the expense
  hotelId: string; // Hotel ID associated with the expense
};

export type ExpenseCreateRequest = ExpenseBody;
export type ExpenseUpdateRequest = Omit<ExpenseBody, "hotelId">;
