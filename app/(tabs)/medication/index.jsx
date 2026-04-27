import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMESLOTS = ['Morning', 'Afternoon', 'Evening', 'Bedtime', 'As Needed'];

const DOSAGE_UNITS = ['mg', 'mcg', 'g', 'ml', 'IU', '%', 'other'];

const COLORS = {
  bg: '#9bec82',
  surface: '#ffffff',
  surfaceAlt: '#e8ebe8',
  border: '#30363D',
  accent: '#3FB950',
  accentDim: '#238636',
  accentGlow: 'rgba(63,185,80,0.15)',
  accentBlue: '#58A6FF',
  accentBlueDim: 'rgba(88,166,255,0.15)',
  danger: '#F85149',
  dangerDim: 'rgba(248,81,73,0.15)',
  text: '#000000',
  textMuted: '#8B949E',
  textDim: '#484F58',
  white: '#FFFFFF',
};

// ─── Shared Sub-components ────────────────────────────────────────────────────

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

const MetaItem = ({ icon, label, value }) => (
  <View style={styles.metaItem}>
    <Text style={styles.metaIcon}>{icon}</Text>
    <Text style={styles.metaLabel}>{label}: </Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

// ─── Dosage Unit Picker ───────────────────────────────────────────────────────

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

// ─── Medication Card ──────────────────────────────────────────────────────────

const MedicationCard = ({ item, index, onDelete }) => (
  <View style={[styles.medCard, index === 0 && styles.medCardFirst]}>
    <View style={styles.medCardHeader}>
      <View style={styles.medCardTitleRow}>
        <Text style={styles.medCardName}>{item.name}</Text>
        <View style={styles.dosagePill}>
          <Text style={styles.dosagePillText}>
            {item.dosageAmount}{item.dosageUnit}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item.id)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.divider} />

    <View style={styles.medMeta}>
      <MetaItem icon="💊" label="Dosage" value={`${item.dosageAmount} ${item.dosageUnit}`} />
      <MetaItem icon="🔢" label="Quantity" value={`${item.quantity} ${item.quantity === '1' ? 'unit' : 'units'}`} />
      <MetaItem icon="🕐" label="Timeslot" value={item.timeslot} />
    </View>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddMedicationList() {
  const [name, setName] = useState('');
  const [dosageAmount, setDosageAmount] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [quantity, setQuantity] = useState('');
  const [timeslot, setTimeslot] = useState('Morning');
  const [medications, setMedications] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const clearError = (key) =>
    setErrors((prev) => ({ ...prev, [key]: null }));

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Medication name is required.';
    if (!dosageAmount.trim()) {
      e.dosageAmount = 'Dosage amount is required.';
    } else if (isNaN(Number(dosageAmount)) || Number(dosageAmount) <= 0) {
      e.dosageAmount = 'Enter a valid positive number.';
    }
    if (!quantity.trim()) {
      e.quantity = 'Quantity is required.';
    } else if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      e.quantity = 'Enter a valid whole number (e.g. 30).';
    }
    if (!timeslot) e.timeslot = 'Select a timeslot.';
    return e;
  };

  const handleAdd = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const entry = {
      id: Date.now().toString(),
      name: name.trim(),
      dosageAmount: dosageAmount.trim(),
      dosageUnit,
      quantity: quantity.trim(),
      timeslot,
    };

    setMedications((prev) => [entry, ...prev]);
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setDosageAmount('');
      setDosageUnit('mg');
      setQuantity('');
      setTimeslot('Morning');
      setErrors({});
    }, 1500);
  };

  const handleDelete = (id) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>MEDICATION TRACKER</Text>
        <Text style={styles.headerTitle}>Add Medication</Text>
        <Text style={styles.headerSub}>
          Build your medication list with dosage, quantity, and schedule.
        </Text>
      </View>

      {/* Form Card */}
      <View style={styles.card}>

        {/* Medication Name */}
        <FieldBox>
          <Label>Medication Name</Label>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={(t) => { setName(t); clearError('name'); }}
            placeholder="e.g. Metformin"
            placeholderTextColor={COLORS.textDim}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </FieldBox>

        {/* Dosage */}
        <FieldBox>
          <Label>Dosage</Label>
          <View style={styles.dosageRow}>
            <TextInput
              style={[styles.input, styles.dosageInput, errors.dosageAmount && styles.inputError]}
              value={dosageAmount}
              onChangeText={(t) => { setDosageAmount(t); clearError('dosageAmount'); }}
              placeholder="e.g. 500"
              placeholderTextColor={COLORS.textDim}
              keyboardType="decimal-pad"
            />
            <View style={styles.dosageUnitWrap}>
              <Text style={styles.dosageUnitSelected}>{dosageUnit}</Text>
            </View>
          </View>
          {errors.dosageAmount && <Text style={styles.errorText}>{errors.dosageAmount}</Text>}
          <View style={{ marginTop: 10 }}>
            <DosageUnitPicker value={dosageUnit} onChange={setDosageUnit} />
          </View>
        </FieldBox>

        {/* Quantity */}
        <FieldBox>
          <Label>Medicine Quantity</Label>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => {
                const n = Math.max(1, (parseInt(quantity) || 0) - 1);
                setQuantity(String(n));
                clearError('quantity');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.input, styles.qtyInput, errors.quantity && styles.inputError]}
              value={quantity}
              onChangeText={(t) => { setQuantity(t.replace(/[^0-9]/g, '')); clearError('quantity'); }}
              placeholder="30"
              placeholderTextColor={COLORS.textDim}
              keyboardType="number-pad"
              textAlign="center"
            />

            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => {
                const n = (parseInt(quantity) || 0) + 1;
                setQuantity(String(n));
                clearError('quantity');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>

            <View style={styles.qtyLabel}>
              <Text style={styles.qtyLabelText}>units</Text>
            </View>
          </View>
          {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
        </FieldBox>

        {/* Timeslot */}
        <FieldBox>
          <Label>Timeslot</Label>
          <TimeslotPicker
            value={timeslot}
            onChange={(v) => { setTimeslot(v); clearError('timeslot'); }}
          />
          {errors.timeslot && <Text style={styles.errorText}>{errors.timeslot}</Text>}
        </FieldBox>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitted && styles.submitBtnSuccess]}
          onPress={handleAdd}
          activeOpacity={0.85}
          disabled={submitted}
        >
          <Text style={styles.submitBtnText}>
            {submitted ? '✓  Medication Added!' : '+ Add to List'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Medication List */}
      {medications.length > 0 && (
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>My Medications</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{medications.length}</Text>
            </View>
          </View>

          {medications.map((item, i) => (
            <MedicationCard
              key={item.id}
              item={item}
              index={i}
              onDelete={handleDelete}
            />
          ))}
        </View>
      )}

      {/* Empty state */}
      {medications.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyText}>No medications added yet.</Text>
          <Text style={styles.emptySubText}>Fill in the form above to get started.</Text>
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

  // Header — identical to adherence logger
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

  // Card — identical
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

  // Input — identical
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

  // Timeslot chips — identical
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

  // Submit — identical
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

  // Dosage row
  dosageRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
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
    minWidth: 56,
    alignItems: 'center',
  },
  dosageUnitSelected: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
  },

  // Unit chips (blue accent to differ from timeslot)
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  unitTextActive: {
    color: COLORS.accentBlue,
    fontWeight: '700',
  },

  // Quantity stepper
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 20,
    color: COLORS.text,
    lineHeight: 24,
  },
  qtyInput: {
    flex: 1,
    textAlign: 'center',
  },
  qtyLabel: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyLabelText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // List section
  listSection: {
    marginTop: 32,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
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
    fontWeight: '700',
    color: COLORS.accent,
  },

  // Medication Card
  medCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  medCardFirst: {
    borderColor: COLORS.accentDim,
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  medCardName: {
    fontSize: 16,
    fontWeight: '700',
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
    fontWeight: '700',
    color: COLORS.accentBlue,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.dangerDim,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteBtnText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  medMeta: {
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

  // Empty state
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.textDim,
  },
});
