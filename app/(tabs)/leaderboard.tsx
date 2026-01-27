import SharedHeader from "@/src/components/SharedHeader";
import { AppContext } from "@/src/context/AppContext";
import React, { useContext } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function LeaderboardScreen() {
  const ctx = useContext(AppContext);

  /* 1. Slice to top 10 for main list */
  const displayedList = (ctx?.leaderboard ?? []).slice(0, 10);

  /* 2. Find user rank */
  const userRankIndex = (ctx?.leaderboard ?? []).findIndex(
    (item) => item.nrp === ctx?.user?.nrp
  );
  const userRank = userRankIndex + 1;
  const userItem = userRankIndex >= 0 ? ctx?.leaderboard[userRankIndex] : null;

  /* 3. Check if user is outside top 10 */
  const showStickyFooter = userRank > 10 && userItem;

  return (
    <View style={styles.container}>
      <SharedHeader title="SISFORUN" subtitle="Leaderboard" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
        </View>

        {displayedList.map((p, i) => {
          const isFirst = i === 0;
          return (
            <Animated.View
              key={p.id}
              entering={FadeInDown.delay(80 * i).duration(350)}
              style={[
                styles.row,
                isFirst && styles.rowFirst,
                // Highlight user row if they ARE in top 10
                p.nrp === ctx?.user?.nrp && styles.rowUser,
              ]}
            >
              <View style={[styles.rankBox, isFirst && styles.rankBoxFirst]}>
                <Text style={[styles.rank, isFirst && styles.rankFirst]}>#{i + 1}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>
                  {p.name} {p.nrp === ctx?.user?.nrp ? "(You)" : ""}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.km}>{p.distanceKm.toFixed(1)} km</Text>
                <Text style={styles.sub}>{p.paceMinPerKm.toFixed(2)}</Text>
              </View>
            </Animated.View>
          );
        })}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* STICKY FOOTER */}
      {showStickyFooter && (
        <Animated.View entering={FadeInDown.delay(500)} style={styles.stickyFooter}>
          <View
            style={[
              styles.row,
              styles.rowUser,
              { marginBottom: 0, shadowOpacity: 0.1 },
            ]}
          >
            <View style={styles.rankBox}>
              <Text style={styles.rank}>#{userRank}</Text>
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{userItem?.name} (You)</Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.km}>{userItem?.distanceKm.toFixed(1)} km</Text>
              <Text style={styles.sub}>{userItem?.paceMinPerKm.toFixed(2)}</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F3" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  sectionHeader: { marginTop: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#2E3A2E" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  rowFirst: {
    backgroundColor: "#FFF8E1", // Gold/Beige tint for #1
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  rowUser: {
    borderWidth: 1,
    borderColor: "#2E3A2E",
    backgroundColor: "#E8EAE6",
  },

  rankBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F3F4F1",
    alignItems: "center",
    justifyContent: "center",
  },
  rankBoxFirst: {
    backgroundColor: "#FFD700",
  },

  rank: { fontWeight: "900", color: "#6B776B", fontSize: 14 },
  rankFirst: { color: "#FFF" }, // White text for #1

  name: { fontWeight: "900", color: "#2E3A2E", fontSize: 14 },
  sub: { marginTop: 2, fontSize: 12, color: "rgba(46,58,46,0.5)", fontWeight: "700" },
  km: { fontWeight: "900", color: "#2E3A2E", fontSize: 14 },

  stickyFooter: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
});