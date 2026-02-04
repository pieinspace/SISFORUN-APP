import SharedHeader from "@/src/components/SharedHeader";
import { AppContext } from "@/src/context/AppContext";
import { formatPace } from "@/src/utils/geo";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from "react-native-reanimated";

export default function ProfileScreen() {
  const ctx = useContext(AppContext);
  const router = useRouter();
  const [locPermission, setLocPermission] = useState<boolean | null>(null);

  const targetKm = ctx?.targetKm ?? 14;
  const weeklyKm = ctx?.weeklyDistanceKm ?? 0;
  const isTargetMet = weeklyKm >= targetKm;

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocPermission(status === 'granted');
    })();
  }, []);

  // kalau belum login / user null -> langsung arahkan ke login
  useEffect(() => {
    if (ctx && (!ctx.isLoggedIn || !ctx.user)) {
      router.replace("/(auth)/login");
    }
  }, [ctx, router]);

  // kalau context belum kebaca (sangat sebentar), tampilkan loading
  if (!ctx) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator />
      </View>
    );
  }

  // sementara menunggu redirect jalan
  if (!ctx.isLoggedIn || !ctx.user) return null;

  const onLogout = () => {
    // Direct logout for now to ensure button works
    if (Platform.OS === 'web') {
      const confirm = window.confirm("Yakin mau keluar?");
      if (confirm) {
        ctx.logout();
        router.replace("/(auth)/login");
      }
    } else {
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
    }
  };

  const avatarLetter = (ctx.user.name?.[0] ?? "U").toUpperCase();

  const CustomRightIcons = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={styles.toggleContainer}>
        <Ionicons name="location-outline" size={14} color="#6B776B" style={{ marginRight: 4 }} />
        <View style={[styles.dot, { backgroundColor: locPermission ? '#4CAF50' : '#B00020' }]} />
      </View>
      <TouchableOpacity
        onPress={() => {
          if (!isTargetMet) {
            Alert.alert("Notifikasi", "Anda belum mencapai target minggu ini");
          } else {
            Alert.alert("Notifikasi", "Target minggu ini sudah tercapai! Luar biasa.");
          }
        }}
      >
        <Ionicons name="notifications-outline" size={24} color="#2E3A2E" />
        {!isTargetMet && (
          <View
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#B00020',
              borderWidth: 1,
              borderColor: '#F5F6F3'
            }}
          />
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/settings")}>
        <Ionicons name="settings-outline" size={24} color="#2E3A2E" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SharedHeader
        title="FORZA"
        subtitle="Profile"
        rightIcons={CustomRightIcons}
      />

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
            <Text style={styles.sub}>Pangkat: {ctx.user.pangkat || '-'}</Text>
            <Text style={styles.sub}>
              Corps: {(() => {
                const pk = parseInt(ctx.user.kd_pkt || "0");
                const isAsnOrGeneral = (pk >= 21 && pk <= 45) || (pk >= 91 && pk <= 94);
                return isAsnOrGeneral ? "-" : (ctx.user.corps || "-");
              })()}
            </Text>
            <Text style={styles.sub}>Kotama: {ctx.user.kesatuan || '-'}</Text>
            <Text style={styles.sub}>Kesatuan: {ctx.user.subdis || '-'}</Text>
          </View>
        </Animated.View>



        <Animated.View
          entering={FadeInUp.delay(120).duration(380)}
          style={styles.metrics}
        >
          <View style={styles.metricBox}>
            <View style={{ marginBottom: 4 }}>
              <Ionicons name="infinite-outline" size={20} color="#6B776B" />
            </View>
            <Text style={styles.metricVal}>{ctx.userStats?.totalKm.toFixed(1) ?? "0.0"}</Text>
            <Text style={styles.metricLab}>Total KM</Text>
          </View>

          <View style={styles.metricBox}>
            <View style={{ marginBottom: 4 }}>
              <Ionicons name="timer-outline" size={20} color="#6B776B" />
            </View>
            <Text style={styles.metricVal}>
              {ctx.userStats?.avgPace ? formatPace(ctx.userStats.avgPace) : "-"}
            </Text>
            <Text style={styles.metricLab}>Avg Pace</Text>
          </View>

          <View style={styles.metricBox}>
            <View style={{ marginBottom: 4 }}>
              <Ionicons name="pulse-outline" size={20} color="#6B776B" />
            </View>
            <Text style={styles.metricVal}>{ctx.userStats?.totalRuns ?? 0}</Text>
            <Text style={styles.metricLab}>Total Lari</Text>
          </View>
        </Animated.View>


        <View style={styles.divider} />

        {/* History Button */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/history")}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time-outline" size={20} color="#3D4A3E" style={{ marginRight: 10 }} />
            <Text style={styles.menuText}>Riwayat Lari</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8B998B" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem} onPress={onLogout} activeOpacity={0.7}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="log-out-outline" size={20} color="#B00020" style={{ marginRight: 10 }} />
            <Text style={[styles.menuText, { color: '#B00020' }]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* spacer biar aman dari tab bar */}
      <View style={{ height: 90 }} />
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F3" },

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

  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  headerBox: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    backgroundColor: '#556B2F', // Olive Green darker
    padding: 16,
    borderRadius: 16,
    marginBottom: 16
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "white", fontWeight: "900", fontSize: 24 },

  name: { fontSize: 18, fontWeight: "900", color: "#FFFFFF" },
  sub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },

  metrics: { flexDirection: "row", gap: 10, marginTop: 4, marginBottom: 16 },
  metricBox: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  metricVal: { fontWeight: "900", color: "#2E3A2E", fontSize: 16 },
  metricLab: { fontSize: 11, color: "#6B776B", marginTop: 2 },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 16 },

  menuItem: {
    backgroundColor: '#F8F8F8',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  menuText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E3A2E'
  }
});