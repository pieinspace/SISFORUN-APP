import React, { useContext } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { AppContext } from "../../src/context/AppContext";
import { LeaderboardItem } from "../../src/types/app";
import { formatPace } from "../../src/utils/geo";

export default function LeaderboardScreen() {
  const ctx = useContext(AppContext);
  if (!ctx) return null;

  const data = ctx.leaderboard.slice(0, 10);

  const renderItem = ({ item, index }: { item: LeaderboardItem; index: number }) => (
    <View style={styles.row}>
      <Text style={styles.rank}>#{index + 1}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>NRP: {item.nrp}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.val}>{item.distanceKm.toFixed(1)} km</Text>
        <Text style={styles.sub}>{formatPace(item.paceMinPerKm)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard (Top 10)</Text>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ padding: 14 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F3" },
  title: { marginTop: 16, textAlign: "center", fontSize: 18, fontWeight: "900", color: "#2E3A2E" },
  row: { flexDirection: "row", gap: 10, backgroundColor: "white", padding: 14, borderRadius: 16, alignItems: "center" },
  rank: { width: 40, fontWeight: "900", color: "#2E3A2E" },
  name: { fontWeight: "900", color: "#2E3A2E" },
  val: { fontWeight: "900", color: "#2E3A2E" },
  sub: { fontSize: 11, color: "#6B776B", marginTop: 2 },
  sep: { height: 10 },
});
