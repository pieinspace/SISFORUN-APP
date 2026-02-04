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
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  /* 1. Fixed to Top 10 only */
  const TOP_LIMIT = 10;
  const displayedList = leaderboardData.slice(0, TOP_LIMIT);

  /* 2. Find user rank */
  const userRankIndex = leaderboardData.findIndex(
    (item) => item.nrp === ctx?.user?.nrp
  );
  const userRank = userRankIndex + 1;
  const userItem = userRankIndex >= 0 ? leaderboardData[userRankIndex] : null;

  /* 3. Show user at bottom if NOT in top 10 */
  const showUserAtBottom = userRank > TOP_LIMIT && userItem;

  const renderItem = ({ item, index }: { item: typeof leaderboardData[0], index: number }) => {
    const isFirst = index === 0;
    const isUser = item.nrp === ctx?.user?.nrp;

    return (
      <Animated.View
        entering={FadeInDown.delay(index < 10 ? 80 * index : 0).duration(350)}
        style={[
          styles.row,
          isUser && styles.rowUser,
        ]}
      >
        <View style={[
          styles.rankBox,
          index === 0 && { backgroundColor: "#FFD700" }, // Gold
          index === 1 && { backgroundColor: "#C0C0C0" }, // Silver
          index === 2 && { backgroundColor: "#CD7F32" }, // Bronze
        ]}>
          <Text style={[
            styles.rank,
            index <= 2 && { color: "#FFFFFF" }, // White text for top 3
          ]}>
            #{index + 1}
          </Text>
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
      <SharedHeader title="FORZA" subtitle="Leaderboard" rightIcons={CustomRightIcons} />

      <FlatList
        data={displayedList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 Top 10 Leaderboard</Text>
          </View>
        }
        ListFooterComponent={
          showUserAtBottom ? (
            <View>
              {/* Separator */}
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>Peringkat Anda</Text>
                <View style={styles.separatorLine} />
              </View>
              {/* User Row */}
              <Animated.View
                entering={FadeInDown.delay(300).duration(350)}
                style={[styles.row, styles.rowUser]}
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
              </Animated.View>
              <View style={{ height: 100 }} />
            </View>
          ) : (
            <View style={{ height: 100 }} />
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E3A2E"]} />
        }
      />
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

  rank: { fontWeight: "900", color: "#6B776B", fontSize: 14 },

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
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D0D0D0',
  },
  separatorText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#6B776B',
  },
});