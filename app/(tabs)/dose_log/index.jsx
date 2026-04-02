import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 10, backgroundColor: colors.background }}>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dose Log</Text>
          <Text style={styles.subtitle}>
            Track your daily medication intake
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Text>+ Log Dose</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={{ color: "#fff" }}>Generate Today's Doses</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Card */}
      <View style={styles.dateCard}>
        <Text style={styles.date}>Wednesday, April 1</Text>
        <Text style={styles.progressText}>2/5 doses taken</Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "40%" }]} />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={doses}
        keyExtractor={(item) => item.id}
        renderItem={renderDose}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
    </SafeAreaView>
  );
}

const renderDose = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.time}>{item.time}</Text>
          <Text style={styles.name}>{item.name}</Text>
        </View>

        <View style={styles.actions}>
          {item.status === "missed" && (
            <View style={styles.badgeMissed}>
              <Text style={styles.badgeText}>✕ Missed</Text>
            </View>
          )}

          {item.status === "taken" && (
            <View style={styles.badgeTakenLight}>
              <Text style={styles.badgeText}>✓ Taken</Text>
            </View>
          )}

          {item.status === "pending" && (
            <View style={styles.actionRow}>
              <TouchableOpacity>
                <Text style={styles.skip}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.missed}>Missed</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.takenBtn}>
                <Text style={styles.takenText}>✓ Taken</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      
    );
  };

const doses = [
  { id: "1", time: "07:00", name: "Omeprazole", status: "missed" },
  { id: "2", time: "07:00", name: "Omeprazole", status: "pending" },
  { id: "3", time: "08:00", name: "Lisinopril", status: "taken" },
  { id: "4", time: "08:00", name: "Lisinopril", status: "pending" },
  { id: "5", time: "08:00", name: "Metformin", status: "taken" },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    padding: 16,
  },

  header: {
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: 4,
  },

  headerButtons: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },

  primaryBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  secondaryBtn: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  dateCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },

  date: {
    fontWeight: "600",
    fontSize: 16,
  },

  progressText: {
    color: "#6b7280",
    marginVertical: 6,
  },

  progressBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  time: {
    fontWeight: "bold",
    fontSize: 16,
  },

  name: {
    fontSize: 16,
  },

  actions: {
    marginTop: 10,
    alignItems: "flex-end",
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  skip: {
    color: "#6b7280",
  },

  missed: {
    color: "#ef4444",
  },

  takenBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  takenText: {
    color: "#fff",
  },

  badgeMissed: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeTakenLight: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 12,
  },
});
