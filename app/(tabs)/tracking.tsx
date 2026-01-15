import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import * as Location from "expo-location";
import { AppContext } from "../../src/context/AppContext";
import { formatPace, formatTime, haversineDistanceKm } from "../../src/utils/geo";

type TrackPoint = { latitude: number; longitude: number; timestamp: number };

export default function TrackingScreen() {
  const ctx = useContext(AppContext);
  const targetKm = ctx?.targetKm ?? 14;

  const [isTracking, setIsTracking] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [paceMinPerKm, setPaceMinPerKm] = useState(0);

  const watchSub = useRef<Location.LocationSubscription | null>(null);
  const lastPoint = useRef<TrackPoint | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetNotifiedRef = useRef(false);

  useEffect(() => {
    if (distanceKm > 0) {
      const minutes = elapsedSec / 60;
      setPaceMinPerKm(minutes / distanceKm);
    } else setPaceMinPerKm(0);

    if (!targetNotifiedRef.current && distanceKm >= targetKm) {
      targetNotifiedRef.current = true;
      Alert.alert("Target tercapai", "Anda sudah mencapai target");
    }
  }, [distanceKm, elapsedSec, targetKm]);

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin ditolak", "Aplikasi butuh akses lokasi untuk tracking.");
      return;
    }

    setIsTracking(true);

    timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);

    watchSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 1000,
        distanceInterval: 3,
      },
      (pos) => {
        const p: TrackPoint = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: pos.timestamp,
        };

        if (lastPoint.current) {
          const inc = haversineDistanceKm(lastPoint.current, p);
          // filter lonjakan error GPS
          if (isFinite(inc) && inc >= 0 && inc < 0.2) {
            setDistanceKm((d) => d + inc);
          }
        }
        lastPoint.current = p;
      }
    );
  };

  const stopTracking = () => {
    setIsTracking(false);

    if (watchSub.current) {
      watchSub.current.remove();
      watchSub.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const reset = () => {
    lastPoint.current = null;
    targetNotifiedRef.current = false;
    setDistanceKm(0);
    setElapsedSec(0);
    setPaceMinPerKm(0);
  };

  useEffect(() => {
    return () => {
      if (watchSub.current) watchSub.current.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const progress = Math.min(1, distanceKm / targetKm);
  const progressPct = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SISFORUN</Text>

      <Text style={styles.big}>{distanceKm.toFixed(2)}</Text>
      <Text style={styles.label}>KILOMETER</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{formatPace(paceMinPerKm)}</Text>
          <Text style={styles.statLab}>PACE / KM</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{formatTime(elapsedSec)}</Text>
          <Text style={styles.statLab}>WAKTU</Text>
        </View>
      </View>

      <View style={styles.targetBox}>
        <Text style={styles.targetTitle}>Target {targetKm} KM</Text>
        <Text style={styles.targetSub}>{progressPct}%</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.targetHint}>
         {targetNotifiedRef.current || distanceKm >= targetKm
           ? "Anda sudah mencapai target"
           : `${(targetKm - distanceKm).toFixed(2)} km lagi menuju target`}
        </Text>

      </View>

      <View style={styles.btnRow}>
        {!isTracking ? (
          <TouchableOpacity style={styles.btnPrimary} onPress={startTracking}>
            <Text style={styles.btnText}>▶ Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnDanger} onPress={stopTracking}>
            <Text style={styles.btnText}>⏸ Stop</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btnGhost} onPress={reset} disabled={isTracking}>
          <Text style={[styles.btnGhostText, isTracking && { opacity: 0.4 }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      {isTracking && <Text style={styles.banner}>Tracking sedang berjalan</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F3", padding: 16, alignItems: "center" },
  title: { marginTop: 10, fontSize: 18, fontWeight: "900", color: "#2E3A2E" },
  big: { fontSize: 68, fontWeight: "900", color: "#2E3A2E", marginTop: 30 },
  label: { fontSize: 12, color: "#6B776B", letterSpacing: 2 },

  statsRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  statBox: { width: 140, backgroundColor: "white", borderRadius: 18, padding: 14, alignItems: "center" },
  statVal: { fontSize: 20, fontWeight: "900", color: "#2E3A2E" },
  statLab: { fontSize: 10, color: "#6B776B", marginTop: 6 },

  targetBox: { marginTop: 18, width: "100%", backgroundColor: "white", borderRadius: 18, padding: 14 },
  targetTitle: { fontWeight: "900", color: "#2E3A2E" },
  targetSub: { position: "absolute", right: 14, top: 14, fontWeight: "900", color: "#2E3A2E" },
  progressTrack: { height: 10, borderRadius: 999, backgroundColor: "#E6E9E3", marginTop: 12, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#2E3A2E" },
  targetHint: { marginTop: 10, fontSize: 12, color: "#6B776B" },

  btnRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  btnPrimary: { backgroundColor: "#2E3A2E", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999 },
  btnDanger: { backgroundColor: "#B00020", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999 },
  btnText: { color: "white", fontWeight: "900" },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#2E3A2E", paddingVertical: 14, paddingHorizontal: 20, borderRadius: 999 },
  btnGhostText: { color: "#2E3A2E", fontWeight: "900" },

  banner: { marginTop: 14, fontSize: 12, color: "#2E3A2E", fontWeight: "800" },
});
