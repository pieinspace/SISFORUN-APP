import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
import * as Location from "expo-location";
import { formatPace } from "../../src/utils/geo";
import { AppContext } from "../../src/context/AppContext";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type LatLng = { latitude: number; longitude: number; timestamp?: number };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${pad2(h)}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

// Fallback distance (Haversine) dalam KM
function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371; // km
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export default function TrackingScreen() {
  const ctx = React.useContext(AppContext);
  const TARGET_KM = ctx?.targetKm ?? 14;

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const [lastPoint, setLastPoint] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subRef = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // anim: bump angka km
  const scaleKm = useSharedValue(1);
  const kmStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleKm.value }],
  }));

  // anim: progress bar lebar (px)
  const [trackW, setTrackW] = useState(0);
  const barW = useSharedValue(0);

  const barStyle = useAnimatedStyle(() => ({
    width: barW.value,
  }));

  const paceMinPerKm = useMemo(() => {
    if (distanceKm <= 0) return 0;
    const minutes = elapsedSec / 60;
    return minutes / distanceKm;
  }, [elapsedSec, distanceKm]);

  const progress = useMemo(() => {
    if (TARGET_KM <= 0) return 0;
    return Math.max(0, Math.min(1, distanceKm / TARGET_KM));
  }, [distanceKm, TARGET_KM]);

  const remainingKm = Math.max(0, TARGET_KM - distanceKm);

  // bump saat jarak berubah
  useEffect(() => {
    if (distanceKm <= 0) return;
    scaleKm.value = withSequence(withTiming(1.04, { duration: 120 }), withTiming(1, { duration: 180 }));
  }, [distanceKm, scaleKm]);

  // animate progress bar width
  useEffect(() => {
    if (!trackW) return;
    barW.value = withTiming(trackW * progress, { duration: 280 });
  }, [progress, trackW, barW]);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === "web") {
          setPermissionGranted(true);
          return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionGranted(status === "granted");
        if (status !== "granted") {
          setError("Izin lokasi ditolak. Aktifkan Location permission dulu.");
        }
      } catch (e: any) {
        setPermissionGranted(false);
        setError(e?.message ?? "Gagal meminta izin lokasi.");
      }
    })();

    return () => {
      stopTrackingInternal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startTimer() {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function startTracking() {
    setError(null);

    if (permissionGranted === false) {
      Alert.alert("Izin lokasi dibutuhkan", "Aktifkan izin lokasi agar tracking bisa jalan.");
      return;
    }

    try {
      setIsTracking(true);
      startTimer();

      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const p0: LatLng = {
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
        timestamp: initial.timestamp,
      };
      setLastPoint(p0);

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 3,
        },
        (pos) => {
          const p: LatLng = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: pos.timestamp,
          };

          setLastPoint((prev) => {
            if (!prev) return p;

            const dKm = haversineKm(prev, p);
            if (dKm > 0.2) return p;

            setDistanceKm((dkm) => dkm + dKm);
            return p;
          });
        }
      );

      subRef.current = sub;
    } catch (e: any) {
      setIsTracking(false);
      stopTimer();
      setError(e?.message ?? "Gagal memulai tracking.");
    }
  }

  function stopTrackingInternal() {
    try {
      if (subRef.current) {
        subRef.current.remove();
        subRef.current = null;
      }
    } catch {}
    stopTimer();
    setIsTracking(false);
  }

  function stopTracking() {
    stopTrackingInternal();
    if (distanceKm > 0.01) {
      Alert.alert("Sesi selesai", `Jarak: ${distanceKm.toFixed(2)} km\nWaktu: ${formatTime(elapsedSec)}`);
    }
  }

  function resetTracking() {
    stopTrackingInternal();
    setDistanceKm(0);
    setElapsedSec(0);
    setLastPoint(null);
    setError(null);
  }

  const primaryLabel = isTracking ? "Stop" : "Start";

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(450)} style={styles.topArea}>
        <Text style={styles.brand}>SISFORUN</Text>

        <Animated.Text style={[styles.bigNumber, kmStyle]}>
          {distanceKm.toFixed(2)}
        </Animated.Text>
        <Text style={styles.unit}>KILOMETER</Text>

        <View style={styles.miniCardsRow}>
          <Animated.View entering={FadeInDown.duration(450)} style={styles.miniCard}>
            <Text style={styles.miniValue}>{paceMinPerKm > 0 ? formatPace(paceMinPerKm) : "0:00"}</Text>
            <Text style={styles.miniLabel}>PACE / KM</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(520)} style={styles.miniCard}>
            <Text style={styles.miniValue}>{formatTime(elapsedSec)}</Text>
            <Text style={styles.miniLabel}>WAKTU</Text>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(520)} style={styles.targetCard}>
        <View style={styles.targetRow}>
          <Text style={styles.targetTitle}>Target {TARGET_KM} KM</Text>
          <Text style={styles.targetPct}>{Math.round(progress * 100)}%</Text>
        </View>

        <View
          style={styles.progressTrack}
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.progressFill, barStyle]} />
        </View>

        <Text style={styles.targetHint}>{remainingKm.toFixed(2)} km lagi menuju target</Text>
      </Animated.View>

      {!!error && (
        <Animated.View entering={FadeInDown.duration(450)} style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.duration(520)} style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={isTracking ? stopTracking : startTracking}
          style={[styles.primaryBtn, isTracking ? styles.stopBtn : styles.startBtn]}
        >
          <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} onPress={resetTracking} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Reset</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={{ height: 90 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F3", paddingHorizontal: 16, paddingTop: 18 },
  topArea: { alignItems: "center", marginTop: 6, marginBottom: 18 },
  brand: { fontSize: 16, letterSpacing: 2, fontWeight: "800", color: "#2E3A2E", marginBottom: 18 },
  bigNumber: { fontSize: 72, lineHeight: 78, fontWeight: "900", color: "#2E3A2E" },
  unit: { marginTop: 2, fontSize: 12, letterSpacing: 2, color: "rgba(46,58,46,0.7)", fontWeight: "700" },

  miniCardsRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  miniCard: {
    width: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  miniValue: { fontSize: 22, fontWeight: "900", color: "#2E3A2E" },
  miniLabel: { marginTop: 4, fontSize: 11, fontWeight: "800", letterSpacing: 1.3, color: "rgba(46,58,46,0.6)" },

  targetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  targetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  targetTitle: { fontSize: 14, fontWeight: "900", color: "#2E3A2E" },
  targetPct: { fontSize: 14, fontWeight: "900", color: "#2E3A2E" },

  progressTrack: { height: 10, borderRadius: 999, backgroundColor: "rgba(46,58,46,0.12)", overflow: "hidden" },
  progressFill: { height: 10, borderRadius: 999, backgroundColor: "#2E3A2E" },

  targetHint: { marginTop: 10, fontSize: 12, color: "rgba(46,58,46,0.65)", fontWeight: "700" },

  errorBox: { marginTop: 12, backgroundColor: "#FFE8E8", borderRadius: 14, padding: 12 },
  errorText: { color: "#B00020", fontWeight: "700" },

  actionsRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 18 },
  primaryBtn: { minWidth: 140, height: 44, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  startBtn: { backgroundColor: "#2E3A2E" },
  stopBtn: { backgroundColor: "#2E3A2E" },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 14, letterSpacing: 0.5 },

  secondaryBtn: {
    minWidth: 110,
    height: 44,
    borderRadius: 999,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(46,58,46,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: "#2E3A2E", fontWeight: "900", fontSize: 14 },
});
