import SharedHeader from "@/src/components/SharedHeader";
import { AppContext } from "@/src/context/AppContext";
import { formatPace } from "@/src/utils/geo";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
    const router = useRouter();
    const ctx = React.useContext(AppContext);
    const TARGET_KM = ctx?.targetKm ?? 14;

    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
    const [isTracking, setIsTracking] = useState(false);

    const [distanceKm, setDistanceKm] = useState(0);
    const [elapsedSec, setElapsedSec] = useState(0);

    const [, setLastPoint] = useState<LatLng | null>(null);
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
        } catch { }
        stopTimer();
        setIsTracking(false);
    }

    function stopTracking() {
        stopTrackingInternal();
        if (distanceKm > 0.01) {
            Alert.alert(
                "Sesi selesai",
                `Jarak: ${distanceKm.toFixed(2)} km\nWaktu: ${formatTime(elapsedSec)}`,
                [
                    {
                        text: "OK",
                        onPress: () => {
                            // Navigate to Leaderboard after finished
                            router.dismissAll(); // Clear stack if needed, or just replace
                            router.replace("/(tabs)/leaderboard");
                        }
                    }
                ]
            );
        } else {
            // Just stop without alert if distance is 0
            router.back();
        }
    }

    const primaryLabel = isTracking ? "TAP UNTUK STOP" : "TAP UNTUK MULAI LARI";

    return (
        <View style={styles.container}>
            <SharedHeader title="Tracking Lari" centerTitle={true} showBack={true} />

            <View style={styles.content}>

                {/* Main Distance Display */}
                <Animated.View entering={FadeInUp.duration(450)} style={styles.mainDisplay}>
                    <Animated.Text style={[styles.bigNumber, kmStyle]}>
                        {distanceKm.toFixed(2)}
                    </Animated.Text>
                    <Text style={styles.unit}>KILOMETER</Text>
                </Animated.View>

                {/* Stats Grid */}
                <Animated.View entering={FadeInDown.duration(450)} style={styles.statsRow}>
                    {/* Card 1: Pace */}
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{paceMinPerKm > 0 ? formatPace(paceMinPerKm) : "0:00"}</Text>
                        <Text style={styles.statLabel}>PACE / KM</Text>
                    </View>

                    {/* Card 2: Time */}
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{formatTime(elapsedSec)}</Text>
                        <Text style={styles.statLabel}>WAKTU</Text>
                    </View>
                </Animated.View>

                {/* Target Card */}
                <Animated.View entering={FadeInDown.duration(520)} style={styles.targetCard}>
                    <View style={styles.targetRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.targetIcon}>◎</Text>
                            <Text style={styles.targetTitle}> Target {TARGET_KM} KM</Text>
                        </View>
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
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

            </View>

            {/* Bottom Action Area */}
            <Animated.View entering={FadeInUp.duration(520)} style={styles.bottomArea}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={isTracking ? stopTracking : startTracking}
                    style={styles.playButtonLarge}
                >
                    <Text style={styles.playIcon}>▶</Text>
                </TouchableOpacity>
                <Text style={styles.actionPrompt}>{primaryLabel}</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F8F8" }, // Off-white
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },

    mainDisplay: { alignItems: "center", marginBottom: 30, marginTop: 40 },
    bigNumber: { fontSize: 80, lineHeight: 80, fontWeight: "900", color: "#2E3A2E" },
    unit: { marginTop: 8, fontSize: 13, letterSpacing: 3, color: "rgba(46,58,46,0.6)", fontWeight: "700" },

    statsRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
    statCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingVertical: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    statValue: { fontSize: 28, fontWeight: "900", color: "#2E3A2E" },
    statLabel: { marginTop: 6, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, color: "rgba(46,58,46,0.5)" },

    targetCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        marginBottom: 20
    },
    targetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    targetIcon: { fontSize: 18, color: "#6B776B", marginRight: 6 },
    targetTitle: { fontSize: 15, fontWeight: "800", color: "#2E3A2E" },
    targetPct: { fontSize: 15, fontWeight: "900", color: "#2E3A2E" },

    progressTrack: { height: 12, borderRadius: 999, backgroundColor: "#EEEEEE", overflow: "hidden" },
    progressFill: { height: 12, borderRadius: 999, backgroundColor: "#C2C5BE" }, // Greyish Green fill
    targetHint: { marginTop: 12, fontSize: 12, color: "rgba(46,58,46,0.6)", fontWeight: "600", textAlign: 'center' },

    errorBox: { marginTop: 12, backgroundColor: "#FFE8E8", borderRadius: 14, padding: 12 },
    errorText: { color: "#B00020", fontWeight: "700" },

    bottomArea: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center'
    },
    playButtonLarge: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: "#3E4D31",
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#3E4D31",
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
        marginBottom: 16
    },
    playIcon: {
        color: "#FFFFFF",
        fontSize: 32,
        marginLeft: 4 // Visual correction for play icon center
    },
    actionPrompt: {
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1.5,
        color: "#6B776B"
    }
});
