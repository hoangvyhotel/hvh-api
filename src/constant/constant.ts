export const VALID_STATUSES = [
  "ACT",
  "INA",
  "ACTG",
  "PND",
  "BAN",
  "DEL",
  "EXP",
  "REV",
] as const;
export type CodeStatus = (typeof VALID_STATUSES)[number];
export const TYPE_BOOKINGS = {
  HOUR: "HOUR",
  NIGHT: "NIGHT",
  DAY: "DAY",
} as const;

export type TypeBooking = keyof typeof TYPE_BOOKINGS;
