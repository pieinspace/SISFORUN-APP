import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SharedHeaderProps {
    title: string;
    subtitle?: string;
    centerTitle?: boolean;
    showBack?: boolean;
    rightIcons?: React.ReactNode;
    onBackPress?: () => void;
}

export default function SharedHeader({
    title,
    subtitle,
    centerTitle = false,
    showBack = false,
    rightIcons,
    onBackPress,
}: SharedHeaderProps) {
    const router = useRouter();

    return (
        <View style={styles.primaryContainer}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Center Section (Absolute) */}
                    {centerTitle && (
                        <View style={styles.centerContainer} pointerEvents="none">
                            <Text style={styles.centerTitleText}>{title}</Text>
                            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                        </View>
                    )}

                    {/* Left Section */}
                    <View style={styles.sideContainer}>
                        {showBack && (
                            <TouchableOpacity
                                onPress={onBackPress || (() => router.back())}
                                style={styles.backButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="chevron-back" size={24} color="#2E3A2E" />
                            </TouchableOpacity>
                        )}
                        {!centerTitle && (
                            <View>
                                <Text style={styles.title}>{title}</Text>
                                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                            </View>
                        )}
                    </View>

                    {/* Right Section */}
                    <View style={[styles.sideContainer, styles.rightAlign]}>
                        {rightIcons}
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    primaryContainer: {
        backgroundColor: '#F5F6F3',
        // Optional shadow/elevation if needed, but keeping it clean for now
        zIndex: 10,
    },
    safeArea: {
        // backgroundColor: '#F5F6F3', 
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 54, // slightly taller for better touch targets
    },
    sideContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 50, // Ensure buttons are on top
    },
    rightAlign: {
        justifyContent: 'flex-end',
    },
    centerContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    backButton: {
        marginRight: 8,
        padding: 4,
        minWidth: 40,
        minHeight: 40,
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#2E3A2E',
    },
    centerTitleText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#2E3A2E',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 11,
        color: '#6B776B',
        fontWeight: '600',
    },
});