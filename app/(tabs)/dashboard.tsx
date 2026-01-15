import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { AppContext } from "../../src/context/AppContext";
import { formatPace } from "../../src/utils/geo";

export default function DashboardScreen() {
  const ctx = useContext(AppContext);
  const { width } = useWindowDimensions();
  const isSmall = width < 900; // responsif: kecil jadi vertikal

  if (!ctx || !ctx.user) return null;

  const topPreview = ctx.leaderboard.slice(0, 5);

  const LeaderboardCard = (
    <TouchableOpacity style={styles.cardSmall} onPress={() => router.push("/(tabs)/leaderboard")}>
      <Text style={styles.cardTitle}>Leaderboard</Text>
      {topPreview.map((p, idx) => (
        <View key={p.id} style={styles.lbRow}>
          <Text style={styles.lbRank}>#{idx + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.lbName}>{p.name}</Text>
            <Text style={styles.lbSub}>NRP: {p.nrp}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.lbVal}>{p.distanceKm.toFixed(1)} km</Text>
            <Text style={styles.lbSub}>{formatPace(p.paceMinPerKm)}</Text>
          </View>
        </View>
      ))}
      <Text style={styles.link}>Lihat Top 10 →</Text>
    </TouchableOpacity>
  );

  const TrackingCard = (
    <TouchableOpacity style={styles.cardBig} onPress={() => router.push("/(tabs)/tracking")}>
      <Text style={styles.cardTitle}>Tracking Lari</Text>
      <Text style={styles.bigNumber}>0.00</Text>
      <Text style={styles.small}>KILOMETER</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>0:00</Text>
          <Text style={styles.statLabel}>PACE / KM</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>00:00</Text>
          <Text style={styles.statLabel}>WAKTU</Text>
        </View>
      </View>

      <Text style={styles.targetText}>
        Target: {ctx.targetKm} KM ({ctx.user.role.toUpperCase()})
      </Text>

      <View style={styles.startBtn}>
        <Text style={styles.startBtnText}>▶ TAP UNTUK MULAI LARI</Text>
      </View>
    </TouchableOpacity>
  );

  const ProfileCard = (
    <TouchableOpacity style={styles.cardSmall} onPress={() => router.push("/(tabs)/profile")}>
      <Text style={styles.cardTitle}>Profile</Text>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{ctx.user.name[0]?.toUpperCase()}</Text>
      </View>
      <Text style={styles.profileName}>{ctx.user.name}</Text>
      <Text style={styles.lbSub}>NRP: {ctx.user.nrp}</Text>
      <Text style={styles.lbSub}>Role: {ctx.user.role}</Text>
      <Text style={styles.link}>Lihat Profile →</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>SISFORUN</Text>
        <View style={styles.headerRight}>
          <View style={styles.gpsDot} />
          <Text style={styles.small2}>GPS</Text>
          <Text style={styles.small2}>🔔</Text>
          <Text style={styles.small2}>⎋</Text>
        </View>
      </View>

      {/* CONTENT */}
      <View style={[styles.row, isSmall && { flexDirection: "column" }]}>
        {isSmall ? (
          <>
            {TrackingCard}
            {LeaderboardCard}
            {ProfileCard}
          </>
        ) : (
          <>
            {LeaderboardCard}
            {TrackingCard}
            {ProfileCard}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F3", padding: 16 },
  header: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "white",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#1F2A1E" },
  headerRight: { flexDirection: "row", gap: 10, alignItems: "center" },
  gpsDot: { width: 10, height: 10, borderRadius: 99, backgroundColor: "#2ECC71" },
  small2: { fontSize: 12, color: "#465445" },

  row: { flex: 1, flexDirection: "row", gap: 12 },

  cardSmall: { flex: 1, backgroundColor: "white", borderRadius: 18, padding: 12 },
  cardBig: { flex: 1.3, backgroundColor: "white", borderRadius: 18, padding: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#1F2A1E", marginBottom: 8 },

  lbRow: { flexDirection: "row", gap: 8, paddingVertical: 6, alignItems: "center" },
  lbRank: { width: 34, fontWeight: "800", color: "#2E3A2E" },
  lbName: { fontWeight: "700", color: "#2E3A2E" },
  lbVal: { fontWeight: "800", color: "#2E3A2E" },
  lbSub: { fontSize: 11, color: "#6B776B" },
  link: { marginTop: 8, fontWeight: "700", color: "#2E3A2E" },

  bigNumber: { fontSize: 56, fontWeight: "900", color: "#2E3A2E", marginTop: 8 },
  small: { fontSize: 12, color: "#6B776B", letterSpacing: 2 },

  statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  statBox: { width: 110, backgroundColor: "#F3F4F1", borderRadius: 14, padding: 10, alignItems: "center" },
  statVal: { fontSize: 18, fontWeight: "800", color: "#2E3A2E" },
  statLabel: { fontSize: 10, color: "#6B776B", marginTop: 4 },

  targetText: { marginTop: 12, fontSize: 12, color: "#2E3A2E", fontWeight: "700" },
  startBtn: { marginTop: 16, backgroundColor: "#2E3A2E", borderRadius: 999, paddingVertical: 14, paddingHorizontal: 18 },
  startBtnText: { color: "white", fontWeight: "800" },

  avatar: { width: 64, height: 64, borderRadius: 99, backgroundColor: "#2E3A2E", alignItems: "center", justifyContent: "center", marginTop: 10 },
  avatarText: { color: "white", fontSize: 20, fontWeight: "900" },
  profileName: { marginTop: 10, fontSize: 16, fontWeight: "800", color: "#2E3A2E" },
});
