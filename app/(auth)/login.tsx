import React, { useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { AppContext } from "../../src/context/AppContext";
import type { UserRole } from "../../src/types/app";

// Mock akun demo (NRP + password)
const MOCK_ACCOUNTS = [
  { nrp: "12345678", password: "password123" },
  { nrp: "20231234", password: "sisforun123" },
  { nrp: "77777777", password: "larikuat1" }, // min 6
];

export default function LoginScreen() {
  const router = useRouter();
  const ctx = useContext(AppContext);

  const [nrp, setNrp] = useState("");
  const [password, setPassword] = useState("");

  const demoText = useMemo(
    () =>
      MOCK_ACCOUNTS.map((a) => `• NRP: ${a.nrp} | Pass: ${a.password}`).join(
        "\n"
      ),
    []
  );

  const onLogin = () => {
    const cleanNrp = nrp.trim();
    const cleanPass = password;

    // validasi form
    if (!cleanNrp || !cleanPass) {
      Alert.alert("Login gagal", "NRP dan password wajib diisi");
      return;
    }

    if (!/^[0-9]+$/.test(cleanNrp)) {
      Alert.alert("Login gagal", "NRP harus berupa angka");
      return;
    }

    if (cleanPass.length < 6) {
      Alert.alert("Login gagal", "Password minimal 6 karakter");
      return;
    }

    // cek akun mock
    const found = MOCK_ACCOUNTS.find((a) => a.nrp === cleanNrp);
    if (!found) {
      Alert.alert("Login gagal", "NRP tidak terdaftar");
      return;
    }

    if (found.password !== cleanPass) {
      Alert.alert("Login gagal", "Password salah");
      return;
    }

    if (!ctx) {
      Alert.alert("Error", "AppContext belum siap. Coba reload.");
      return;
    }

    // ✅ ikut AppContext: login({email, password, role})
    // NRP kita ubah jadi email dummy
    const payload = {
      email: `${cleanNrp}@sisforun.local`,
      password: cleanPass,
      role: "pns" as UserRole, // aman karena di AppContext kamu memang cek "pns"
    };

    try {
      ctx.login(payload);
      Alert.alert("Login berhasil", `Selamat datang!`);
      router.replace("/(tabs)/tracking");
    } catch (e: any) {
      Alert.alert("Login gagal", e?.message ?? "Terjadi kesalahan saat login.");
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

        <Text style={styles.label}>NRP</Text>
        <TextInput
          value={nrp}
          onChangeText={setNrp}
          placeholder="Masukkan NRP"
          keyboardType="numeric"
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

        <TouchableOpacity style={styles.btn} onPress={onLogin} activeOpacity={0.9}>
          <Text style={styles.btnText}>Masuk →</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          Dengan masuk, Anda menyetujui syarat & ketentuan SISFORUN
        </Text>
      </View>
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

  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 99,
    backgroundColor: "#2E3A2E",
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    color: "white",
    fontWeight: "900",
    fontSize: 26,
  },

  appName: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "900",
    color: "#2E3A2E",
  },

  sub: {
    fontSize: 12,
    color: "#6B776B",
    marginTop: 4,
    marginBottom: 16,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2E3A2E",
    marginBottom: 10,
  },

  demoBox: {
    backgroundColor: "#F3F4F1",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2E3A2E",
    marginBottom: 6,
  },
  demoText: {
    fontSize: 11,
    color: "#4C5A4C",
    fontWeight: "700",
    lineHeight: 16,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E3A2E",
    marginBottom: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: "white",
  },

  btn: {
    backgroundColor: "#2E3A2E",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },

  btnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 14,
  },

  terms: {
    fontSize: 11,
    color: "#6B776B",
    marginTop: 12,
    textAlign: "center",
  },
});
