import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Modal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  text: { fontSize: 18, fontWeight: "900" },
});
