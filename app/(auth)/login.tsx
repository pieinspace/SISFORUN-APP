import React, { useContext, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { AppContext } from "../../src/context/AppContext";
import type { UserRole } from "../../src/types/app";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// Mock akun demo (NRP + password)
const MOCK_ACCOUNTS = [
  { nrp: "12345678", password: "password123" },
  { nrp: "20231234", password: "sisforun123" },
  { nrp: "77777777", password: "larikuat1" },
];

export default function LoginScreen() {
  const router = useRouter();
  const ctx = useContext(AppContext);

  const [nrp, setNrp] = useState("");
  const [password, setPassword] = useState("");

  // untuk notif inline
  const [nrpError, setNrpError] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // animasi shake
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const demoText = useMemo(
    () => MOCK_ACCOUNTS.map((a) => `• NRP: ${a.nrp} | Pass: ${a.password}`).join("\n"),
    []
  );

  const doShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
  };

  const onLogin = () => {
    const cleanNrp = nrp.trim();
    const cleanPass = password;

    setNrpError(null);
    setPassError(null);

    if (!cleanNrp || !cleanPass) {
      if (!cleanNrp) setNrpError("NRP wajib diisi");
      if (!cleanPass) setPassError("Password wajib diisi");
      doShake();
      Alert.alert("Login gagal", "NRP dan password wajib diisi");
      return;
    }

    if (!/^[0-9]+$/.test(cleanNrp)) {
      setNrpError("NRP harus berupa angka");
      doShake();
      Alert.alert("Login gagal", "NRP harus berupa angka");
      return;
    }

    if (cleanPass.length < 6) {
      setPassError("Password minimal 6 karakter");
      doShake();
      Alert.alert("Login gagal", "Password minimal 6 karakter");
      return;
    }

    const found = MOCK_ACCOUNTS.find((a) => a.nrp === cleanNrp);
    if (!found) {
      setNrpError("NRP tidak terdaftar");
      doShake();
      Alert.alert("Login gagal", "NRP tidak terdaftar");
      return;
    }

    if (found.password !== cleanPass) {
      // ✅ INI YANG KAMU MINTA: notif password salah
      setPassError("Password salah");
      doShake();
      Alert.alert("Login gagal", "Password salah");
      return;
    }

    if (!ctx) {
      Alert.alert("Error", "AppContext belum siap. Coba reload.");
      return;
    }

    const payload = {
      email: `${cleanNrp}@sisforun.local`,
      password: cleanPass,
      role: "pns" as UserRole,
    };

    try {
      ctx.login(payload);
      Alert.alert("Login berhasil", "Selamat datang!");
      router.replace("/(tabs)/tracking");
    } catch (e: any) {
      doShake();
      Alert.alert("Login gagal", e?.message ?? "Terjadi kesalahan saat login.");
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(450)} style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>P</Text>
        </View>
        <Text style={styles.appName}>SISFORUN</Text>
        <Text style={styles.sub}>Tracking Lari Profesional</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(500)}
        style={[styles.cardWrap, shakeStyle]}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Masuk</Text>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Akun Demo</Text>
            <Text style={styles.demoText}>{demoText}</Text>
          </View>

          <Text style={styles.label}>NRP</Text>
          <TextInput
            value={nrp}
            onChangeText={(t) => {
              setNrp(t);
              if (nrpError) setNrpError(null);
            }}
            placeholder="Masukkan NRP"
            keyboardType="numeric"
            style={[styles.input, nrpError ? styles.inputError : null]}
          />
          {!!nrpError && <Text style={styles.errorInline}>{nrpError}</Text>}

          <Text style={[styles.label, { marginTop: 10 }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (passError) setPassError(null);
            }}
            placeholder="Minimal 6 karakter"
            secureTextEntry
            style={[styles.input, passError ? styles.inputError : null]}
          />
          {!!passError && <Text style={styles.errorInline}>{passError}</Text>}

          <TouchableOpacity style={styles.btn} onPress={onLogin} activeOpacity={0.9}>
            <Text style={styles.btnText}>Masuk →</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>Dengan masuk, Anda menyetujui syarat & ketentuan SISFORUN</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F3",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  header: { alignItems: "center", marginBottom: 14 },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 99,
    backgroundColor: "#2E3A2E",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "white", fontWeight: "900", fontSize: 26 },
  appName: { marginTop: 10, fontSize: 18, fontWeight: "900", color: "#2E3A2E" },
  sub: { fontSize: 12, color: "#6B776B", marginTop: 4 },

  cardWrap: { width: "100%", maxWidth: 420 },
  card: { width: "100%", backgroundColor: "white", borderRadius: 18, padding: 16 },

  cardTitle: { fontSize: 16, fontWeight: "900", color: "#2E3A2E", marginBottom: 10 },

  demoBox: { backgroundColor: "#F3F4F1", borderRadius: 12, padding: 10, marginBottom: 12 },
  demoTitle: { fontSize: 12, fontWeight: "900", color: "#2E3A2E", marginBottom: 6 },
  demoText: { fontSize: 11, color: "#4C5A4C", fontWeight: "700", lineHeight: 16 },

  label: { fontSize: 12, fontWeight: "700", color: "#2E3A2E", marginBottom: 4 },

  input: {
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "white",
  },
  inputError: { borderColor: "#B00020" },
  errorInline: { marginTop: 6, fontSize: 12, color: "#B00020", fontWeight: "700" },

  btn: {
    backgroundColor: "#2E3A2E",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },
  btnText: { color: "white", fontWeight: "800", fontSize: 14 },

  terms: { fontSize: 11, color: "#6B776B", marginTop: 12, textAlign: "center" },
});
