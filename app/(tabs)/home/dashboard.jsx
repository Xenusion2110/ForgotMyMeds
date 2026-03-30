// app/(tabs)/home/index.js

import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";

import { colors } from "../../../constants/colors";
import { auth } from "../../../services/firebaseConfig";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const onLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/"); // back to app/index.js (your gate)
    } catch (e) {
      console.log("Logout error:", e);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      {/* HEADER */}
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >

        <Text style={styles.headerTitle}>ForgotMyMeds</Text>

        <Pressable onPress={onLogout} hitSlop={10}>
          <Ionicons name="log-out-outline" size={28} color={colors.white} />
        </Pressable>
      </LinearGradient>

      {/* MAIN CONTENT */}
      <View style={styles.content}>
        <Text style={styles.bigText}>Dashboard</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    width: "100%",
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  bigText: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.textDark,
  },

  smallText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textGray,
  },
});