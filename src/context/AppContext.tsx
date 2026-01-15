import React, { createContext, useMemo, useState } from "react";
import { LeaderboardItem, User, UserRole } from "../types/app";

type AppContextValue = {
  isLoggedIn: boolean;
  user: User | null;
  targetKm: number;

  leaderboard: LeaderboardItem[];

  login: (payload: { email: string; password: string; role: UserRole }) => void;
  logout: () => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // dummy user (akan di-set saat login)
  const [user, setUser] = useState<User | null>(null);

  const [leaderboard] = useState<LeaderboardItem[]>([
    { id: "1", name: "Andi Pratama", nrp: "RUN-001", distanceKm: 15.2, paceMinPerKm: 5.1 },
    { id: "2", name: "Budi Santoso", nrp: "RUN-002", distanceKm: 14.8, paceMinPerKm: 5.05 },
    { id: "3", name: "Citra Dewi", nrp: "RUN-003", distanceKm: 14.2, paceMinPerKm: 5.2 },
    { id: "4", name: "Dian Kusuma", nrp: "RUN-004", distanceKm: 13.9, paceMinPerKm: 5.15 },
    { id: "5", name: "Eko Wijaya", nrp: "RUN-005", distanceKm: 13.5, paceMinPerKm: 5.25 },
    { id: "6", name: "Fitri Handayani", nrp: "RUN-006", distanceKm: 13.2, paceMinPerKm: 5.3 },
    { id: "7", name: "Gunawan Putra", nrp: "RUN-007", distanceKm: 12.8, paceMinPerKm: 5.35 },
    { id: "8", name: "Hendra Saputra", nrp: "RUN-008", distanceKm: 12.5, paceMinPerKm: 5.4 },
    { id: "9", name: "Indah Permata", nrp: "RUN-009", distanceKm: 12.1, paceMinPerKm: 5.45 },
    { id: "10", name: "Joko Widodo", nrp: "RUN-010", distanceKm: 11.8, paceMinPerKm: 5.5 },
  ]);

  // urut sesuai SRS: jarak desc, jika sama pace asc
  const sortedLeaderboard = useMemo(() => {
    return [...leaderboard].sort((a, b) => {
      if (b.distanceKm !== a.distanceKm) return b.distanceKm - a.distanceKm;
      return a.paceMinPerKm - b.paceMinPerKm;
    });
  }, [leaderboard]);

  const targetKm = user?.role === "pns" ? 10 : 14; // default 14 kalau belum ada user

  const login: AppContextValue["login"] = ({ email, password, role }) => {
    // dummy validasi: asal tidak kosong
    if (!email.trim() || password.length < 6) {
      throw new Error("Email wajib dan password minimal 6 karakter.");
    }

    setUser({
      name: "admin",
      nrp: "1234567890",
      role,
    });
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  const value = useMemo<AppContextValue>(
    () => ({
      isLoggedIn,
      user,
      targetKm,
      leaderboard: sortedLeaderboard,
      login,
      logout,
    }),
    [isLoggedIn, user, targetKm, sortedLeaderboard]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
