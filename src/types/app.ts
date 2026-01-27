export type UserRole = "militer" | "asn";

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

export type RunSession = {
  id: string;
  date: string; // ISO string
  distanceKm: number;
  durationSec: number;
};
