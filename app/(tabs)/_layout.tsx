import React from "react";
import { Tabs } from "expo-router";
import { View, TouchableOpacity, Text, type GestureResponderEvent } from "react-native";

function CenterPlayButton({
  onPress,
}: {
  onPress?: (event: GestureResponderEvent) => void;
}) {
  return (
    <View
      style={{
        position: "absolute",
        bottom: 18,
        left: 0,
        right: 0,
        alignItems: "center",
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: "#2E3A2E",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "900" }}>
          ▶
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,

        tabBarStyle: {
          height: 78,
          paddingTop: 10,
          paddingBottom: 16,
          backgroundColor: "#F5F6F3",
          borderTopColor: "rgba(0,0,0,0.06)",
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },

        // hanya untuk label, emoji tidak ikut warna
        tabBarActiveTintColor: "#2E3A2E",
        tabBarInactiveTintColor: "#6B776B",
      }}
    >
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>
              🏆
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="tracking"
        options={{
          title: "",
          tabBarButton: (props) => (
            <CenterPlayButton onPress={props.onPress} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>
              👤
            </Text>
          ),
        }}
      />

      {/* kalau file dashboard masih ada, ini biar tidak muncul di tab */}
      <Tabs.Screen name="dashboard" options={{ href: null }} />
    </Tabs>
  );
}
