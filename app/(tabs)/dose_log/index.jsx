import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import { Picker } from "@react-native-picker/picker";


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
          <LogDose/>
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

      <MedicineChecklist/>
    </View>
    </SafeAreaView>
  );
}

const initialData = {
  Morning: [
    { id: "1", name: "Vitamin C", taken: false },
    { id: "2", name: "Blood Pressure Pill", taken: false },
  ],
  Afternoon: [
    { id: "3", name: "Antibiotic", taken: false },
  ],
  Night: [
    { id: "4", name: "Melatonin", taken: false },
    { id: "5", name: "Pain Reliever", taken: false },
  ],
};

const MedicineChecklist = ({}) => {
  const [meds, setMeds] = useState(initialData);

  const toggleTaken = (section, id) => {
    const updatedSection = meds[section].map((item) =>
      item.id === id ? { ...item, taken: !item.taken } : item
    );

    setMeds({ ...meds, [section]: updatedSection });
  };

  const renderItem = (section) => ({ item }) => (
    <TouchableOpacity
      style={[
        styles2.item,
        item.taken && styles2.itemTaken
      ]}
      onPress={() => toggleTaken(section, item.id)}
    >
      <Text style={styles2.text}>
        {item.taken ? "✅ " : "⬜ "} {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSection = (title) => (
    <View style={styles2.section}>
      <Text style={styles2.header}>{title}</Text>
      <FlatList
        data={meds[title]}
        keyExtractor={(item) => item.id}
        renderItem={renderItem(title)}
      />
    </View>
  );

  return (
    <View style={styles2.container}>
      {renderSection("Morning")}
      {renderSection("Afternoon")}
      {renderSection("Night")}
    </View>
  );
}


const LogDose = ({onClose}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [medication, setMedication] = useState("");
  const [time, setTime] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  return (
    <View style={styles3.headerButtons}>
      {/* Button to open modal */}
      <TouchableOpacity
        style={styles3.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles3.buttonText}>Add Dose</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
      <View style={styles3.overlay}>
        <View style={styles3.container}>
          {/* Header */}
          <View style={styles3.header}>
            <Text style={styles3.title}>Log a Dose</Text>
          </View>

          {/* Medication */}
          <Text style={styles3.label}>Medication</Text>
          <View style={styles3.dropdown}>
            <Picker
              selectedValue={medication}
              onValueChange={(itemValue) => setMedication(itemValue)}
            >
              <Picker.Item label="Select Medication" value="" />
              <Picker.Item label="Aspirin" value="aspirin" />
              <Picker.Item label="Ibuprofen" value="ibuprofen" />
            </Picker>
          </View>

          <Text style={styles3.label}>Time</Text>
          <View style={styles3.dropdown}>
            <Picker
              selectedValue={time}
              onValueChange={(itemValue) => setTime(itemValue)}
            >
              <Picker.Item label="Select Time" value="" />
              <Picker.Item label="Morning" value="morning" />
              <Picker.Item label="Afternoon" value="afternoon" />
              <Picker.Item label="Night" value="night" />
            </Picker>
          </View>

          {/* Buttons */}
          <TouchableOpacity style={styles3.primaryButton}>
            <Text style={styles3.primaryText}>Log Dose</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles3.secondaryButton} onPress={() => setModalVisible(false)}>
            <Text style={styles3.secondaryText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </View>
  );
}

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
    backgroundColor: colors.primaryEnd,
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

const styles2 = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  section: {
    marginBottom: 25,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  item: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  itemTaken: {
    backgroundColor: "#d4edda",
  },
  text: {
    fontSize: 16,
  },
});

const styles3 = StyleSheet.create({
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
    fontSize: 18,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.primaryEnd,
    borderRadius: 3,
    overflow: "hidden",
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    color: "#333",
  },
  primaryButton: {
    backgroundColor: colors.primaryEnd,
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#f2f2f2",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  secondaryText: {
    color: "#333",
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

})
