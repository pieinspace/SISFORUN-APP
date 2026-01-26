import SharedHeader from "@/src/components/SharedHeader";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
    const router = useRouter();

    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confPass, setConfPass] = useState("");

    const onSave = () => {
        if (!oldPass || !newPass || !confPass) {
            Alert.alert("Error", "Semua kolom wajib diisi");
            return;
        }
        if (newPass !== confPass) {
            Alert.alert("Error", "Password baru tidak sama");
            return;
        }
        if (newPass.length < 6) {
            Alert.alert("Error", "Password minimal 6 karakter");
            return;
        }

        // In a real app, we would call API here.
        Alert.alert("Sukses", "Password berhasil diubah", [
            { text: "OK", onPress: () => router.back() }
        ]);
    };

    return (
        <View style={styles.container}>
            <SharedHeader title="Pengaturan" showBack={true} centerTitle={true} />

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.title}>Ubah Password</Text>

                    <Text style={styles.label}>Password Lama</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        value={oldPass}
                        onChangeText={setOldPass}
                        placeholder="Masukkan password lama"
                    />

                    <Text style={styles.label}>Password Baru</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        value={newPass}
                        onChangeText={setNewPass}
                        placeholder="Minimal 6 karakter"
                    />

                    <Text style={styles.label}>Konfirmasi Password Baru</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        value={confPass}
                        onChangeText={setConfPass}
                        placeholder="Ulangi password baru"
                    />

                    <TouchableOpacity style={styles.btn} onPress={onSave} activeOpacity={0.8}>
                        <Text style={styles.btnText}>Simpan Perubahan</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F6F3" },
    content: { padding: 16 },
    card: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    title: { fontSize: 18, fontWeight: "900", color: "#2E3A2E", marginBottom: 20 },

    label: { fontSize: 13, fontWeight: "700", color: "#2E3A2E", marginBottom: 6, marginTop: 12 },
    input: {
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        backgroundColor: "#FCFCFC"
    },

    btn: {
        backgroundColor: "#2E3A2E",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 24,
    },
    btnText: { color: "white", fontWeight: "800", fontSize: 14 }
});
