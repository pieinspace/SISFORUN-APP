import React, { useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { AppContext } from "../../src/context/AppContext";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from "react-native-reanimated";

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
    Alert.alert("Logout", "Yakin mau keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          ctx.logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const avatarLetter = (ctx.user.name?.[0] ?? "U").toUpperCase();

  return (
    <View style={styles.container}>
      <Animated.Text
        entering={FadeInUp.duration(350)}
        style={styles.title}
      >
        Profile
      </Animated.Text>

      <Animated.View
        entering={FadeInUp.delay(80).duration(400)}
        layout={Layout.springify()}
        style={styles.card}
      >
        <Animated.View
          entering={FadeInDown.duration(350)}
          style={styles.headerBox}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{ctx.user.name}</Text>
            <Text style={styles.sub}>NRP: {ctx.user.nrp}</Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(120).duration(380)}
          style={styles.metrics}
        >
          <Animated.View
            entering={FadeInDown.delay(160).duration(320)}
            style={styles.metricBox}
          >
            <Text style={styles.metricVal}>156.8</Text>
            <Text style={styles.metricLab}>Total KM</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(220).duration(320)}
            style={styles.metricBox}
          >
            <Text style={styles.metricVal}>5:25</Text>
            <Text style={styles.metricLab}>Avg Pace</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(280).duration(320)}
            style={styles.metricBox}
          >
            <Text style={styles.metricVal}>24</Text>
            <Text style={styles.metricLab}>Total Lari</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(220).duration(380)}>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <Animated.Text
        entering={FadeInUp.delay(180).duration(360)}
        style={styles.readonly}
      >
        * Profile hanya baca (read-only)
      </Animated.Text>

      {/* spacer biar aman dari tab bar */}
      <View style={{ height: 90 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F3", padding: 16 },

  title: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: "#2E3A2E",
    marginBottom: 12,
  },

  card: { backgroundColor: "white", borderRadius: 18, padding: 14 },

  headerBox: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 99,
    backgroundColor: "#2E3A2E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "white", fontWeight: "900", fontSize: 20 },

  name: { fontSize: 16, fontWeight: "900", color: "#2E3A2E" },
  sub: { fontSize: 12, color: "#6B776B", marginTop: 2 },

  metrics: { flexDirection: "row", gap: 10, marginTop: 14 },
  metricBox: {
    flex: 1,
    backgroundColor: "#F3F4F1",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  metricVal: { fontWeight: "900", color: "#2E3A2E", fontSize: 16 },
  metricLab: { fontSize: 11, color: "#6B776B", marginTop: 4 },

  logoutBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#B00020",
  },
  logoutText: { textAlign: "center", color: "#B00020", fontWeight: "900" },

  readonly: { marginTop: 10, textAlign: "center", fontSize: 11, color: "#6B776B" },
});
