// app/(tabs)/home/index.js

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
        <StatCard
          title="Active Medication"
          value="0%"
          subtitle="today"
          icon="calendar-outline"
          color={{ bg: "#e0e7ff", icon: "#3b82f6" }}
        />
        <StatCard
          title="Taken Today"
          value="0%"
          subtitle="today"
          icon="calendar-outline"
          color={{ bg: "#e0e7ff", icon: "#3b82f6" }}
        />
        <StatCard
          title="Missed Today"
          value="0"
          subtitle="doses"
          icon="warning-outline"
          color={{ bg: "#fee2e2", icon: "#ef4444" }}
        />
      </View>

    </SafeAreaView>
  );
}

const StatCard = ({ title, value, subtitle, icon, color }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>

        <View style={[styles.iconWrapper, { backgroundColor: color.bg }]}>
          <Ionicons name={icon} size={20} color={color.icon} />
        </View>
      </View>

      <Text style={styles.value}>{value}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};


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
    gap: 10,
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
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    padding: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,

    // Shadow (iOS)
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },

    // Shadow (Android)
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 14,
    color: "#6b7280",
  },

  iconWrapper: {
    padding: 8,
    borderRadius: 10,
  },

  value: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 10,
  },

  subtitle: {
    marginTop: 4,
    color: "#6b7280",
  },

});
