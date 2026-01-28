import React, { createContext, useEffect, useMemo, useState } from "react";
import { LeaderboardItem, RunSession, User } from "../types/app";

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

  login: (payload: { nrp: string; password: string }) => Promise<void>;
  logout: () => void;
  addRunSession: (session: RunSession) => Promise<void>;
};

export const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // ✅ GANTI IP ini sesuai IP laptop/PC kamu (yang satu WiFi dengan HP)
  // contoh: http://192.168.1.5:4000/api
  const API_URL = "http://172.28.32.91:4000/api";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [runHistory, setRunHistory] = useState<RunSession[]>([]);

  // =========================
  // LEADERBOARD
  // =========================
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.log("Failed to fetch leaderboard", e);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedLeaderboard = useMemo(() => {
    return [...leaderboard].sort((a, b) => {
      if (b.distanceKm !== a.distanceKm) return b.distanceKm - a.distanceKm;
      return a.paceMinPerKm - b.paceMinPerKm;
    });
  }, [leaderboard]);

  // =========================
  // TARGET KM (role dari backend)
  // ASN: 10 km, MILITER: 14 km
  // =========================
  const targetKm = user?.role === "asn" ? 10 : 14;

  // =========================
  // USER STATS (dari runHistory lokal)
  // =========================
  const userStats = useMemo<UserStats>(() => {
    const totalRuns = runHistory.length;
    const totalKm = runHistory.reduce((acc, curr) => acc + curr.distanceKm, 0);
    const totalDurSec = runHistory.reduce((acc, curr) => acc + curr.durationSec, 0);

    let avgPace = 0;
    if (totalKm > 0) Fletcher: {
      avgPace = (totalDurSec / 60) / totalKm;
    }

    return { totalKm, totalRuns, avgPace };
  }, [runHistory]);

  // =========================
  // LOGIN
  // =========================
  const login: AppContextValue["login"] = async ({ nrp, password }) => {
    try {
      const cleanedNrp = String(nrp).trim();

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nrp: cleanedNrp, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Backend harus return: { user: { id, nrp, role } }
      const backendUser = data.user as User;

      if (!backendUser?.id || !backendUser?.nrp || !backendUser?.role) {
        throw new Error("Response login tidak lengkap (id/nrp/role).");
      }

      setUser(backendUser);
      setIsLoggedIn(true);

      // optional: refresh leaderboard sekali setelah login
      fetchLeaderboard();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setRunHistory([]);
  };

  // =========================
  // RUNS
  // =========================
  const updateLeaderboardLocal = (session: RunSession) => {
    if (!user) return;

    setLeaderboard((prev) => {
      return prev.map((p) => {
        if (p.nrp === user.nrp) {
          const newDist = p.distanceKm + session.distanceKm;
          return { ...p, distanceKm: newDist };
        }
        return p;
      });
    });
  };

  const addRunSession: AppContextValue["addRunSession"] = async (session) => {
    if (!user) return;

    // Optimistic update biar UI langsung update
    setRunHistory((prev) => [session, ...prev]);
    updateLeaderboardLocal(session);

    try {
      const payload = {
        userId: user.id,
        distanceKm: session.distanceKm,
        durationSec: session.durationSec,
        route: session.route,
      };

      const response = await fetch(`${API_URL}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Failed to save run to DB");
      } else {
        await response.json();
      }
    } catch (e) {
      console.error("API Error", e);
      // kalau offline, data lokal sudah tetap tersimpan di state (runHistory)
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
