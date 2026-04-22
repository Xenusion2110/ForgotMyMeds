// app/(tabs)/home/index.js

import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";

import { colors } from "../../../constants/colors";
import { auth } from "../../../services/firebaseConfig";

import { httpsCallable, getFunctions } from "firebase/functions";
// import { getTodayAdherence } from "../../../functions";
const functions = getFunctions();

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [medications, setMedications] = useState([]);
  const [todayAdherence, setTodayAdherence] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try{
      const getUserMedications = httpsCallable(functions, "getUserMedications");
      const medsData = await getUserMedications();
      setMedications(medsData.data || []);

      const getTodayAdherence = httpsCallable(functions, "getTodayAdherence");
      const adherenceData = await getTodayAdherence();
      setTodayAdherence(adherenceData.data || []);

      const getUser = httpsCallable(functions, "getUser");
      const userData = await getUser();
      setUser(userData.data);
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  }

  const onLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/"); // back to app/index.js
    } catch (e) {
      console.log("Logout error:", e);
    }
  };

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
      <View style={styles.container}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>
              Monitor medication adherence
            </Text>
      
            <AddPatient/>
      
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Search patients..."
                style={styles.input}
              />
            </View>

      {/* USER CONTENT */}
            <FlatList
              data={user}
              keyExtractor={(item) => item.id}
              renderItem={renderPatient}
              showsVerticalScrollIndicator={false}
            />

      
      {/* FRIENDS/PATIENT CONTENT */}
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

const AddPatient = ({}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      {/* Button to open modal */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>Add Friend/Family</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Friend/Family</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <Text style={styles.label}>Patient Name *</Text>
            <TextInput placeholder="Full name" style={styles.input} />

            <Text style={styles.label}>Patient Email *</Text>
            <TextInput
              placeholder="patient@email.com"
              style={styles.input}
            />

            <Text style={styles.label}>Date of Birth</Text>
            <TextInput placeholder="mm/dd/yyyy" style={styles.input} />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              placeholder="Allergies, conditions, etc."
              style={[styles.input, styles.textArea]}
              multiline
            />

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.addBtn}>
                <Text style={{ color: "#fff" }}>Add Patient</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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

const user = [
  {
    id: "0",
    name: "John Doe",
    email: "john@example.com",
    meds: 1,
    taken: 1,
    adherence: "100%",
  }
]


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
    padding: 20,
    backgroundColor: "#F9FAFB",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
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
    backgroundColor: colors.primaryEnd,
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

  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  openText: {
    color: "#fff",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  close: {
    fontSize: 18,
  },
  label: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  cancelBtn: {
    padding: 10,
    marginRight: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  addBtn: {
    padding: 10,
    backgroundColor: colors.primaryEnd,
    borderRadius: 8,
  },

  
});
