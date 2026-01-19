import { Redirect } from "expo-router";
import React, { useContext } from "react";
import { AppContext } from "../src/context/AppContext";

export default function Index() {
  const ctx = useContext(AppContext);
  if (!ctx) return null;

  return ctx.isLoggedIn
    ? <Redirect href="/(tabs)/tracking" />
    : <Redirect href="/(auth)/login" />;
}
