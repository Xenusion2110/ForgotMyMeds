import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import { StyleSheet } from "react-native";

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "900", color: colors.textDark }}>
          Medication
        </Text>
        <MedicationCard/>
      </View>
    </SafeAreaView>
  );
}

const MedicationCard = () => (
  <View style={styles.card}>

    <View style={styles.badge}>
      <Text style={styles.badgeText}></Text>
    </View>

    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>Medicine</Text>

      <Text style={styles.cardMeta}>10 mg</Text>
      <Text style={styles.cardMeta}>Once Daily</Text>
      <Text style={styles.cardMeta}>10:00 AM</Text>

    </View>
  </View>
);

const styles = StyleSheet.create({
card: {
    backgroundColor: "#eee0e0",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
badge: {
      position: "absolute",
      top: 12,
      right: 12,
      backgroundColor: "#e05d5d",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
  },
badgeText: {
      color: colors.white,
      fontWeight: "700",
      fontSize: 12,
  },
cardContent: {
    padding: 50,
  },
cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  cardMeta: {
    fontSize: 14,
    marginBottom: 4,
    color: "#374151",
  },

});