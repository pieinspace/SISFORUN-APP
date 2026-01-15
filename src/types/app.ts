export type UserRole = "militer" | "pns";

export type User = {
  name: string;
  nrp: string;
  role: UserRole;
};

export type LeaderboardItem = {
  id: string;
  name: string;
  nrp: string;
  distanceKm: number;
  paceMinPerKm: number; // makin kecil makin bagus
};
