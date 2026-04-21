import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import {useState} from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

const COLORS = ['#4A90E2', '#6FCF97', '#9B51E0', '#F2994A', '#EB5757', '#E573A3'];

export default function App() {
  return (
    <SafeAreaView style={{ flex: 10, backgroundColor: colors.background }}>
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Medications</Text>
      <Text style={styles.subtitle}>Manage all your medications</Text>

      <AddMedication/>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          placeholder="Search medications..."
          style={styles.searchInput}
        />
      </View>

      {/* Medication Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>M</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.medName}>Medicine</Text>
            <Text style={styles.medDose}>10mg</Text>

            <View style={styles.row}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Once daily</Text>
              </View>

              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.timeText}>8:00 AM</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
    </SafeAreaView>
  );
}

const AddMedication = ({}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  return (
    <View>
      {/* Button to open modal */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Add Medication</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Patient</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
          {/* Medication Name */}
          <Text style={styles.label}>Medication Name *</Text>
          <TextInput
            placeholder="e.g. Aspirin"
            placeholderTextColor="#999"
            style={styles.input}
          />

          {/* Dosage */}
          <Text style={styles.label}>Dosage *</Text>
          <TextInput
            placeholder="e.g. 500mg"
            placeholderTextColor="#999"
            style={styles.input}
          />

          {/* Frequency */}
          <Text style={styles.label}>Frequency *</Text>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>Once daily</Text>
            <Text style={styles.dropdownArrow}>⌄</Text>
          </TouchableOpacity>

          {/* Color Tag */}
          <Text style={styles.label}>Color Tag</Text>
          <View style={styles.colorRow}>
            {COLORS.map((color) => {
              const isSelected = color === selectedColor;
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    isSelected && styles.selectedCircle,
                  ]}
                />
              );
            })}
          </View>
          {/* Time Slots */}
          <Text style={styles.label}>Time Slots</Text>

          <View style={styles.timeBox}>
            <Text style={styles.timeText}>Morning</Text>
            <Text style={styles.clockIcon}>🕒</Text>
          </View>

          <TouchableOpacity style={styles.addTimeBtn}>
            <Text style={styles.addIcon}>＋</Text>
            <Text style={styles.addTimeText}>Add Time</Text>
          </TouchableOpacity>
        </ScrollView>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryEnd,
    padding: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: {
    color: "#2f80ed",
    fontWeight: "700",
    fontSize: 18,
  },
  medName: {
    fontSize: 16,
    fontWeight: "700",
  },
  medDose: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  badge: {
    backgroundColor: "#34c759",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#666",
  },
  note: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2d79db",
    marginRight: 6,
  },
  footerText: {
    fontSize: 12,
    color: "#666",
  },

  overlay: {
    flex: 1,
    backgroundColor: '#EDEDED',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#F7F7F7',
    borderRadius: 20,
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  close: {
    fontSize: 20,
    color: '#666',
  },

  label: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },

  input: {
    backgroundColor: '#EFEFEF',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
  },

  dropdown: {
    backgroundColor: '#EFEFEF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#666',
  },

  colorRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  selectedCircle: {
    borderWidth: 3,
    borderColor: '#2F80ED',
  },

  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFEFEF',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    width: 160,
  },
  timeText: {
    fontSize: 16,
  },
  clockIcon: {
    fontSize: 16,
  },

  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#EFEFEF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  addIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  addTimeText: {
    fontSize: 14,
  },
  
});
