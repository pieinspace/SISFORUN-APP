import { useRouter } from "expo-router";
import React from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppContext } from "../src/context/AppContext";

function formatPace(pace: number): string {
    if (pace <= 0) return "-";
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function HistoryScreen() {
    const router = useRouter();
    const ctx = React.useContext(AppContext);

    if (!ctx) return null;

    const { runHistory } = ctx;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>RIWAYAT LARI</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* List */}
            {runHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Belum ada riwayat lari</Text>
                    <Text style={styles.emptySubtext}>Mulai lari untuk melihat riwayat</Text>
                </View>
            ) : (
                <FlatList
                    data={runHistory}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item, index }) => {
                        const pace = item.durationSec > 0 && item.distanceKm > 0
                            ? (item.durationSec / 60) / item.distanceKm
                            : 0;

                        return (
                            <Animated.View
                                entering={FadeInDown.delay(index * 50).duration(300)}
                                style={styles.card}
                            >
                                <View style={styles.cardHeader}>
                                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                                </View>

                                <View style={styles.statsRow}>
                                    {/* Distance */}
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{item.distanceKm.toFixed(2)}</Text>
                                        <Text style={styles.statLabel}>KM</Text>
                                    </View>

                                    {/* Divider */}
                                    <View style={styles.divider} />

                                    {/* Pace */}
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{formatPace(pace)}</Text>
                                        <Text style={styles.statLabel}>PACE / KM</Text>
                                    </View>

                                    {/* Divider */}
                                    <View style={styles.divider} />

                                    {/* Duration */}
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>
                                            {Math.floor(item.durationSec / 60)}:{(item.durationSec % 60).toString().padStart(2, "0")}
                                        </Text>
                                        <Text style={styles.statLabel}>DURASI</Text>
                                    </View>
                                </View>
                            </Animated.View>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F0",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: "#F5F5F0",
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    backText: {
        fontSize: 28,
        color: "#3D4A3E",
        marginTop: -2,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#3D4A3E",
        letterSpacing: 1,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        marginBottom: 16,
    },
    dateText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7C6B",
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    statValue: {
        fontSize: 22,
        fontWeight: "700",
        color: "#3D4A3E",
    },
    statLabel: {
        fontSize: 11,
        color: "#8B998B",
        marginTop: 4,
        letterSpacing: 0.5,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: "#E8E8E0",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#3D4A3E",
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#8B998B",
        textAlign: "center",
    },
});
