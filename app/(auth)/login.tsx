import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { AppContext } from "../../src/context/AppContext";

export default function LoginScreen() {
  const router = useRouter();
  const ctx = useContext(AppContext);

  const [nrp, setNrp] = useState("");
  const [password, setPassword] = useState("");

  // notif inline
  const [nrpError, setNrpError] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // loading state biar gak double klik
  const [loading, setLoading] = useState(false);

  // animasi shake
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const doShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
  };

  const onLogin = async () => {
    const cleanNrp = nrp.trim();
    const cleanPass = password;

    setNrpError(null);
    setPassError(null);

    // validasi basic
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

    if (!ctx) {
      Alert.alert("Error", "AppContext belum siap. Coba reload.");
      return;
    }

    try {
      setLoading(true);

      // ✅ role diambil dari backend (DB), bukan dari pilihan user
      await ctx.login({ nrp: cleanNrp, password: cleanPass });

      // Langsung pindah ke profile tanpa Alert biar cepat
      router.replace("/(tabs)/profile");
    } catch (e: any) {
      doShake();
      Alert.alert("Login gagal", e?.message ?? "Terjadi kesalahan saat login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(450)} style={styles.header}>
        <View style={styles.logoCircle}>
          <Image
            source={require("../../assets/images/favicon.png")}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>SISFORUN</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500)} style={[styles.cardWrap, shakeStyle]}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Masuk</Text>

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
            editable={!loading}
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
            editable={!loading}
          />
          {!!passError && <Text style={styles.errorInline}>{passError}</Text>}

          <TouchableOpacity
            style={[styles.btn, loading ? styles.btnDisabled : null]}
            onPress={onLogin}
            activeOpacity={0.9}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? "Memproses..." : "Masuk →"}</Text>
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
  appName: { marginTop: 10, fontSize: 18, fontWeight: "900", color: "#2E3A2E" },

  cardWrap: { width: "100%", maxWidth: 420 },
  card: { width: "100%", backgroundColor: "white", borderRadius: 18, padding: 16 },

  cardTitle: { fontSize: 16, fontWeight: "900", color: "#2E3A2E", marginBottom: 10 },

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
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: { color: "white", fontWeight: "800", fontSize: 14 },

  terms: { fontSize: 11, color: "#6B776B", marginTop: 12, textAlign: "center" },
});
