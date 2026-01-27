import React, { createContext, useEffect, useMemo, useState } from "react";
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

  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  // Fetch Leaderboard on mount and when logged in
  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, []);

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

  // CHANGE THIS TO YOUR COMPUTER'S LOCAL IP (e.g., 192.168.1.5)
  // Do not use localhost because the phone is a separate device.
  // Based on your logs earlier: 172.28.32.93 seems to be your IP.
  const API_URL = "http://172.28.32.93:4000/api";

  const login: AppContextValue["login"] = async ({ email, password, role }) => {
    try {
      // NOTE: 'email' argument contains NRP from login screen input
      // If the user typed "123456", it comes here as "123456"
      // If they typed an email, we split it.
      const nrp = email.includes("@") ? email.split("@")[0] : email;

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nrp: nrp, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Backend returns { user: ... }
      // We add role manually from selection or backend should return it
      const newUser: User = { ...data.user, role: role }; // role from frontend selection for now

      setUser(newUser);
      setIsLoggedIn(true);
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setRunHistory([]);
  };

  const addRunSession = async (session: RunSession) => {
    if (!user) return;

    try {
      const payload = {
        userId: user.id || 1, // fallback if backend uses integer
        distanceKm: session.distanceKm,
        durationSec: session.durationSec,
        route: session.route
      };

      const response = await fetch(`${API_URL}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error("Failed to save run to DB");
      } else {
        const saved = await response.json();
        // Optionally update local history from response
        setRunHistory((prev) => [session, ...prev]);
      }
    } catch (e) {
      console.error("API Error", e);
      // Optimistic update even if offline for now
      setRunHistory((prev) => [session, ...prev]);
    }

    // Update leaderboard locally for UI responsiveness (or fetch fresh)
    updateLeaderboardLocal(session);
  };

  // Helper to keep UI snappy
  const updateLeaderboardLocal = (session: RunSession) => {
    if (user) {
      setLeaderboard((prev) => {
        return prev.map(p => {
          if (p.nrp === user.nrp) {
            const newDist = p.distanceKm + session.distanceKm;
            return { ...p, distanceKm: newDist };
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
