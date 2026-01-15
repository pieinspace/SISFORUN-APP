import React, { useContext, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { AppContext } from "../../src/context/AppContext";
import { UserRole } from "../../src/types/app";

export default function LoginScreen() {
  const ctx = useContext(AppContext);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("militer");

  if (!ctx) return null;

  const onLogin = () => {
    try {
      ctx.login({ email, password, role });
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      Alert.alert("Login gagal", e?.message ?? "Terjadi kesalahan.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>P</Text>
      </View>

      <Text style={styles.appName}>SISFORUN</Text>
      <Text style={styles.sub}>Tracking Lari Profesional</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Masuk</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="nama@email.com"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Minimal 6 karakter"
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.btn} onPress={onLogin}>
          <Text style={styles.btnText}>Masuk →</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>Dengan masuk, Anda menyetujui syarat & ketentuan SISFORUN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F3", alignItems: "center", padding: 16, justifyContent: "center" },
  logoCircle: { width: 70, height: 70, borderRadius: 99, backgroundColor: "#2E3A2E", alignItems: "center", justifyContent: "center" },
  logoText: { color: "white", fontWeight: "900", fontSize: 26 },
  appName: { marginTop: 10, fontSize: 18, fontWeight: "900", color: "#2E3A2E" },
  sub: { fontSize: 12, color: "#6B776B", marginTop: 4, marginBottom: 16 },

  card: { width: "100%", maxWidth: 420, backgroundColor: "white", borderRadius: 18, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#2E3A2E", marginBottom: 10 },

  label: { fontSize: 12, fontWeight: "700", color: "#2E3A2E", marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: "#F3F4F1", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, color: "#2E3A2E" },

  roleRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  roleBtn: { flex: 1, borderWidth: 1, borderColor: "#D5D9D0", padding: 10, borderRadius: 12, backgroundColor: "white" },
  roleBtnActive: { borderColor: "#2E3A2E", backgroundColor: "#EEF0EB" },
  roleText: { textAlign: "center", fontSize: 12, fontWeight: "800", color: "#6B776B" },
  roleTextActive: { color: "#2E3A2E" },

  btn: { marginTop: 14, backgroundColor: "#2E3A2E", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnText: { color: "white", fontWeight: "900" },

  terms: { marginTop: 12, fontSize: 11, color: "#6B776B", textAlign: "center" },
});
