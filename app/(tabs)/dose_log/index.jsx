import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { callFunction } from "../../../services/firebaseConfig";

const TIMESLOTS = [
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
  textMuted: "#5A5F67",
  textDim: "#484F58",
  white: "#FFFFFF",
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const today = () => toDateKey(new Date());

const addDays = (value, offset) => {
  const date = parseDateKey(value);
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const date = parseDateKey(value);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTimestamp = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const sortAdherence = (records = []) =>
  [...records].sort((left, right) => {
    const rightTime = right.takenAt || right.createdAt
      ? new Date(right.takenAt || right.createdAt).getTime()
      : parseDateKey(right.date || today()).getTime();
    const leftTime = left.takenAt || left.createdAt
      ? new Date(left.takenAt || left.createdAt).getTime()
      : parseDateKey(left.date || today()).getTime();
    return rightTime - leftTime;
  });

const getMedicationSlots = (medication) => {
  const selectedSlots = TIMESLOTS.filter((slot) => medication?.[slot.key]).map((slot) => slot.label);
  return selectedSlots.length ? selectedSlots : TIMESLOTS.map((slot) => slot.label);
};

const Label = ({ children }) => <Text style={styles.label}>{children}</Text>;

const FieldBox = ({ children }) => <View style={styles.fieldBox}>{children}</View>;

const DateStepper = ({ value, onChange }) => (
  <View style={styles.dateStepper}>
    <TouchableOpacity
      style={styles.dateArrow}
      onPress={() => onChange(addDays(value, -1))}
      activeOpacity={0.8}
    >
      <Text style={styles.dateArrowText}>-</Text>
    </TouchableOpacity>
    <View style={styles.dateValue}>
      <Text style={styles.dateValueText}>{formatDate(value)}</Text>
    </View>
    <TouchableOpacity
      style={styles.dateArrow}
      onPress={() => onChange(addDays(value, 1))}
      activeOpacity={0.8}
    >
      <Text style={styles.dateArrowText}>+</Text>
    </TouchableOpacity>
  </View>
);

const MedicationPicker = ({ medications, selectedId, onSelect }) => (
  <View style={styles.chipRow}>
    {medications.map((medication) => {
      const active = medication.id === selectedId;

      return (
        <TouchableOpacity
          key={medication.id}
          style={[styles.chip, active && styles.chipActive]}
          onPress={() => onSelect(medication.id)}
          activeOpacity={0.75}
        >
          <Text style={[styles.chipText, active && styles.chipTextActive]}>
            {medication.name}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const TimeslotPicker = ({ options, value, onChange }) => (
  <View style={styles.chipRow}>
    {options.map((slot) => {
      const active = value === slot;

      return (
        <TouchableOpacity
          key={slot}
          style={[styles.chip, active && styles.chipActive]}
          onPress={() => onChange(slot)}
          activeOpacity={0.75}
        >
          <Text style={[styles.chipText, active && styles.chipTextActive]}>
            {slot}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const DetailLine = ({ label, value }) => (
  <View style={styles.detailLine}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const HistoryCard = ({ item }) => (
  <View style={styles.historyCard}>
    <View style={styles.historyHeader}>
      <View>
        <Text style={styles.historyCardTitle}>{item.medicationName || "Medication"}</Text>
        <Text style={styles.historySubtitle}>
          {item.medicationDose || "Dose not set"}
        </Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          item.taken ? styles.statusBadgeTaken : styles.statusBadgeMissed,
        ]}
      >
        <Text
          style={[
            styles.statusBadgeText,
            item.taken ? styles.statusBadgeTextTaken : styles.statusBadgeTextMissed,
          ]}
        >
          {item.taken ? "Taken" : "Missed"}
        </Text>
      </View>
    </View>

    <View style={styles.historyMeta}>
      <DetailLine label="Scheduled" value={formatDate(item.date)} />
      <DetailLine label="Time slot" value={item.timeSlot || ""} />
      <DetailLine
        label="Logged"
        value={formatTimestamp(item.takenAt || item.createdAt) || ""}
      />
    </View>
  </View>
);

export default function DoseLogScreen() {
  const [medications, setMedications] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedMedicationId, setSelectedMedicationId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(today());
  const [timeSlot, setTimeSlot] = useState("Morning");
  const [taken, setTaken] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const selectedMedication = useMemo(
    () => medications.find((item) => item.id === selectedMedicationId) || null,
    [medications, selectedMedicationId]
  );

  const timeSlotOptions = useMemo(
    () => getMedicationSlots(selectedMedication),
    [selectedMedication]
  );

  useEffect(() => {
    const nextSlots = getMedicationSlots(selectedMedication);
    setTimeSlot((current) => (nextSlots.includes(current) ? current : nextSlots[0]));
  }, [selectedMedication]);

  const loadDoseData = useCallback(async () => {
    setLoading(true);

    try {
      const endDate = today();
      const startDate = addDays(endDate, -30);
      const [medicationsResponse, adherenceResponse] = await Promise.all([
        callFunction("getAllMedications", {}, { forceRefresh: true }),
        callFunction("getAdherenceByDateRange", { startDate, endDate }, { forceRefresh: true }),
      ]);

      const medicationList = medicationsResponse.data || [];
      const adherenceList = sortAdherence(adherenceResponse.data || []);

      setMedications(medicationList);
      setHistory(adherenceList);
      setSelectedMedicationId((current) =>
        current && medicationList.some((item) => item.id === current)
          ? current
          : medicationList[0]?.id || ""
      );
    } catch (err) {
      console.error("Dose log load error:", err);
      Alert.alert("Dose Log", err?.message || "We couldn't load your dose log yet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDoseData();
    }, [loadDoseData])
  );

  const validate = () => {
    const nextErrors = {};

    if (!selectedMedicationId) {
      nextErrors.medication = "Choose a medication first.";
    }

    if (!scheduledDate || !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
      nextErrors.date = "Choose a valid date.";
    }

    if (!timeSlot) {
      nextErrors.timeSlot = "Choose a time slot.";
    }

    return nextErrors;
  };

  const handleMedicationSelect = (medicationId) => {
    setSelectedMedicationId(medicationId);
    setErrors((current) => ({ ...current, medication: null, timeSlot: null }));
  };

  const handleSave = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || saving) {
      return;
    }

    setSaving(true);

    try {
      const existingResponse = await callFunction(
        "getAdherenceByDateRange",
        { startDate: scheduledDate, endDate: scheduledDate },
        { forceRefresh: true }
      );
      const existingRecord = (existingResponse.data || []).find(
        (record) =>
          record.medicationId === selectedMedicationId && record.timeSlot === timeSlot
      );

      if (existingRecord) {
        await callFunction("updateAdherence", {
          adherenceId: existingRecord.id,
          taken,
        });
      } else {
        await callFunction("logAdherence", {
          medicationId: selectedMedicationId,
          date: scheduledDate,
          timeSlot,
          taken,
        });
      }

      await loadDoseData();
      Alert.alert("Dose Log", "Adherence saved to Firebase.");
    } catch (err) {
      console.error("Dose log save error:", err);
      Alert.alert("Dose Log", err?.message || "We couldn't save this adherence record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadDoseData} tintColor={COLORS.accentDim} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>MEDICATION TRACKER</Text>
        <Text style={styles.headerTitle}>Dose Log</Text>
        <Text style={styles.headerSub}>
          Save taken and missed doses straight to Firebase and review recent adherence.
        </Text>
      </View>

      <View style={styles.card}>
        <FieldBox>
          <Label>Medication</Label>
          {medications.length ? (
            <MedicationPicker
              medications={medications}
              selectedId={selectedMedicationId}
              onSelect={handleMedicationSelect}
            />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyBoxText}>
                No medications in Firebase yet. Add one from the medications tab first.
              </Text>
            </View>
          )}
          {errors.medication ? <Text style={styles.errorText}>{errors.medication}</Text> : null}
        </FieldBox>

        {selectedMedication ? (
          <View style={styles.summaryPanel}>
            <Text style={styles.summaryMedication}>{selectedMedication.name}</Text>
            <Text style={styles.summaryDose}>{selectedMedication.dose || "Dose not set"}</Text>
            <Text style={styles.summaryMeta}>
              Bottle quantity: {selectedMedication.capsuleQuantity}
            </Text>
          </View>
        ) : null}

        <FieldBox>
          <Label>Scheduled Date</Label>
          <DateStepper
            value={scheduledDate}
            onChange={(value) => {
              setScheduledDate(value);
              setErrors((current) => ({ ...current, date: null }));
            }}
          />
          {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
        </FieldBox>

        <FieldBox>
          <Label>Time Slot</Label>
          <TimeslotPicker
            options={timeSlotOptions}
            value={timeSlot}
            onChange={(value) => {
              setTimeSlot(value);
              setErrors((current) => ({ ...current, timeSlot: null }));
            }}
          />
          {errors.timeSlot ? <Text style={styles.errorText}>{errors.timeSlot}</Text> : null}
        </FieldBox>

        <FieldBox>
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.label}>Dose Taken?</Text>
              <Text style={styles.switchSub}>
                {taken ? "Marked as taken" : "Marked as missed"}
              </Text>
            </View>
            <Switch
              value={taken}
              onValueChange={setTaken}
              trackColor={{ false: COLORS.danger, true: COLORS.accentDim }}
              thumbColor={taken ? COLORS.accent : COLORS.danger}
            />
          </View>
        </FieldBox>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!medications.length || saving) && styles.submitBtnDisabled,
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!medications.length || saving}
        >
          <Text style={styles.submitBtnText}>
            {saving ? "Saving..." : "Save Adherence"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Recent Adherence</Text>
        {history.length ? (
          history.map((item) => <HistoryCard key={item.id} item={item} />)
        ) : (
          <View style={styles.historyEmpty}>
            <Text style={styles.historyEmptyText}>
              No adherence records in Firebase yet.
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
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
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
    marginBottom: 28,
  },
  fieldBox: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  chipTextActive: {
    color: COLORS.accentDim,
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderStyle: "dashed",
    backgroundColor: COLORS.surfaceAlt,
    padding: 14,
  },
  emptyBoxText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  summaryPanel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    padding: 14,
    marginBottom: 18,
  },
  summaryMedication: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  summaryDose: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  summaryMeta: {
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 8,
  },
  dateStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateArrow: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  dateArrowText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  dateValue: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  dateValueText: {
    fontSize: 15,
    color: COLORS.text,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  switchCopy: {
    flex: 1,
  },
  switchSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 6,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: COLORS.accentDim,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.danger,
  },
  historySection: {
    marginBottom: 40,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 14,
  },
  historyEmpty: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 18,
  },
  historyEmptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  historyCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  historySubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  statusBadgeTaken: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accent,
  },
  statusBadgeMissed: {
    backgroundColor: COLORS.dangerDim,
    borderColor: COLORS.danger,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadgeTextTaken: {
    color: COLORS.accentDim,
  },
  statusBadgeTextMissed: {
    color: COLORS.danger,
  },
  historyMeta: {
    marginTop: 14,
    gap: 8,
  },
  detailLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    textAlign: "right",
  },
});
