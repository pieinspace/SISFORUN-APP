import SharedHeader from "@/src/components/SharedHeader";
import { AppContext } from "@/src/context/AppContext";
import { LatLng } from "@/src/types/app";
import { formatPace } from "@/src/utils/geo";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as TaskManager from "expo-task-manager";
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

// Define Task for background
const LOCATION_TASK_NAME = 'RUN_TRACKING';

try {
    TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
        if (error) {
            // check `error.message` for details
            return;
        }
        if (data) {
            const { locations } = data as any;
            // Background processing - in a real app store this in SQLite/AsyncStorage
            // Here we mainly do it to keep the service alive
            console.log('Bg loc:', locations?.length);
        }
    });
} catch (e) {
    // Task might be already defined
}

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

    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

    async function startTracking() {
        setError(null);

        if (permissionGranted === false) {
            Alert.alert("Izin lokasi dibutuhkan", "Aktifkan izin lokasi agar tracking bisa jalan.");
            return;
        }

        try {
            // Request Background permission if possible (Android only for now to avoid iOS config issues)
            if (Platform.OS !== 'web' && Platform.OS !== 'ios') {
                const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
                if (bgStatus === 'granted') {
                    await Location.startLocationUpdatesAsync('RUN_TRACKING', {
                        accuracy: Location.Accuracy.BestForNavigation,
                        timeInterval: 1000,
                        distanceInterval: 5,
                        foregroundService: {
                            notificationTitle: "SisfoRun Tracking",
                            notificationBody: "Tracking lari sedang berjalan...",
                        }
                    });
                }
            }

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
            setRouteCoords([p0]);
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
                        // Only add if moving
                        // If prev exists, calc distance
                        if (prev) {
                            const dKm = haversineKm(prev, p);
                            if (dKm > 0.005) { // 5 meters threshold
                                setDistanceKm((d) => d + dKm);
                                setRouteCoords(prevRoute => [...prevRoute, p]);
                                return p;
                            }
                            return prev;
                        }
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
        // Just stop updates, stay on screen
        stopTrackingInternal();
    }

    function onBackPress() {
        if (distanceKm > 0.01 && !isTracking) {
            // If stopped and has distance -> Save & Go to Summary
            if (ctx?.addRunSession) {
                const newSessionId = Math.random().toString();
                ctx.addRunSession({
                    id: newSessionId,
                    date: new Date().toISOString(),
                    distanceKm: distanceKm,
                    durationSec: elapsedSec,
                    route: routeCoords
                });

                router.replace({
                    pathname: "/run-summary",
                    params: { sessionId: newSessionId }
                });
            } else {
                router.back();
            }
        } else if (isTracking) {
            // If currently tracking, warn user or just go back (which usually means cancel)
            // For now let's just stop and go back/cancel
            stopTrackingInternal();
            router.back();
        } else {
            // Not tracking, no distance -> just go back
            router.back();
        }
    }

    function resetTracking() {
        const resetAction = () => {
            stopTrackingInternal();
            setDistanceKm(0);
            setElapsedSec(0);
            setRouteCoords([]);
            setLastPoint(null);
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Reset Lari? Progress saat ini akan dihapus dan tidak disimpan.")) {
                resetAction();
            }
        } else {
            Alert.alert(
                "Reset Lari?",
                "Progress saat ini akan dihapus dan tidak disimpan.",
                [
                    { text: "Batal", style: "cancel" },
                    {
                        text: "Reset",
                        style: "destructive",
                        onPress: resetAction
                    }
                ]
            );
        }
    }



    return (
        <View style={styles.container}>
            <SharedHeader
                title="Tracking Lari"
                centerTitle={true}
                showBack={true}
                onBackPress={onBackPress}
            />

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
                {!isTracking ? (
                    <>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={startTracking}
                            style={styles.playButtonLarge}
                        >
                            <Ionicons name="play" size={36} color="white" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                        <Text style={styles.actionPrompt}>TAP UNTUK MULAI LARI</Text>
                    </>
                ) : (
                    <View style={styles.controlsRow}>
                        {/* Reset Button */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={resetTracking}
                            style={styles.resetButton}
                        >
                            <Ionicons name="refresh" size={28} color="white" />
                        </TouchableOpacity>

                        {/* Stop/Finish Button */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={stopTracking}
                            style={styles.stopButton}
                        >
                            <Ionicons name="stop" size={32} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
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
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20
    },
    resetButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#E57373", // Soft Red
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#E57373",
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    stopButton: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: "#D32F2F", // Strong Red
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#D32F2F",
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    actionPrompt: {
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1.5,
        color: "#6B776B",
        marginTop: 16
    }
});
