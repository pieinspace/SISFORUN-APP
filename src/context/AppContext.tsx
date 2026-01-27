import React, { createContext, useMemo, useState } from "react";
import { LeaderboardItem, RunSession, User, UserRole } from "../types/app";

type UserStats = {
  totalKm: number;
  totalRuns: number;
  avgPace: number; // min/km
};

type AppContextValue = {
  isLoggedIn: boolean;
  user: User | null;
  targetKm: number;

  leaderboard: LeaderboardItem[];
  runHistory: RunSession[];
  userStats: UserStats;

  login: (payload: { email: string; password: string; role: UserRole }) => void;
  logout: () => void;
  addRunSession: (session: RunSession) => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [runHistory, setRunHistory] = useState<RunSession[]>([]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([
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
    // Extra users to push list beyond 10
    { id: "11", name: "Kartika Sari", nrp: "RUN-011", distanceKm: 10.5, paceMinPerKm: 6.0 },
    { id: "12", name: "Lukman Hakim", nrp: "RUN-012", distanceKm: 9.2, paceMinPerKm: 6.2 },
    { id: "13", name: "Maya Putri", nrp: "RUN-013", distanceKm: 8.5, paceMinPerKm: 6.5 },
  ]);

  const sortedLeaderboard = useMemo(() => {
    return [...leaderboard].sort((a, b) => {
      if (b.distanceKm !== a.distanceKm) return b.distanceKm - a.distanceKm;
      return a.paceMinPerKm - b.paceMinPerKm;
    });
  }, [leaderboard]);

  const targetKm = user?.role === "asn" ? 10 : 14;

  const userStats = useMemo<UserStats>(() => {
    const totalRuns = runHistory.length;
    const totalKm = runHistory.reduce((acc, curr) => acc + curr.distanceKm, 0);
    const totalDurSec = runHistory.reduce((acc, curr) => acc + curr.durationSec, 0);

    // avg pace = total minutes / total km
    let avgPace = 0;
    if (totalKm > 0) {
      avgPace = (totalDurSec / 60) / totalKm;
    }

    return { totalKm, totalRuns, avgPace };
  }, [runHistory]);

  const login: AppContextValue["login"] = ({ email, password, role }) => {
    if (!email.trim() || password.length < 6) {
      throw new Error("Email wajib dan password minimal 6 karakter.");
    }

    const nrpFromEmail = email.split("@")[0] || "00000000";

    const newUser = {
      name: "User", // Can be dynamic if we had name input
      nrp: nrpFromEmail,
      role,
    };

    setUser(newUser);
    setIsLoggedIn(true);

    // Check if user exists in leaderboard
    const exists = leaderboard.find((l) => l.nrp === nrpFromEmail);
    if (!exists) {
      // Add to leaderboard with mock stats
      setLeaderboard((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          name: "User", // Match default name
          nrp: nrpFromEmail,
          distanceKm: 0, // Start from 0
          paceMinPerKm: 0,
        },
      ]);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setRunHistory([]);
  };

  const addRunSession = (session: RunSession) => {
    setRunHistory((prev) => [session, ...prev]);

    // Also update leaderboard for current user
    if (user) {
      setLeaderboard((prev) => {
        return prev.map(p => {
          if (p.nrp === user.nrp) {
            // Update exist user stats
            // Note: simple addition logic for now. 
            // Real logic might need recalculation if leaderboard item stores aggregate.
            // Let's assume leaderboard item IS the aggregate.
            const newDist = p.distanceKm + session.distanceKm;
            // update pace weighted? Or just simplistic for now:
            // Since we don't store total time in leaderboard item, let's just average the new pace with old? 
            // Better: use AppContext stats if we want precise. 
            // But for leaderboard array, let's approximation or just keep it simple.
            // Actually, best to update it based on new total.

            // To do it right without extra storage in leaderboard item:
            // We can't perfectly recalc pace without total time. 
            // Let's just use the session pace if it's the only one, or average it.
            // A simple moving average approximation:
            const oldWeight = p.distanceKm; // use distance as weight
            const newWeight = session.distanceKm;
            const newPace =
              ((p.paceMinPerKm * oldWeight) + ((session.durationSec / 60 / session.distanceKm) * newWeight))
              / (oldWeight + newWeight);

            return {
              ...p,
              distanceKm: newDist,
              paceMinPerKm: newPace || 0
            };
          }
          return p;
        });
      });
    }
  };

  const value = useMemo<AppContextValue>(
    () => ({
      isLoggedIn,
      user,
      targetKm,
      leaderboard: sortedLeaderboard,
      runHistory,
      userStats,
      login,
      logout,
      addRunSession,
    }),
    [isLoggedIn, user, targetKm, sortedLeaderboard, runHistory, userStats]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
