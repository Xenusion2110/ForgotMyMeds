import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { Ionicons} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { auth, callFunction } from "../../../services/firebaseConfig";

// ─── Constants ────────────────────────────────────────────────────────────────

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
  accentPurple: '#BC8CFF',
  accentPurpleDim: 'rgba(188,140,255,0.15)',
  accentOrange: '#F0883E',
  accentOrangeDim: 'rgba(240,136,62,0.15)',
  danger: '#F85149',
  dangerDim: 'rgba(248,81,73,0.15)',
  warning: '#E3B341',
  warningDim: 'rgba(227,179,65,0.15)',
  text: '#000000',
  textMuted: '#8B949E',
  textDim: '#484F58',
  white: '#FFFFFF',
};

const RELATION_TYPES = ['Family', 'Friend', 'Caregiver', 'Partner'];

const RELATION_COLORS = {
  Family:   { bg: COLORS.accentBlueDim,   border: COLORS.accentBlue,   text: COLORS.accentBlue },
  Friend:   { bg: COLORS.accentPurpleDim, border: COLORS.accentPurple, text: COLORS.accentPurple },
  Caregiver:{ bg: COLORS.accentOrangeDim, border: COLORS.accentOrange, text: COLORS.accentOrange },
  Partner:  { bg: COLORS.accentGlow,      border: COLORS.accent,       text: COLORS.accent },
};

// ─── Mock data helpers ────────────────────────────────────────────────────────

const MOCK_MEDS = [
  { name: 'Metformin 500mg', timeslot: 'Morning',   taken: true },
  { name: 'Lisinopril 10mg', timeslot: 'Evening',   taken: true },
  { name: 'Vitamin D3',      timeslot: 'Morning',   taken: false },
  { name: 'Aspirin 81mg',    timeslot: 'Bedtime',   taken: true },
  { name: 'Atorvastatin',    timeslot: 'Bedtime',   taken: false },
  { name: 'Omeprazole',      timeslot: 'Morning',   taken: true },
  { name: 'Sertraline 50mg', timeslot: 'Morning',   taken: true },
  { name: 'Amlodipine',      timeslot: 'Evening',   taken: false },
];

const pickRandom = (arr, n) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

const generateAdherence = () => {
  const meds = pickRandom(MOCK_MEDS, 2 + Math.floor(Math.random() * 3));
  const taken = meds.filter((m) => m.taken).length;
  return { meds, taken, total: meds.length };
};

const todayLabel = () => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

const avatarInitials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

// ─── Shared Sub-components ────────────────────────────────────────────────────

const Label = ({ children }) => <Text style={styles.label}>{children}</Text>;
const FieldBox = ({ children }) => <View style={styles.fieldBox}>{children}</View>;

const MetaItem = ({ icon, label, value }) => (
  <View style={styles.metaItem}>
    <Text style={styles.metaIcon}>{icon}</Text>
    <Text style={styles.metaLabel}>{label}: </Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

// ─── Progress Ring (simple bar version, no SVG deps) ─────────────────────────

const AdherenceBar = ({ taken, total }) => {
  const pct = total === 0 ? 0 : Math.round((taken / total) * 100);
  const color = pct >= 80 ? COLORS.accent : pct >= 50 ? COLORS.warning : COLORS.danger;
  return (
    <View style={styles.barWrap}>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barPct, { color }]}>{pct}%</Text>
    </View>
  );
};

// ─── Adherence Med Row ────────────────────────────────────────────────────────

const MedRow = ({ med }) => (
  <View style={styles.medRow}>
    <View style={[styles.medDot, { backgroundColor: med.taken ? COLORS.accent : COLORS.danger }]} />
    <Text style={styles.medRowName}>{med.name}</Text>
    <Text style={styles.medRowSlot}>{med.timeslot}</Text>
    <View style={[styles.medStatus, med.taken ? styles.medStatusTaken : styles.medStatusMissed]}>
      <Text style={[styles.medStatusText, { color: med.taken ? COLORS.accent : COLORS.danger }]}>
        {med.taken ? '✓' : '✗'}
      </Text>
    </View>
  </View>
);

// ─── User Adherence Card ──────────────────────────────────────────────────────

const UserCard = ({ user }) => {
  const [expanded, setExpanded] = useState(true);
  const { meds, taken, total } = user.adherence;

  return (
    <View style={[styles.userCard, styles.userCardSelf]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, styles.avatarSelf]}>
          <Text style={styles.avatarText}>{avatarInitials(user.name)}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName}>{user.name}</Text>
            <View style={styles.selfBadge}>
              <Text style={styles.selfBadgeText}>You</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>{taken}/{total} doses taken today</Text>
        </View>
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.expandBtnText}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <AdherenceBar taken={taken} total={total} />

      {/* Med list */}
      {expanded && (
        <View style={styles.medList}>
          <View style={styles.medListDivider} />
          {meds.map((med, i) => (
            <MedRow key={i} med={med} />
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Friend / Family Card ─────────────────────────────────────────────────────

const FriendCard = ({ person, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  const { meds, taken, total } = person.adherence;
  const rel = RELATION_COLORS[person.relation] || RELATION_COLORS.Friend;

  return (
    <View style={styles.userCard}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: rel.bg, borderColor: rel.border }]}>
          <Text style={[styles.avatarText, { color: rel.text }]}>{avatarInitials(person.name)}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName}>{person.name}</Text>
            <View style={[styles.relationBadge, { backgroundColor: rel.bg, borderColor: rel.border }]}>
              <Text style={[styles.relationBadgeText, { color: rel.text }]}>{person.relation}</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>{taken}/{total} doses taken today</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.expandBtn}
            onPress={() => setExpanded((v) => !v)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.expandBtnText}>{expanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => onRemove(person.id)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <AdherenceBar taken={taken} total={total} />

      {/* Med list */}
      {expanded && (
        <View style={styles.medList}>
          <View style={styles.medListDivider} />
          {meds.map((med, i) => (
            <MedRow key={i} med={med} />
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Add Person Modal ─────────────────────────────────────────────────────────

const AddPersonModal = ({ visible, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Family');
  const [errors, setErrors] = useState({});

  const handleAdd = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    onAdd({ name: name.trim(), relation });
    setName('');
    setRelation('Family');
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setName('');
    setRelation('Family');
    setErrors({});
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          <Text style={styles.modalEyebrow}>MEDICATION TRACKER</Text>
          <Text style={styles.modalTitle}>Add Friend / Family</Text>
          <Text style={styles.modalSub}>
            Connect a person to view their daily adherence on your dashboard.
          </Text>

          {/* Name */}
          <FieldBox>
            <Label>Full Name</Label>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: null })); }}
              placeholder="e.g. Sarah Johnson"
              placeholderTextColor={COLORS.textDim}
              autoFocus
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </FieldBox>

          {/* Relation */}
          <FieldBox>
            <Label>Relationship</Label>
            <View style={styles.relationRow}>
              {RELATION_TYPES.map((r) => {
                const rel = RELATION_COLORS[r];
                const active = relation === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.relationChip,
                      active && { backgroundColor: rel.bg, borderColor: rel.border },
                    ]}
                    onPress={() => setRelation(r)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.relationChipText, active && { color: rel.text, fontWeight: '700' }]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FieldBox>

          {/* Buttons */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleAdd} activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>Add to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};


// ─── Main Dashboard ───────────────────────────────────────────────────────────

const CURRENT_USER = {
  name: 'Alex Rivera',
  adherence: generateAdherence(),
};

export default function Dashboard() {
  const router = useRouter();
  const [people, setPeople] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const onLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/"); // back to app/index.js
    } catch (e) {
      console.log("Logout error:", e);
    }
  };

  const handleAddPerson = ({ name, relation }) => {
    const entry = {
      id: Date.now().toString(),
      name,
      relation,
      adherence: generateAdherence(),
    };
    setPeople((prev) => [entry, ...prev]);
  };

  const handleRemove = (id) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  // Summary stats
  const allCards = [CURRENT_USER, ...people];
  const overallTaken = allCards.reduce((sum, u) => sum + u.adherence.taken, 0);
  const overallTotal = allCards.reduce((sum, u) => sum + u.adherence.total, 0);
  const overallPct = overallTotal === 0 ? 0 : Math.round((overallTaken / overallTotal) * 100);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>MEDICATION TRACKER</Text>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>{todayLabel()}</Text>
          <Pressable onPress={onLogout} hitSlop={10}>
                    <Ionicons name="log-out-outline" size={28} color={COLORS.white} />
          </Pressable>
        </View>
      </View>

      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{allCards.length}</Text>
          <Text style={styles.summaryLabel}>Tracked</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.accent }]}>{overallTaken}</Text>
          <Text style={styles.summaryLabel}>Taken</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.danger }]}>{overallTotal - overallTaken}</Text>
          <Text style={styles.summaryLabel}>Missed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[
            styles.summaryValue,
            { color: overallPct >= 80 ? COLORS.accent : overallPct >= 50 ? COLORS.warning : COLORS.danger }
          ]}>
            {overallPct}%
          </Text>
          <Text style={styles.summaryLabel}>Overall</Text>
        </View>
      </View>

      {/* Section: You */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Adherence</Text>
      </View>
      <UserCard user={CURRENT_USER} />

      {/* Section: Network */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Friends & Family</Text>
        {people.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{people.length}</Text>
          </View>
        )}
      </View>

      {/* Add button */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.addBtnIcon}>＋</Text>
        <Text style={styles.addBtnText}>Add Friend / Family</Text>
      </TouchableOpacity>

      {/* People cards */}
      {people.length > 0 ? (
        people.map((p) => (
          <FriendCard key={p.id} person={p} onRemove={handleRemove} />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No one added yet.</Text>
          <Text style={styles.emptySubText}>Tap the button above to add a friend or family member.</Text>
        </View>
      )}

      {/* Modal */}
      <AddPersonModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddPerson}
      />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 60 },

  // Header
  header: { marginBottom: 20, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerEyebrow: { fontSize: 11, fontWeight: '700', color: COLORS.accent, letterSpacing: 2.5, marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 4 },
  headerSub: { fontSize: 13, color: COLORS.textMuted },

  // Summary strip
  summaryStrip: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 28, alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  summaryLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  summaryDivider: { width: 1, height: 36, backgroundColor: COLORS.border },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  countBadge: { backgroundColor: COLORS.accentGlow, borderRadius: 12, borderWidth: 1, borderColor: COLORS.accent, paddingHorizontal: 9, paddingVertical: 2 },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.accent },

  // Add button
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', paddingVertical: 14, marginBottom: 16 },
  addBtnIcon: { fontSize: 18, color: COLORS.accentBlue, fontWeight: '300' },
  addBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.accentBlue },

  // User / Friend Card
  userCard: { backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 14 },
  userCardSelf: { borderColor: COLORS.accentDim },

  // Card header
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.accentGlow, borderWidth: 2, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarSelf: { backgroundColor: COLORS.accentGlow, borderColor: COLORS.accent },
  avatarText: { fontSize: 16, fontWeight: '800', color: COLORS.accent },
  cardHeaderInfo: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' },
  cardName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.textMuted },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Badges
  selfBadge: { backgroundColor: COLORS.accentGlow, borderRadius: 20, borderWidth: 1, borderColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 2 },
  selfBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.5 },
  relationBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  relationBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // Expand / remove
  expandBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  expandBtnText: { fontSize: 10, color: COLORS.textMuted },
  removeBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.dangerDim, borderWidth: 1, borderColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontSize: 11, color: COLORS.danger, fontWeight: '700' },

  // Adherence bar
  barWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barTrack: { flex: 1, height: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 4 },
  barPct: { fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },

  // Med list
  medList: { marginTop: 12 },
  medListDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: 10 },
  medRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  medDot: { width: 7, height: 7, borderRadius: 4 },
  medRowName: { flex: 1, fontSize: 13, color: COLORS.text, fontWeight: '500' },
  medRowSlot: { fontSize: 11, color: COLORS.textMuted, marginRight: 6, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  medStatus: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  medStatusTaken: { backgroundColor: COLORS.accentGlow, borderWidth: 1, borderColor: COLORS.accent },
  medStatusMissed: { backgroundColor: COLORS.dangerDim, borderWidth: 1, borderColor: COLORS.danger },
  medStatusText: { fontSize: 11, fontWeight: '800' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: COLORS.border, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  modalEyebrow: { fontSize: 11, fontWeight: '700', color: COLORS.accent, letterSpacing: 2.5, marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  modalTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 6 },
  modalSub: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: 24 },

  // Form shared
  fieldBox: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  input: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text },
  inputError: { borderColor: COLORS.danger },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 5, marginLeft: 2 },

  // Relation chips
  relationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relationChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border },
  relationChipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },

  // Submit / cancel
  submitBtn: { backgroundColor: COLORS.accentDim, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 6, borderWidth: 1, borderColor: COLORS.accent, marginBottom: 10 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },

  // Empty state
  emptyState: { marginTop: 8, alignItems: 'center', paddingVertical: 32, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 16 },
  emptyIcon: { fontSize: 34, marginBottom: 12 },
  emptyText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted, marginBottom: 4 },
  emptySubText: { fontSize: 13, color: COLORS.textDim, textAlign: 'center', paddingHorizontal: 24 },

  // Meta (unused in this screen but kept for consistency)
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaIcon: { fontSize: 12, marginRight: 6 },
  metaLabel: { fontSize: 13, color: COLORS.textMuted },
  metaValue: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
});
