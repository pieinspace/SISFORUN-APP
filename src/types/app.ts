export type UserRole = "pns" | "nonpns";

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
  paceMinPerKm: number;
};
