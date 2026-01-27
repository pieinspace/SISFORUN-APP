import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "@/src/components/RunMap";
import SharedHeader from "@/src/components/SharedHeader";
import { AppContext } from "@/src/context/AppContext";
import { formatPace } from "@/src/utils/geo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useRef } from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function RunSummaryScreen() {
    const router = useRouter();
    const ctx = useContext(AppContext);
    const params = useLocalSearchParams();
    const mapRef = useRef<MapView>(null);

    const sessionId = params.sessionId as string;
    const session = ctx?.runHistory.find((s) => s.id === sessionId);

    // If no session found (should not happen if flow is correct), redirect back
    useEffect(() => {
        if (!session && ctx) {
            router.replace("/(tabs)/profile");
        }
    }, [session, ctx, router]);

    if (!session) return null;

    const routeCoords = session.route || [];
    const hasRoute = routeCoords.length > 0;

    const initialRegion = hasRoute
        ? {
            latitude: routeCoords[0].latitude,
            longitude: routeCoords[0].longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        }
        : {
            latitude: -6.200000,
            longitude: 106.816666,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };

    useEffect(() => {
        if (hasRoute && mapRef.current) {
            // Fit to coordinates with some padding
            mapRef.current.fitToCoordinates(routeCoords, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }
    }, [hasRoute, routeCoords]);

    const onDone = () => {
        router.dismissAll();
        router.replace("/(tabs)/profile");
    };

    return (
        <View style={styles.container}>
            <SharedHeader title="Ringkasan Lari" showBack={false} />

            <View style={styles.content}>
                {/* Map Section */}
                <Animated.View entering={FadeInDown.duration(500)} style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        provider={PROVIDER_DEFAULT}
                        initialRegion={initialRegion}
                        scrollEnabled={true}
                        zoomEnabled={true}
                    >
                        {hasRoute && (
                            <>
                                <Polyline
                                    coordinates={routeCoords}
                                    strokeColor="#B00020" // Red route
                                    strokeWidth={4}
                                />
                                <Marker coordinate={routeCoords[0]} title="Start" pinColor="green" />
                                <Marker
                                    coordinate={routeCoords[routeCoords.length - 1]}
                                    title="Finish"
                                    pinColor="red"
                                />
                            </>
                        )}
                    </MapView>
                    {!hasRoute && (
                        <View style={styles.noMapOverlay}>
                            <Text style={styles.noMapText}>Peta tidak tersedia</Text>
                        </View>
                    )}
                </Animated.View>

                {/* Stats Section */}
                <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.statsCard}>
                    <Text style={styles.dateLabel}>
                        {new Date(session.date).toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{session.distanceKm.toFixed(2)}</Text>
                            <Text style={styles.statLabel}>KM</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>
                                {Math.floor(session.durationSec / 60)}:{String(session.durationSec % 60).padStart(2, '0')}
                            </Text>
                            <Text style={styles.statLabel}>WAKTU</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{formatPace(session.durationSec / 60 / session.distanceKm)}</Text>
                            <Text style={styles.statLabel}>PACE</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Action Button */}
                <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.bottomArea}>
                    <TouchableOpacity style={styles.doneButton} onPress={onDone} activeOpacity={0.8}>
                        <Text style={styles.doneText}>SIMPAN AKTIVITAS</Text>
                        <Ionicons name="checkmark-circle-outline" size={24} color="white" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F6F3" },
    content: { flex: 1 },

    mapContainer: {
        height: Dimensions.get("window").height * 0.45,
        margin: 16,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: "#E0E0E0",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    map: { width: "100%", height: "100%" },
    noMapOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.05)",
        alignItems: "center",
        justifyContent: "center",
    },
    noMapText: { color: "#888", fontWeight: "600" },

    statsCard: {
        backgroundColor: "white",
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
        marginTop: -40, // Overlap map slightly
    },
    dateLabel: {
        textAlign: "center",
        color: "#6B776B",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    statItem: { alignItems: "center", flex: 1 },
    statValue: { fontSize: 28, fontWeight: "900", color: "#2E3A2E" },
    statLabel: { fontSize: 11, fontWeight: "800", color: "#6B776B", marginTop: 4, letterSpacing: 1 },
    divider: { width: 1, height: 40, backgroundColor: "#F0F0F0" },

    bottomArea: {
        padding: 16,
        marginTop: 'auto',
        marginBottom: 20
    },
    doneButton: {
        backgroundColor: '#556B2F',
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#556B2F",
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4
    },
    doneText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1
    }
});
