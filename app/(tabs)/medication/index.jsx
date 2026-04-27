import React, { useCallback, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { callFunction } from "../../../services/firebaseConfig";

const DOSAGE_UNITS = ["mg", "mcg", "g", "ml", "IU", "%", "other"];
const SCHEDULES = [
  { key: "takesMorning", label: "Morning" },
  { key: "takesAfternoon", label: "Afternoon" },
  { key: "takesEvening", label: "Evening" },
];

const COLORS = {
  bg: "#9bec82",
  surface: "#ffffff",
  surfaceAlt: "#e8ebe8",
  border: "#30363D",
  accent: "#3FB950",
  accentDim: "#238636",
  accentGlow: "rgba(63,185,80,0.15)",
  accentBlue: "#58A6FF",
  accentBlueDim: "rgba(88,166,255,0.15)",
  danger: "#F85149",
  dangerDim: "rgba(248,81,73,0.15)",
  text: "#000000",
  textMuted: "#8B949E",
  textDim: "#484F58",
  white: "#FFFFFF",
};

const scheduleSummary = (item) => {
  const labels = SCHEDULES.filter((slot) => item[slot.key]).map((slot) => slot.label);
  return labels.join(", ");
};

const Label = ({ children }) => <Text style={styles.label}>{children}</Text>;
const FieldBox = ({ children }) => <View style={styles.fieldBox}>{children}</View>;

const DosageUnitPicker = ({ value, onChange }) => (
  <View style={styles.unitRow}>
    {DOSAGE_UNITS.map((unit) => (
      <TouchableOpacity
        key={unit}
        style={[styles.unitChip, value === unit && styles.unitChipActive]}
        onPress={() => onChange(unit)}
        activeOpacity={0.7}
      >
        <Text style={[styles.unitText, value === unit && styles.unitTextActive]}>
          {unit}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const SchedulePicker = ({ value, onToggle }) => (
  <View style={styles.scheduleRow}>
    {SCHEDULES.map((slot) => (
      <TouchableOpacity
        key={slot.key}
        style={[
          styles.scheduleChip,
          value[slot.key] && styles.scheduleChipActive,
        ]}
        onPress={() => onToggle(slot.key)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.scheduleText,
            value[slot.key] && styles.scheduleTextActive,
          ]}
        >
          {slot.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const MedicationCard = ({ item, onDelete, deleting }) => (
  <View style={styles.medCard}>
    <View style={styles.medCardHeader}>
      <View style={styles.medCardTitleRow}>
        <Text style={styles.medCardName}>{item.name}</Text>
        <View style={styles.dosagePill}>
          <Text style={styles.dosagePillText}>{item.dose}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item.id)}
        activeOpacity={0.7}
        disabled={deleting}
      >
        <Text style={styles.deleteBtnText}>{deleting ? "..." : "X"}</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.divider} />

    <Text style={styles.metaLine}>Bottle quantity: {item.capsuleQuantity}</Text>
    <Text style={styles.metaLine}>
      Schedule: {scheduleSummary(item) || "Not scheduled"}
    </Text>
    {item.notes ? <Text style={styles.metaLine}>Notes: {item.notes}</Text> : null}
  </View>
);

export default function MedicationScreen() {
  const [name, setName] = useState("");
  const [dosageAmount, setDosageAmount] = useState("");
  const [dosageUnit, setDosageUnit] = useState("mg");
  const [quantity, setQuantity] = useState("");
  const [schedule, setSchedule] = useState({
    takesMorning: false,
    takesAfternoon: false,
    takesEvening: false,
  });
  const [search, setSearch] = useState("");
  const [medications, setMedications] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const loadMedications = useCallback(async () => {
    setLoading(true);

    try {
      const response = await callFunction("getAllMedications", {}, { forceRefresh: true });
      setMedications(response.data || []);
    } catch (err) {
      console.error("Medication load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [loadMedications])
  );

  const clearForm = () => {
    setName("");
    setDosageAmount("");
    setDosageUnit("mg");
    setQuantity("");
    setSchedule({
      takesMorning: false,
      takesAfternoon: false,
      takesEvening: false,
    });
    setErrors({});
  };

  const validate = () => {
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Medication name is required.";
    }

    if (!dosageAmount.trim()) {
      nextErrors.dosageAmount = "Dosage amount is required.";
    } else if (Number.isNaN(Number(dosageAmount)) || Number(dosageAmount) <= 0) {
      nextErrors.dosageAmount = "Enter a valid positive number.";
    }

    if (!quantity.trim()) {
      nextErrors.quantity = "Quantity is required.";
    } else if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      nextErrors.quantity = "Enter a valid whole number.";
    }

    if (!Object.values(schedule).some(Boolean)) {
      nextErrors.schedule = "Choose at least one schedule slot.";
    }

    return nextErrors;
  };

  const handleAdd = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || saving) {
      return;
    }

    setSaving(true);

    try {
      await callFunction("createMedication", {
        name: name.trim(),
        dose: `${dosageAmount.trim()} ${dosageUnit}`.trim(),
        capsuleQuantity: Number(quantity),
        takesMorning: schedule.takesMorning,
        takesAfternoon: schedule.takesAfternoon,
        takesEvening: schedule.takesEvening,
        notes: "",
      });

      clearForm();
      await loadMedications();
    } catch (err) {
      console.error("Medication create error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (medicationId) => {
    if (deletingId) {
      return;
    }

    setDeletingId(medicationId);

    try {
      await callFunction("deleteMedication", { medicationId });
      setMedications((prev) => prev.filter((item) => item.id !== medicationId));
    } catch (err) {
      console.error("Medication delete error:", err);
    } finally {
      setDeletingId("");
    }
  };

  const filteredMedications = search.trim()
    ? medications.filter((item) =>
        item.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : medications;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadMedications} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>MEDICATION TRACKER</Text>
        <Text style={styles.headerTitle}>Medications</Text>
        <Text style={styles.headerSub}>
          Add medications to Firebase and keep the list synced across the app.
        </Text>
      </View>

      <View style={styles.card}>
        <FieldBox>
          <Label>Medication Name</Label>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={(value) => {
              setName(value);
              setErrors((prev) => ({ ...prev, name: null }));
            }}
            placeholder="e.g. Metformin"
            placeholderTextColor={COLORS.textDim}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </FieldBox>

        <FieldBox>
          <Label>Dosage</Label>
          <View style={styles.dosageRow}>
            <TextInput
              style={[
                styles.input,
                styles.dosageInput,
                errors.dosageAmount && styles.inputError,
              ]}
              value={dosageAmount}
              onChangeText={(value) => {
                setDosageAmount(value);
                setErrors((prev) => ({ ...prev, dosageAmount: null }));
              }}
              placeholder="500"
              placeholderTextColor={COLORS.textDim}
              keyboardType="decimal-pad"
            />
            <View style={styles.dosageUnitWrap}>
              <Text style={styles.dosageUnitSelected}>{dosageUnit}</Text>
            </View>
          </View>
          {errors.dosageAmount ? (
            <Text style={styles.errorText}>{errors.dosageAmount}</Text>
          ) : null}
          <View style={styles.unitWrap}>
            <DosageUnitPicker value={dosageUnit} onChange={setDosageUnit} />
          </View>
        </FieldBox>

        <FieldBox>
          <Label>Bottle Quantity</Label>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => {
                const next = Math.max(1, (parseInt(quantity, 10) || 0) - 1);
                setQuantity(String(next));
                setErrors((prev) => ({ ...prev, quantity: null }));
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.qtyInput, errors.quantity && styles.inputError]}
              value={quantity}
              onChangeText={(value) => {
                setQuantity(value.replace(/[^0-9]/g, ""));
                setErrors((prev) => ({ ...prev, quantity: null }));
              }}
              placeholder="30"
              placeholderTextColor={COLORS.textDim}
              keyboardType="number-pad"
              textAlign="center"
            />
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => {
                const next = (parseInt(quantity, 10) || 0) + 1;
                setQuantity(String(next));
                setErrors((prev) => ({ ...prev, quantity: null }));
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          {errors.quantity ? (
            <Text style={styles.errorText}>{errors.quantity}</Text>
          ) : null}
        </FieldBox>

        <FieldBox>
          <Label>Daily Schedule</Label>
          <SchedulePicker
            value={schedule}
            onToggle={(key) =>
              setSchedule((prev) => ({ ...prev, [key]: !prev[key] }))
            }
          />
          {errors.schedule ? (
            <Text style={styles.errorText}>{errors.schedule}</Text>
          ) : null}
        </FieldBox>

        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.submitBtnMuted]}
          onPress={handleAdd}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.submitBtnText}>
            {saving ? "Saving..." : "Add Medication"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Saved Medications</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredMedications.length}</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search medications..."
            placeholderTextColor={COLORS.textDim}
            style={styles.searchInput}
          />
        </View>

        {filteredMedications.length ? (
          filteredMedications.map((item) => (
            <MedicationCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              deleting={deletingId === item.id}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>Medication list is empty.</Text>
            <Text style={styles.emptySubText}>
              Added medications will appear here once they are saved to Firebase.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 24,
    paddingTop: 16,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accent,
    letterSpacing: 2.5,
    marginBottom: 6,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    gap: 4,
  },
  fieldBox: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 5,
    marginLeft: 2,
  },
  dosageRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  dosageInput: {
    flex: 1,
  },
  dosageUnitWrap: {
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 60,
    alignItems: "center",
  },
  dosageUnitSelected: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.accent,
  },
  unitWrap: {
    marginTop: 10,
  },
  unitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitChipActive: {
    backgroundColor: COLORS.accentBlueDim,
    borderColor: COLORS.accentBlue,
  },
  unitText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },
  unitTextActive: {
    color: COLORS.accentBlue,
    fontWeight: "700",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    fontSize: 20,
    color: COLORS.text,
  },
  qtyInput: {
    flex: 1,
  },
  scheduleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scheduleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scheduleChipActive: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accent,
  },
  scheduleText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  scheduleTextActive: {
    color: COLORS.accent,
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  submitBtnMuted: {
    opacity: 0.75,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  listSection: {
    marginTop: 32,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.accentGlow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accent,
  },
  searchBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 12,
  },
  medCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  medCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  medCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
    marginRight: 8,
  },
  medCardName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  dosagePill: {
    backgroundColor: COLORS.accentBlueDim,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accentBlue,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dosagePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accentBlue,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.dangerDim,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.danger,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  metaLine: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  emptyState: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  emptyIcon: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
