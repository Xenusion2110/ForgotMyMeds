import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import { Ionicons, Feather } from "@expo/vector-icons";

const patients = [
  {
    id: "1",
    name: "Mary Johnson",
    email: "mary@example.com",
    meds: 2,
    taken: 0,
    adherence: "0%",
  },
  {
    id: "2",
    name: "John Smith",
    email: "john@example.com",
    meds: 2,
    taken: 0,
    adherence: "0%",
  },
];

export default function App() {
  const renderPatient = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={20} color="#3B82F6" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      <View style={styles.divider} />

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Feather name="link" size={16} color="#3B82F6" />
          <Text style={styles.statValue}>{item.meds}</Text>
          <Text style={styles.statLabel}>Medications</Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
          <Text style={styles.statValue}>
            {item.taken}/{item.meds}
          </Text>
          <Text style={styles.statLabel}>Taken Today</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#EF4444" }]}>
            {item.adherence}
          </Text>
          <Text style={styles.statLabel}>Adherence</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 10, backgroundColor: colors.background }}>
    <View style={styles.container}>
      <Text style={styles.title}>Caregiver View</Text>
      <Text style={styles.subtitle}>
        Monitor your patients' medication adherence
      </Text>

      <TouchableOpacity style={styles.button}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.buttonText}>Add Patient</Text>
      </TouchableOpacity>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          placeholder="Search patients..."
          style={styles.input}
        />
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        renderItem={renderPatient}
        showsVerticalScrollIndicator={false}
      />
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: "#6B7280",
    marginBottom: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  input: {
    marginLeft: 8,
    flex: 1,
    height: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  name: {
    fontWeight: "600",
    fontSize: 16,
  },
  email: {
    color: "#6B7280",
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontWeight: "700",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
});
