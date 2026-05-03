import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";
import { callFunction } from "../../../services/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { syncDoseReminderNotifications } from "../../../services/notifications";

// ── Added Bedtime as fourth slot ──────────────────────────────────────────
const TIMESLOTS = [
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
};

// ── Date helpers ──────────────────────────────────────────────────────────
const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateKey = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const today = () => toDateKey(new Date());

const addDays = (value, offset) => {
  const date = parseDateKey(value);
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
};

const formatDate = (value) => {
  if (!value) return "";
  return parseDateKey(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ── Build a merged view: every medication appears under its slot(s).
//    Each entry is either an existing adherence record (has .id) or a
//    "pending" stub derived from the medication list.
const buildSlotEntries = (medications, adherenceRecords, dateKey) => {
  // Index existing records by medicationId + timeSlot for quick lookup
  const recordIndex = {};
  adherenceRecords.forEach((rec) => {
    if (rec.date === dateKey) {
      const key = `${rec.medicationId}__${rec.timeSlot}`;
      recordIndex[key] = rec;
    }
  });

  // Groups: slot label → array of display items
  const groups = { Morning: [], Afternoon: [], Evening: [], Bedtime: [] };

  medications.forEach((med) => {
    TIMESLOTS.forEach(({ key, label }) => {
      if (!med[key]) return; // medication not scheduled for this slot
      const lookupKey = `${med.id}__${label}`;
      const existing = recordIndex[lookupKey];

      groups[label].push(
        existing
          ? { ...existing, _medicationName: med.name, _dose: med.dose }
          : {
              // Stub — no adherence record yet for this slot today
              id: null,
              medicationId: med.id,
              date: dateKey,
              timeSlot: label,
              taken: false,
              takenAt: null,
              _medicationName: med.name,
              _dose: med.dose,
              _isStub: true,
            }
      );
    });
  });

  return groups;
};

// ── Date stepper shown above the history list ─────────────────────────────
const DateStepper = ({ value, onChange }) => (
  <View style={styles.dateStepper}>
    <TouchableOpacity
      style={styles.dateArrow}
      onPress={() => onChange(addDays(value, -1))}
      activeOpacity={0.8}
    >
      <Text style={styles.dateArrowText}>‹</Text>
    </TouchableOpacity>
    <View style={styles.dateValue}>
      <Text style={styles.dateValueText}>{formatDate(value)}</Text>
    </View>
    <TouchableOpacity
      style={styles.dateArrow}
      onPress={() => onChange(addDays(value, 1))}
      activeOpacity={0.8}
    >
      <Text style={styles.dateArrowText}>›</Text>
    </TouchableOpacity>
  </View>
);

// ── Single-row adherence card ─────────────────────────────────────────────
// The "taken" indicator and "Mark Taken" button are merged into one button.
const AdherenceCard = ({ item, onToggleTaken, togglingId }) => {
  const isToggling = togglingId === (item.id ?? `${item.medicationId}__${item.timeSlot}`);

  return (
    <View style={styles.adherenceCard}>
      {/* Name + dose */}
      <View style={styles.adherenceInfo}>
        <Text style={styles.adherenceName} numberOfLines={1}>
          {item._medicationName}
        </Text>
        <Text style={styles.adherenceDose} numberOfLines={1}>
          {item._dose}
        </Text>
      </View>

      {/* Single merged taken/mark-taken button */}
      <TouchableOpacity
        style={[
          styles.takenBtn,
          item.taken ? styles.takenBtnTaken : styles.takenBtnMissed,
          isToggling && styles.takenBtnDisabled,
        ]}
        onPress={() => onToggleTaken(item)}
        activeOpacity={0.8}
        disabled={isToggling}
      >
        <Text
          style={[
            styles.takenBtnText,
            item.taken ? styles.takenBtnTextTaken : styles.takenBtnTextMissed,
          ]}
        >
          {isToggling ? "…" : item.taken ? "✓ Taken" : "Mark Taken"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Time-slot section ─────────────────────────────────────────────────────
const TimeslotSection = ({ slot, items, onToggleTaken, togglingId }) => (
  <View style={styles.timeslotSection}>
    <View style={styles.timeslotHeader}>
      <Text style={styles.timeslotTitle}>{slot}</Text>
      <View style={styles.timeslotBadge}>
        <Text style={styles.timeslotBadgeText}>{items.length}</Text>
      </View>
    </View>

    {items.length > 0 ? (
      items.map((item) => {
        const cardKey = item.id ?? `stub__${item.medicationId}__${item.timeSlot}`;
        return (
          <AdherenceCard
            key={cardKey}
            item={item}
            onToggleTaken={onToggleTaken}
            togglingId={togglingId}
          />
        );
      })
    ) : (
      <View style={styles.timeslotEmpty}>
        <Text style={styles.timeslotEmptyText}>
          No medications scheduled for {slot.toLowerCase()}.
        </Text>
      </View>
    )}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────
export default function DoseLogScreen() {
  const insets = useSafeAreaInsets();
  const [medications, setMedications] = useState([]);
  const [adherenceRecords, setAdherenceRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadDoseData = useCallback(async () => {
    setLoading(true);
    try {
      const endDate = today();
      const startDate = addDays(endDate, -30);
      const [medsRes, adherenceRes] = await Promise.all([
        callFunction("getAllMedications", {}, { forceRefresh: true }),
        callFunction("getAdherenceByDateRange", { startDate, endDate }, { forceRefresh: true }),
      ]);
      const medicationList = medsRes.data || [];
      const adherenceList = adherenceRes.data || [];
      setMedications(medicationList);
      setAdherenceRecords(adherenceList);
      await syncDoseReminderNotifications({
        medications: medicationList,
        adherenceRecords: adherenceList.filter((r) => r.date === today()),
      });
    } catch (err) {
      console.error("Dose log load error:", err);
      Alert.alert("Dose Log", err?.message || "We couldn't load your dose log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDoseData();
    }, [loadDoseData])
  );

  // Build grouped entries whenever medications, records, or date changes
  const groupedEntries = useMemo(
    () => buildSlotEntries(medications, adherenceRecords, selectedDate),
    [medications, adherenceRecords, selectedDate]
  );

  // Toggle a dose between taken / not-taken.
  // If no record exists yet, log one (taken = true). If one exists, flip it.
  const handleToggleTaken = useCallback(
    async (item) => {
      const cardKey = item.id ?? `${item.medicationId}__${item.timeSlot}`;
      setTogglingId(cardKey);

      // Optimistic update
      const nowIso = new Date().toISOString();
      setAdherenceRecords((prev) => {
        if (item._isStub || !item.id) {
          // Add a temporary optimistic record
          return [
            ...prev,
            {
              id: `__optimistic__${cardKey}`,
              medicationId: item.medicationId,
              date: item.date,
              timeSlot: item.timeSlot,
              taken: true,
              takenAt: nowIso,
            },
          ];
        }
        return prev.map((r) =>
          r.id === item.id ? { ...r, taken: !r.taken, takenAt: !r.taken ? nowIso : null } : r
        );
      });

      try {
        if (item._isStub || !item.id) {
          // No existing record — create one marked as taken
          await callFunction("logAdherence", {
            medicationId: item.medicationId,
            date: item.date,
            timeSlot: item.timeSlot,
            taken: true,
          });
        } else {
          await callFunction("updateAdherence", {
            adherenceId: item.id,
            taken: !item.taken,
          });
        }
        // Refresh to get the real record id
        await loadDoseData();
      } catch (err) {
        // Roll back optimistic update
        setAdherenceRecords((prev) =>
          item._isStub || !item.id
            ? prev.filter((r) => r.id !== `__optimistic__${cardKey}`)
            : prev.map((r) =>
                r.id === item.id ? { ...r, taken: item.taken, takenAt: item.takenAt } : r
              )
        );
        console.error("Toggle taken error:", err);
        Alert.alert("Dose Log", err?.message || "We couldn't update this dose.");
      } finally {
        setTogglingId(null);
      }
    },
    [loadDoseData]
  );

  const totalForDate = useMemo(
    () => Object.values(groupedEntries).reduce((sum, arr) => sum + arr.length, 0),
    [groupedEntries]
  );

  const takenForDate = useMemo(
    () => Object.values(groupedEntries).reduce((sum, arr) => sum + arr.filter((e) => e.taken).length, 0),
    [groupedEntries]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.headerEyebrow}>FORGOTMYMEDS</Text>
        <Text style={styles.headerTitle}>Dose Log</Text>
        <Text style={styles.headerSub}>
          Track your daily doses across all time slots.
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDoseData} />
        }
      >
        {/* ── Date picker + summary bar ── */}
        <View style={styles.dateCard}>
          <DateStepper value={selectedDate} onChange={setSelectedDate} />
          {totalForDate > 0 && (
            <View style={styles.summaryBar}>
              <Text style={styles.summaryText}>
                {takenForDate} of {totalForDate} doses taken
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round((takenForDate / totalForDate) * 100)}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* ── Adherence list grouped by time slot ── */}
        {medications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No medications yet.</Text>
            <Text style={styles.emptySubText}>
              Add medications from the Medications tab to start tracking.
            </Text>
          </View>
        ) : (
          TIMESLOTS.map(({ label }) => (
            <TimeslotSection
              key={label}
              slot={label}
              items={groupedEntries[label] || []}
              onToggleTaken={handleToggleTaken}
              togglingId={togglingId}
            />
          ))
        )}
      </ScrollView>
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

  // ── Date card ──
  dateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 24,
    gap: 14,
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
    fontSize: 22,
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
    fontWeight: "600",
    color: COLORS.text,
  },

  // ── Progress summary ──
  summaryBar: { gap: 6 },
  summaryText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 6,
    borderRadius: 99,
    backgroundColor: COLORS.surfaceAlt,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: COLORS.accent,
  },

  // ── Time-slot section ──
  timeslotSection: { marginBottom: 22 },
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
  timeslotBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
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

  // ── Single-row adherence card ──
  adherenceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 10,
  },
  adherenceInfo: {
    flex: 1,
    gap: 2,
  },
  adherenceName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  adherenceDose: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Merged taken/mark-taken button
  takenBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    minWidth: 90,
    alignItems: "center",
  },
  takenBtnTaken: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accent,
  },
  takenBtnMissed: {
    backgroundColor: COLORS.dangerDim,
    borderColor: COLORS.danger,
  },
  takenBtnDisabled: { opacity: 0.5 },
  takenBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  takenBtnTextTaken: { color: COLORS.accentDim },
  takenBtnTextMissed: { color: COLORS.danger },

  // ── Empty state ──
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.textDim,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
});
