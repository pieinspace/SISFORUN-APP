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
  weeklyDistanceKm: number; // Total jarak minggu ini
  allTimeStats: UserStats; // Stats all-time (tidak pernah reset)

  leaderboard: LeaderboardItem[];
  runHistory: RunSession[];
  userStats: UserStats; // Alias ke allTimeStats untuk backward compat

  login: (payload: { nrp: string; password: string }) => Promise<void>;
  logout: () => void;
  addRunSession: (session: RunSession) => Promise<void>;
  refreshWeeklyStats: () => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<void>;
};

export const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const API_URL = "http://10.137.184.44:4000/api";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null); // JWT token
  const [weeklyDistanceKm, setWeeklyDistanceKm] = useState(0);
  const [allTimeStats, setAllTimeStats] = useState<UserStats>({ totalKm: 0, totalRuns: 0, avgPace: 0 });

  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [runHistory, setRunHistory] = useState<RunSession[]>([]);

  // Helper: buat headers dengan auth token
  const getAuthHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    return headers;
  };

  // =========================
  // ALL-TIME STATS (tidak pernah reset)
  // =========================
  const fetchAllTimeStats = async (userId: string, token?: string): Promise<void> => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token || authToken) {
        headers["Authorization"] = `Bearer ${token || authToken}`;
      }
      const response = await fetch(`${API_URL}/alltime-stats/${userId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setAllTimeStats(data);
        console.log('All-time stats loaded:', data);
      }
    } catch (e) {
      console.log("Failed to fetch all-time stats", e);
    }
  };

  // =========================
  // WEEKLY STATS
  // =========================
  const fetchWeeklyStats = async (userId: string, token?: string): Promise<void> => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token || authToken) {
        headers["Authorization"] = `Bearer ${token || authToken}`;
      }
      const response = await fetch(`${API_URL}/weekly-stats/${userId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setWeeklyDistanceKm(data.weeklyDistanceKm);
        console.log('Weekly stats loaded:', data.weeklyDistanceKm, 'km this week');
      }
    } catch (e) {
      console.log("Failed to fetch weekly stats", e);
    }
  };

  // =========================
  // LEADERBOARD
  // =========================
  const fetchLeaderboard = async (): Promise<void> => {
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
  // USER STATS (Sekarang diambil dari backend All-Time)
  // =========================
  const userStats = useMemo<UserStats>(() => {
    return allTimeStats;
  }, [allTimeStats]);

  // =========================
  // LOGIN
  // =========================

  const fetchRunHistory = async (userId: string, token?: string): Promise<void> => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token || authToken) {
        headers["Authorization"] = `Bearer ${token || authToken}`;
      }
      const response = await fetch(`${API_URL}/runs/${userId}`, { headers });
      if (response.ok) {
        const data = await response.json();
        setRunHistory(data);
        console.log('Run history loaded:', data.length, 'sessions');
      }
    } catch (e) {
      console.log("Failed to fetch run history", e);
    }
  };

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

      // Backend harus return: { user: { id, nrp, role, name } }
      const backendUser = data.user as User;

      if (!backendUser?.id || !backendUser?.nrp || !backendUser?.role) {
        throw new Error("Response login tidak lengkap (id/nrp/role).");
      }

      setUser(backendUser);
      setIsLoggedIn(true);

      // Simpan JWT token
      const token = data.token;
      setAuthToken(token);

      // Refresh semua data secara PARALLEL untuk mempercepat loading
      await Promise.all([
        fetchLeaderboard(),
        fetchRunHistory(String(backendUser.id), token),
        fetchWeeklyStats(String(backendUser.id), token),
        fetchAllTimeStats(String(backendUser.id), token),
      ]);
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const refreshWeeklyStats = async () => {
    if (user) {
      await fetchWeeklyStats(String(user.id));
      await fetchAllTimeStats(String(user.id));
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setAuthToken(null);
    setRunHistory([]);
    setWeeklyDistanceKm(0);
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

    console.log('=== SAVING RUN SESSION ===');
    console.log('Distance:', session.distanceKm, 'km');
    console.log('Duration:', session.durationSec, 'sec');
    console.log('Route points:', session.route?.length || 0);

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

      console.log('Sending to backend:', JSON.stringify(payload).substring(0, 200));

      const response = await fetch(`${API_URL}/runs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Failed to save run to DB:", response.status);
      } else {
        const result = await response.json();
        console.log('Run saved successfully:', result);

        // Refresh stats dari backend agar data akurat
        fetchAllTimeStats(String(user.id));
        fetchWeeklyStats(String(user.id));
      }
    } catch (e) {
      console.log("API Error", e);
    }
  };

  const changePassword = async (oldPass: string, newPass: string) => {
    if (!user) throw new Error("User not logged in");

    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nrp: user.nrp, oldPassword: oldPass, newPassword: newPass }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Gagal mengubah password");
    }
  };

  const value = useMemo<AppContextValue>(
    () => ({
      isLoggedIn,
      user,
      targetKm,
      weeklyDistanceKm,
      allTimeStats,
      leaderboard: sortedLeaderboard,
      runHistory,
      userStats,
      login,
      logout,
      addRunSession,
      refreshWeeklyStats,
      changePassword,
    }),
    [isLoggedIn, user, targetKm, weeklyDistanceKm, allTimeStats, sortedLeaderboard, runHistory, userStats]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
