export type UserRole = "militer" | "asn";

export type User = {
  id?: string | number; // Added to support backend ID
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

export type LatLng = {
  latitude: number;
  longitude: number;
  timestamp?: number;
};

export type RunSession = {
  id: string;
  date: string; // ISO string
  distanceKm: number;
  durationSec: number;
  route?: LatLng[];
};
