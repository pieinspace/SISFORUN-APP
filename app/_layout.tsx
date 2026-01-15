import React, { useContext, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { AppProvider, AppContext } from "../src/context/AppContext";

function Gate() {
  const ctx = useContext(AppContext);
  const router = useRouter();

  useEffect(() => {
    if (!ctx) return;
    if (ctx.isLoggedIn) router.replace("/(tabs)/dashboard");
    else router.replace("/(auth)/login");
  }, [ctx?.isLoggedIn]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <Gate />
    </AppProvider>
  );
}
