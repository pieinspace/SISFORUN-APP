import React, { useContext, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { AppContext } from "../../src/context/AppContext";

export default function ProfileScreen() {
  const ctx = useContext(AppContext);
  const router = useRouter();

  // kalau context belum kebaca (sangat sebentar), tampilkan loading
  if (!ctx) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator />
      </View>
    );
  }

  // kalau belum login / user null -> langsung arahkan ke login
  useEffect(() => {
    if (!ctx.isLoggedIn || !ctx.user) {
      router.replace("/(auth)/login");
    }
  }, [ctx.isLoggedIn, ctx.user, router]);

  // sementara menunggu redirect jalan
  if (!ctx.isLoggedIn || !ctx.user) return null;

  const onLogout = () => {
    ctx.logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.headerBox}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{ctx.user.name?.[0]?.toUpperCase() ?? "U"}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{ctx.user.name}</Text>
            <Text style={styles.sub}>NRP: {ctx.user.nrp}</Text>
          </View>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>156.8</Text>
            <Text style={styles.metricLab}>Total KM</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>5:25</Text>
            <Text style={styles.metricLab}>Avg Pace</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricVal}>24</Text>
            <Text style={styles.metricLab}>Total Lari</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.readonly}>* Profile hanya baca (read-only)</Text>

      {/* spacer biar aman dari tab bar */}
      <View style={{ height: 90 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F3", padding: 16 },
  title: { textAlign: "center", fontSize: 18, fontWeight: "900", color: "#2E3A2E", marginBottom: 12 },

  card: { backgroundColor: "white", borderRadius: 18, padding: 14 },
  headerBox: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatar: { width: 64, height: 64, borderRadius: 99, backgroundColor: "#2E3A2E", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "white", fontWeight: "900", fontSize: 20 },

  name: { fontSize: 16, fontWeight: "900", color: "#2E3A2E" },
  sub: { fontSize: 12, color: "#6B776B", marginTop: 2 },

  metrics: { flexDirection: "row", gap: 10, marginTop: 14 },
  metricBox: { flex: 1, backgroundColor: "#F3F4F1", borderRadius: 14, padding: 12, alignItems: "center" },
  metricVal: { fontWeight: "900", color: "#2E3A2E", fontSize: 16 },
  metricLab: { fontSize: 11, color: "#6B776B", marginTop: 4 },

  logoutBtn: { marginTop: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: "#B00020" },
  logoutText: { textAlign: "center", color: "#B00020", fontWeight: "900" },

  readonly: { marginTop: 10, textAlign: "center", fontSize: 11, color: "#6B776B" },
});
