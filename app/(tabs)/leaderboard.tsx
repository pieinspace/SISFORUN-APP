import SharedHeader from "@/src/components/SharedHeader";
import { AppContext } from "@/src/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function LeaderboardScreen() {
  const ctx = useContext(AppContext);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(10);
  const [locPermission, setLocPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocPermission(status === 'granted');
    })();
  }, []);

  const leaderboardData = ctx?.leaderboard ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // ctx asumsikan punya fungsi untuk refresh manual atau kita panggil fetchLeaderboard jika ada di ctx
    // Untuk sekarang kita asumsikan fetch berkelanjutan sudah jalan, tapi kita bisa trigger manual jika ada.
    // Karena fetchLeaderboard tidak di-expose di AppContextValue, kita tunggu intervalnya atau tambahkan ke ctx.

    // Simulasi loading sebentar
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const loadMore = () => {
    if (visibleLimit < leaderboardData.length) {
      setVisibleLimit(prev => prev + 10);
    }
  };

  /* 1. Slice based on dynamic limit */
  const displayedList = leaderboardData.slice(0, visibleLimit);

  /* 2. Find user rank */
  const userRankIndex = leaderboardData.findIndex(
    (item) => item.nrp === ctx?.user?.nrp
  );
  const userRank = userRankIndex + 1;
  const userItem = userRankIndex >= 0 ? leaderboardData[userRankIndex] : null;

  /* 3. Check if user is outside visible or top 10 */
  const showStickyFooter = userRank > visibleLimit && userItem;

  const renderItem = ({ item, index }: { item: typeof leaderboardData[0], index: number }) => {
    const isFirst = index === 0;
    const isUser = item.nrp === ctx?.user?.nrp;

    return (
      <Animated.View
        entering={FadeInDown.delay(index < 10 ? 80 * index : 0).duration(350)}
        style={[
          styles.row,
          isFirst && styles.rowFirst,
          isUser && styles.rowUser,
        ]}
      >
        <View style={[styles.rankBox, isFirst && styles.rankBoxFirst]}>
          <Text style={[styles.rank, isFirst && styles.rankFirst]}>#{index + 1}</Text>
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name}>
            {item.name} {isUser ? "(You)" : ""}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.km}>{item.distanceKm.toFixed(1)} km</Text>
          <Text style={styles.sub}>{item.paceMinPerKm.toFixed(2)}</Text>
        </View>
      </Animated.View>
    );
  };

  const CustomRightIcons = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={styles.toggleContainer}>
        <Ionicons name="location-outline" size={14} color="#6B776B" style={{ marginRight: 4 }} />
        <View style={[styles.dot, { backgroundColor: locPermission ? '#4CAF50' : '#B00020' }]} />
      </View>
      <TouchableOpacity onPress={() => router.push("/settings")}>
        <Ionicons name="settings-outline" size={24} color="#2E3A2E" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SharedHeader title="SISFORUN" subtitle="Leaderboard" rightIcons={CustomRightIcons} />

      <FlatList
        data={displayedList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 Leaderboard (Top {leaderboardData.length})</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 120 }} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E3A2E"]} />
        }
      />

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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EAE6',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
});