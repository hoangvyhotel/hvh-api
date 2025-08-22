export const VALID_STATUSES = ['ACT', 'INA', 'ACTG', 'PND', 'BAN', 'DEL', 'EXP', 'REV'] as const;
export type CodeStatus = typeof VALID_STATUSES[number];