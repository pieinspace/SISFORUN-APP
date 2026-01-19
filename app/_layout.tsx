import React from "react";
import { Stack } from "expo-router";
import { AppProvider } from "../src/context/AppContext";

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        {/* modal DIHAPUS biar tidak pernah kebuka */}
      </Stack>
    </AppProvider>
  );
}
