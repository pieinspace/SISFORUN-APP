import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppContext } from "../../src/context/AppContext";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function LeaderboardScreen() {
  const ctx = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>

      {(ctx?.leaderboard ?? []).map((p, i) => (
        <Animated.View
          key={p.id}
          entering={FadeInDown.delay(80 * i).duration(350)}
          style={styles.row}
        >
          <Text style={styles.rank}>#{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.sub}>{p.nrp}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.km}>{p.distanceKm.toFixed(1)} km</Text>
            <Text style={styles.sub}>pace {p.paceMinPerKm.toFixed(2)}</Text>
          </View>
        </Animated.View>
      ))}

      <View style={{ height: 90 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F3", padding: 16, paddingTop: 18 },
  title: { fontSize: 18, fontWeight: "900", color: "#2E3A2E", marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  rank: { width: 44, fontWeight: "900", color: "#2E3A2E" },
  name: { fontWeight: "900", color: "#2E3A2E" },
  sub: { marginTop: 2, fontSize: 12, color: "rgba(46,58,46,0.65)", fontWeight: "700" },
  km: { fontWeight: "900", color: "#2E3A2E" },
});
