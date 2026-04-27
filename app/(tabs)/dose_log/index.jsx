import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Platform,
  Alert,
  Modal,
  FlatList,
} from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMESLOTS = ['Morning', 'Afternoon', 'Evening', 'Bedtime', 'As Needed'];

const COLORS = {
  bg: '#9bec82',
  surface: '#ffffff',
  surfaceAlt: '#e8ebe8',
  border: '#30363D',
  accent: '#3FB950',
  accentDim: '#238636',
  accentGlow: 'rgba(63,185,80,0.15)',
  danger: '#F85149',
  dangerDim: 'rgba(248,81,73,0.15)',
  text: '#000000',
  textMuted: '#8B949E',
  textDim: '#484F58',
  white: '#FFFFFF',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const nowISO = () => new Date().toISOString();

const formatDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
};

const formatTimestamp = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString();
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Label = ({ children }) => (
  <Text style={styles.label}>{children}</Text>
);

const FieldBox = ({ children }) => (
  <View style={styles.fieldBox}>{children}</View>
);

const TimeslotPicker = ({ value, onChange }) => (
  <View style={styles.timeslotRow}>
    {TIMESLOTS.map((slot) => (
      <TouchableOpacity
        key={slot}
        style={[styles.timeslotChip, value === slot && styles.timeslotChipActive]}
        onPress={() => onChange(slot)}
        activeOpacity={0.7}
      >
        <Text style={[styles.timeslotText, value === slot && styles.timeslotTextActive]}>
          {slot}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const DateInput = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);

  // Simple YYYY-MM-DD text entry (cross-platform, no native dependency)
  return (
    <View>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShow((v) => !v)} activeOpacity={0.8}>
        <Text style={styles.dateButtonText}>{value ? formatDate(value) : 'Tap to set date'}</Text>
        <Text style={styles.dateIcon}>📅</Text>
      </TouchableOpacity>

      {show && (
        <View style={styles.dateInputWrap}>
          <Text style={styles.dateHint}>Enter date as YYYY-MM-DD</Text>
          <TextInput
            style={styles.dateRawInput}
            value={value}
            onChangeText={onChange}
            placeholder="2025-04-25"
            placeholderTextColor={COLORS.textDim}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            onBlur={() => setShow(false)}
            autoFocus
          />
        </View>
      )}
    </View>
  );
};

// ─── Log Entry Card ───────────────────────────────────────────────────────────

const LogCard = ({ entry, index }) => (
  <View style={[styles.logCard, index === 0 && styles.logCardFirst]}>
    <View style={styles.logCardHeader}>
      <Text style={styles.logMed}>{entry.medication}</Text>
      <View style={[styles.takenBadge, !entry.taken && styles.missedBadge]}>
        <Text style={styles.takenBadgeText}>{entry.taken ? '✓ Taken' : '✗ Missed'}</Text>
      </View>
    </View>

    <View style={styles.logMeta}>
      <MetaItem icon="📅" label="Scheduled" value={formatDate(entry.scheduledDate)} />
      <MetaItem icon="🕐" label="Timeslot" value={entry.timeslot} />
      {entry.taken && entry.dateTaken && (
        <MetaItem icon="✅" label="Taken on" value={formatDate(entry.dateTaken)} />
      )}
      <MetaItem icon="🕰" label="Logged at" value={formatTimestamp(entry.loggedAt)} />
    </View>
  </View>
);

const MetaItem = ({ icon, label, value }) => (
  <View style={styles.metaItem}>
    <Text style={styles.metaIcon}>{icon}</Text>
    <Text style={styles.metaLabel}>{label}: </Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MedicationAdherenceLogger() {
  const [medication, setMedication] = useState('');
  const [scheduledDate, setScheduledDate] = useState(today());
  const [timeslot, setTimeslot] = useState('Morning');
  const [taken, setTaken] = useState(true);
  const [dateTaken, setDateTaken] = useState(today());
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!medication.trim()) e.medication = 'Medication name is required.';
    if (!scheduledDate || !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate))
      e.scheduledDate = 'Enter a valid date (YYYY-MM-DD).';
    if (!timeslot) e.timeslot = 'Select a timeslot.';
    if (taken && (!dateTaken || !/^\d{4}-\d{2}-\d{2}$/.test(dateTaken)))
      e.dateTaken = 'Enter a valid date taken (YYYY-MM-DD).';
    return e;
  };

  const handleLog = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const entry = {
      id: Date.now().toString(),
      medication: medication.trim(),
      scheduledDate,
      timeslot,
      taken,
      dateTaken: taken ? dateTaken : null,
      loggedAt: nowISO(),
    };

    setLogs((prev) => [entry, ...prev]);
    setSubmitted(true);

    // Reset after short delay to show success state
    setTimeout(() => {
      setSubmitted(false);
      setMedication('');
      setScheduledDate(today());
      setTimeslot('Morning');
      setTaken(true);
      setDateTaken(today());
      setErrors({});
    }, 1500);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>MEDICATION TRACKER</Text>
        <Text style={styles.headerTitle}>Log Adherence</Text>
        <Text style={styles.headerSub}>Record whether a medication was taken as prescribed.</Text>
      </View>

      {/* Form Card */}
      <View style={styles.card}>

        {/* Medication Name */}
        <FieldBox>
          <Label>Medication Name</Label>
          <TextInput
            style={[styles.input, errors.medication && styles.inputError]}
            value={medication}
            onChangeText={(t) => { setMedication(t); setErrors((e) => ({ ...e, medication: null })); }}
            placeholder="e.g. Metformin 500mg"
            placeholderTextColor={COLORS.textDim}
          />
          {errors.medication && <Text style={styles.errorText}>{errors.medication}</Text>}
        </FieldBox>

        {/* Scheduled Date */}
        <FieldBox>
          <Label>Scheduled Date</Label>
          <DateInput value={scheduledDate} onChange={(v) => { setScheduledDate(v); setErrors((e) => ({ ...e, scheduledDate: null })); }} />
          {errors.scheduledDate && <Text style={styles.errorText}>{errors.scheduledDate}</Text>}
        </FieldBox>

        {/* Timeslot */}
        <FieldBox>
          <Label>Timeslot</Label>
          <TimeslotPicker value={timeslot} onChange={(v) => { setTimeslot(v); setErrors((e) => ({ ...e, timeslot: null })); }} />
          {errors.timeslot && <Text style={styles.errorText}>{errors.timeslot}</Text>}
        </FieldBox>

        {/* Was it taken? */}
        <FieldBox>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Medication Taken?</Text>
              <Text style={styles.switchSub}>{taken ? 'Yes — medication was taken' : 'No — dose was missed'}</Text>
            </View>
            <Switch
              value={taken}
              onValueChange={setTaken}
              trackColor={{ false: COLORS.danger, true: COLORS.accentDim }}
              thumbColor={taken ? COLORS.accent : COLORS.danger}
            />
          </View>
        </FieldBox>

        {/* Date Taken — only shown if taken */}
        {taken && (
          <FieldBox>
            <Label>Date Taken</Label>
            <DateInput value={dateTaken} onChange={(v) => { setDateTaken(v); setErrors((e) => ({ ...e, dateTaken: null })); }} />
            {errors.dateTaken && <Text style={styles.errorText}>{errors.dateTaken}</Text>}
          </FieldBox>
        )}

        {/* Log Created At (auto) */}
        <FieldBox>
          <Label>Log Created At</Label>
          <View style={styles.autoField}>
            <Text style={styles.autoFieldText}>Auto-stamped on submit  ·  {formatTimestamp(nowISO())}</Text>
          </View>
        </FieldBox>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitted && styles.submitBtnSuccess]}
          onPress={handleLog}
          activeOpacity={0.85}
          disabled={submitted}
        >
          <Text style={styles.submitBtnText}>
            {submitted ? '✓  Adherence Logged!' : 'Log Adherence'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Log History */}
      {logs.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent Logs</Text>
          {logs.map((entry, i) => (
            <LogCard key={entry.id} entry={entry} index={i} />
          ))}
        </View>
      )}

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },

  // Header
  header: {
    marginBottom: 24,
    paddingTop: 16,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 2.5,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },

  // Card
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
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // Input
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

  // Timeslot chips
  timeslotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeslotChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeslotChipActive: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accent,
  },
  timeslotText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  timeslotTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },

  // Switch row
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Date picker
  dateButton: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 15,
    color: COLORS.textDim,
  },
  dateIcon: {
    fontSize: 16,
  },
  dateInputWrap: {
    marginTop: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 10,
    padding: 12,
  },
  dateHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  dateRawInput: {
    fontSize: 15,
    color: COLORS.textDim,
  },

  // Auto field
  autoField: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  autoFieldText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // Submit button
  submitBtn: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  submitBtnSuccess: {
    backgroundColor: '#1a4d2e',
    borderColor: COLORS.accent,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Log history
  historySection: {
    marginTop: 32,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  logCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  logCardFirst: {
    borderColor: COLORS.accentDim,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logMed: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  takenBadge: {
    backgroundColor: COLORS.accentGlow,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  missedBadge: {
    backgroundColor: COLORS.dangerDim,
    borderColor: COLORS.danger,
  },
  takenBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  logMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  metaValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
});
