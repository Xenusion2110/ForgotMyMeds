import React, { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import { callFunction } from "../../../services/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { syncDoseReminderNotifications } from "../../../services/notifications";

const DOSAGE_UNITS = ["mg", "mcg", "g", "ml", "IU", "%", "other"];

// ── Added "Bedtime" as a fourth slot ──────────────────────────────────────
const SCHEDULES = [
  { key: "takesMorning",   label: "Morning" },
  { key: "takesAfternoon", label: "Afternoon" },
  { key: "takesEvening",   label: "Evening" },
  { key: "takesBedtime",   label: "Bedtime" },
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
  textMuted: "#5A5F67",
  textDim: "#484F58",
  white: "#FFFFFF",
  overlay: "rgba(0,0,0,0.45)",
};

const groupMedicationsBySlot = (medications) => {
  const groups = { Morning: [], Afternoon: [], Evening: [], Bedtime: [] };
  medications.forEach((med) => {
    SCHEDULES.forEach(({ key, label }) => {
      if (med[key]) groups[label].push(med);
    });
  });
  return groups;
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

// ── Compact single-row medication card ────────────────────────────────────
const MedicationCard = ({ item, onDelete, deleting }) => (
  <View style={styles.medCard}>
    <Text style={styles.medCardName} numberOfLines={1}>
      {item.name}
    </Text>
    <View style={styles.dosagePill}>
      <Text style={styles.dosagePillText}>{item.dose}</Text>
    </View>
    <Text style={styles.medCardQty} numberOfLines={1}>
      ×{item.capsuleQuantity}
    </Text>
    <TouchableOpacity
      style={styles.deleteBtn}
      onPress={() => onDelete(item.id)}
      activeOpacity={0.7}
      disabled={deleting}
    >
      <Text style={styles.deleteBtnText}>{deleting ? "…" : "✕"}</Text>
    </TouchableOpacity>
  </View>
);

// ── Time-slot section — pressing "+" opens modal pre-set to this slot ─────
const TimeslotSection = ({ slot, items, onDelete, deletingId, onAddPress }) => (
  <View style={styles.timeslotSection}>
    <View style={styles.timeslotHeader}>
      <Text style={styles.timeslotTitle}>{slot}</Text>
      <View style={styles.timeslotBadge}>
        <Text style={styles.timeslotBadgeText}>{items.length}</Text>
      </View>
      <TouchableOpacity
        style={styles.slotAddBtn}
        onPress={() => onAddPress(slot)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.slotAddBtnText}>+</Text>
      </TouchableOpacity>
    </View>

    {items.length > 0 ? (
      items.map((item) => (
        <MedicationCard
          key={item.id}
          item={item}
          onDelete={onDelete}
          deleting={deletingId === item.id}
        />
      ))
    ) : (
      <View style={styles.timeslotEmpty}>
        <Text style={styles.timeslotEmptyText}>
          No medications scheduled for {slot.toLowerCase()}.
        </Text>
      </View>
    )}
  </View>
);

// ── Add Medication Modal — NO schedule picker; slot is inherited from caller ──
const AddMedicationModal = ({ visible, onClose, onSaved, slotLabel }) => {
  const [name, setName] = useState("");
  const [dosageAmount, setDosageAmount] = useState("");
  const [dosageUnit, setDosageUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const clearForm = () => {
    setName("");
    setDosageAmount("");
    setDosageUnit("");
    setQuantity("");
    setErrors({});
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  const validate = () => {
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Medication name is required.";
    if (!dosageAmount.trim()) nextErrors.dosageAmount = "Dosage amount is required.";
    if (!quantity.trim()) {
      nextErrors.quantity = "Quantity is required.";
    } else if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      nextErrors.quantity = "Enter a valid whole number.";
    }
    return nextErrors;
  };

  // Build the schedule flags from the slot label passed in
  const scheduleFlags = () => ({
    takesMorning:   slotLabel === "Morning",
    takesAfternoon: slotLabel === "Afternoon",
    takesEvening:   slotLabel === "Evening",
    takesBedtime:   slotLabel === "Bedtime",
  });

  const handleAdd = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || saving) return;

    setSaving(true);
    try {
      await callFunction("createMedication", {
        name: name.trim(),
        dose: `${dosageAmount.trim()} ${dosageUnit}`.trim(),
        capsuleQuantity: Number(quantity),
        ...scheduleFlags(),
        notes: "",
      });
      clearForm();
      onSaved();
    } catch (err) {
      console.error("Medication create error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.modalHeader}>
            {/* Title includes the slot name so the user always knows context */}
            <Text style={styles.modalTitle}>
              Add to {slotLabel ?? ""}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FieldBox>
              <Label>Medication Name</Label>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  setErrors((p) => ({ ...p, name: null }));
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
                  onChangeText={(v) => {
                    setDosageAmount(v);
                    setErrors((p) => ({ ...p, dosageAmount: null }));
                  }}
                  placeholder="500"
                  placeholderTextColor={COLORS.textDim}
                />
              </View>
              {errors.dosageAmount ? (
                <Text style={styles.errorText}>{errors.dosageAmount}</Text>
              ) : null}
            </FieldBox>

            <FieldBox>
              <Label>Bottle Quantity</Label>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => {
                    const next = Math.max(1, (parseInt(quantity, 10) || 0) - 1);
                    setQuantity(String(next));
                    setErrors((p) => ({ ...p, quantity: null }));
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, styles.qtyInput, errors.quantity && styles.inputError]}
                  value={quantity}
                  onChangeText={(v) => {
                    setQuantity(v.replace(/[^0-9]/g, ""));
                    setErrors((p) => ({ ...p, quantity: null }));
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
                    setErrors((p) => ({ ...p, quantity: null }));
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

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────
export default function MedicationScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  // Track which slot label opened the modal (replaces the schedule object)
  const [modalVisible, setModalVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);

  const loadMedications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await callFunction("getAllMedications", {}, { forceRefresh: true });
      const medicationList = response.data || [];
      setMedications(medicationList);
      await syncDoseReminderNotifications({ medications: medicationList });
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

  const handleOpenAdd = (slotLabel) => {
    setActiveSlot(slotLabel);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setActiveSlot(null);
  };

  const handleSaved = async () => {
    setModalVisible(false);
    setActiveSlot(null);
    await loadMedications();
  };

  const handleDelete = async (medicationId) => {
    if (deletingId) return;
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

  const filteredMedications = useMemo(
    () =>
      search.trim()
        ? medications.filter((item) =>
            item.name.toLowerCase().includes(search.trim().toLowerCase())
          )
        : medications,
    [medications, search]
  );

  const groupedMedications = useMemo(
    () => groupMedicationsBySlot(filteredMedications),
    [filteredMedications]
  );

  const totalCount = filteredMedications.length;

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.headerEyebrow}>FORGOTMYMEDS</Text>
        <Text style={styles.headerTitle}>Medications</Text>
        <Text style={styles.headerSub}>
          Keep your medication list organized and easy to update.
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadMedications} />
        }
      >
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Saved Medications</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{totalCount}</Text>
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

          {totalCount === 0 && !search.trim() ? (
            SCHEDULES.map(({ label }) => (
              <TimeslotSection
                key={label}
                slot={label}
                items={[]}
                onDelete={handleDelete}
                deletingId={deletingId}
                onAddPress={handleOpenAdd}
              />
            ))
          ) : totalCount === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>No results found.</Text>
              <Text style={styles.emptySubText}>Try a different search term.</Text>
            </View>
          ) : (
            SCHEDULES.map(({ label }) => (
              <TimeslotSection
                key={label}
                slot={label}
                items={groupedMedications[label] || []}
                onDelete={handleDelete}
                deletingId={deletingId}
                onAddPress={handleOpenAdd}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AddMedicationModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSaved={handleSaved}
        slotLabel={activeSlot}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  scroll: { flex: 1 },
  content: {
    padding: 18,
    paddingBottom: 60,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 1.4,
    marginBottom: 6,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.white,
    marginTop: 4,
  },
  headerSub: {
    fontSize: 13,
    color: colors.white,
    lineHeight: 20,
    marginTop: 4,
    opacity: 0.9,
  },

  // ── Form ──
  fieldBox: { marginBottom: 18 },
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
  inputError: { borderColor: COLORS.danger },
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
    marginBottom: 10,
  },
  dosageInput: { flex: 1 },
  unitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
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
  unitTextActive: { color: COLORS.accentBlue, fontWeight: "700" },
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
  qtyBtnText: { fontSize: 20, color: COLORS.text },
  qtyInput: { flex: 1 },
  submitBtn: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  submitBtnMuted: { opacity: 0.75 },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── List ──
  listSection: { marginTop: 8 },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  listTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  countBadge: {
    backgroundColor: COLORS.accentGlow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  countBadgeText: { fontSize: 12, fontWeight: "700", color: COLORS.accent },
  searchBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: { fontSize: 15, color: COLORS.text, paddingVertical: 12 },
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
  emptyIcon: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  emptySubText: {
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // ── Time-slot section ──
  timeslotSection: { marginBottom: 20 },
  timeslotHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  timeslotTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
  },
  timeslotBadge: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeslotBadgeText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
  slotAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  slotAddBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.accent,
    lineHeight: 22,
  },
  timeslotEmpty: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 12,
  },
  timeslotEmptyText: { fontSize: 13, color: COLORS.textMuted },

  // ── Compact medication card (single row) ──
  medCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
  },
  medCardName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  dosagePill: {
    backgroundColor: COLORS.accentBlueDim,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accentBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dosagePillText: { fontSize: 11, fontWeight: "700", color: COLORS.accentBlue },
  medCardQty: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    minWidth: 28,
    textAlign: "right",
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: COLORS.dangerDim,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { fontSize: 11, fontWeight: "700", color: COLORS.danger },

  // ── Modal / Bottom Sheet ──
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingTop: 12,
    maxHeight: "90%",
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },
});
