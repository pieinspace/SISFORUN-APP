import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

interface SharedHeaderProps {
    title: string;
    subtitle?: string;
    centerTitle?: boolean;
    showBack?: boolean;
    rightIcons?: React.ReactNode;
    onBackPress?: () => void;
    darkMode?: boolean;
}

export default function SharedHeader({
    title,
    subtitle,
    centerTitle = false,
    showBack = false,
    rightIcons,
    onBackPress,
    darkMode = false,
}: SharedHeaderProps) {
    const router = useRouter();
    const darkVal = useSharedValue(darkMode ? 1 : 0);

    React.useEffect(() => {
        darkVal.value = withTiming(darkMode ? 1 : 0, { duration: 400 });
    }, [darkMode]);

    const animatedBgStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            darkVal.value,
            [0, 1],
            ['#F5F6F3', '#1A1A1A']
        );
        return { backgroundColor };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            darkVal.value,
            [0, 1],
            ['#2E3A2E', '#FFFFFF']
        );
        return { color };
    });

    const animatedSubStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            darkVal.value,
            [0, 1],
            ['#6B776B', 'rgba(255,255,255,0.6)']
        );
        return { color };
    });

    const animatedIconColor = useAnimatedStyle(() => {
        const color = interpolateColor(
            darkVal.value,
            [0, 1],
            ['#2E3A2E', '#FFFFFF']
        );
        return { color: color };
    });

    return (
        <Animated.View style={[styles.primaryContainer, animatedBgStyle]}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Center Section (Absolute) */}
                    {centerTitle && (
                        <View style={styles.centerContainer} pointerEvents="none">
                            <View style={styles.titleRow}>
                                <Image
                                    source={require('../../assets/images/favicon.png')}
                                    style={styles.logo}
                                />
                                <View style={styles.textContainer}>
                                    <Animated.Text style={[styles.centerTitleText, animatedTextStyle]}>{title}</Animated.Text>
                                    {subtitle && <Animated.Text style={[styles.subtitle, animatedSubStyle]}>{subtitle}</Animated.Text>}
                                </View>
                            </View>
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
                                <AnimatedIonicons name="chevron-back" size={24} style={animatedIconColor} />
                            </TouchableOpacity>
                        )}
                        {!centerTitle && (
                            <View style={styles.titleRow}>
                                <Image
                                    source={require('../../assets/images/favicon.png')}
                                    style={styles.logo}
                                />
                                <View style={styles.textContainer}>
                                    <Animated.Text style={[styles.title, animatedTextStyle]}>{title}</Animated.Text>
                                    {subtitle && <Animated.Text style={[styles.subtitle, animatedSubStyle]}>{subtitle}</Animated.Text>}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Right Section */}
                    <View style={[styles.sideContainer, styles.rightAlign]}>
                        {rightIcons}
                    </View>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    primaryContainer: {
        backgroundColor: '#F5F6F3',
        // Optional shadow/elevation if needed, but keeping it clean for now
        zIndex: 10,
    },
    darkContainer: {
        backgroundColor: '#1A1A1A',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
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
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 36,
        height: 36,
        marginRight: 10,
        resizeMode: 'contain',
    },
    textContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    centerTitleText: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 11,
        color: '#6B776B',
        fontWeight: '600',
    },
    darkText: {
        color: '#FFFFFF',
    },
    darkSubdis: {
        color: 'rgba(255,255,255,0.6)',
    },
});