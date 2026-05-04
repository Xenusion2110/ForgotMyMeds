import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { colors } from "../../../constants/colors";
import { auth, callFunction } from "../../../services/firebaseConfig";
import {
  syncDoseReminderNotifications,
  setupFriendMessaging,
  teardownFriendMessaging,
  unregisterFriendMessagingToken,
} from "../../../services/notifications";

// ── Added Bedtime as fourth slot ──────────────────────────────────────────
const TIMESLOTS = [
  { key: "takesMorning",   label: "Morning" },
  { key: "takesAfternoon", label: "Afternoon" },
  { key: "takesEvening",   label: "Evening" },
  { key: "takesBedtime",   label: "Bedtime" },
];

const DASH_COLORS = {
  surface: "#FFFFFF",
  border: "#D8E6D2",
  text: "#132A13",
  muted: "#5C7457",
  pale: "#F4F9F1",
  success: "#238636",
  successGlow: "rgba(35,134,54,0.12)",
  danger: "#C0362C",
  dangerGlow: "rgba(192,54,44,0.12)",
  warning: "#B97917",
};

// ── Helpers ───────────────────────────────────────────────────────────────
const todayLabel = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const getTodayKey = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getAdherenceSummary = (records = []) => {
  const totalRecords = records.length;
  const takenCount = records.filter((r) => r.taken).length;
  return {
    totalRecords,
    takenCount,
    adherencePercent: totalRecords
      ? Math.round((takenCount / totalRecords) * 100)
      : null,
  };
};

const getAdherenceTone = (percent) => {
  if (percent === null) return DASH_COLORS.muted;
  if (percent >= 80) return DASH_COLORS.success;
  if (percent >= 50) return DASH_COLORS.warning;
  return DASH_COLORS.danger;
};

const getFriendshipStatusLabel = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "";

// Group adherence records by timeSlot label
const groupBySlot = (records = []) => {
  const groups = { Morning: [], Afternoon: [], Evening: [], Bedtime: [] };
  records.forEach((rec) => {
    const slot = rec.timeSlot;
    if (groups[slot]) groups[slot].push(rec);
    else groups.Morning.push(rec); // fallback
  });
  return groups;
};

// ── Micro adherence row — ultra-compact single line ───────────────────────
const MicroAdherenceRow = ({ record }) => (
  <View style={styles.microRow}>
    <View
      style={[
        styles.microDot,
        { backgroundColor: record.taken ? DASH_COLORS.success : DASH_COLORS.danger },
      ]}
    />
    <Text style={styles.microName} numberOfLines={1}>
      {record.medicationName || "Medication"}
    </Text>
    <Text
      style={[
        styles.microState,
        { color: record.taken ? DASH_COLORS.success : DASH_COLORS.danger },
      ]}
    >
      {record.taken ? "✓" : "✕"}
    </Text>
  </View>
);

// ── Slot group inside the adherence block ─────────────────────────────────
const SlotGroup = ({ label, records }) => {
  if (records.length === 0) return null;
  return (
    <View style={styles.slotGroup}>
      <Text style={styles.slotLabel}>{label}</Text>
      {records.map((rec) => (
        <MicroAdherenceRow key={rec.id} record={rec} />
      ))}
    </View>
  );
};

// ── Adherence block shown inside a PersonCard ─────────────────────────────
const AdherenceBlock = ({ records }) => {
  const grouped = useMemo(() => groupBySlot(records), [records]);
  const hasAny = records.length > 0;

  if (!hasAny) return null;

  return (
    <View style={styles.adherenceBlock}>
      {TIMESLOTS.map(({ label }) =>
        grouped[label]?.length > 0 ? (
          <SlotGroup key={label} label={label} records={grouped[label]} />
        ) : null
      )}
    </View>
  );
};

// ── Stats strip ───────────────────────────────────────────────────────────
const SummaryStat = ({ label, value, color }) => (
  <View style={styles.summaryStat}>
    <Text style={[styles.summaryValue, color && { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

// ── Person card ───────────────────────────────────────────────────────────
const PersonCard = ({ title, subtitle, records = [], badge, actions = [] }) => {
  const summary = getAdherenceSummary(records);
  const adherenceColor = getAdherenceTone(summary.adherencePercent);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderCopy}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{title}</Text>
            {badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}
          </View>
          {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.cardStats}>
        <SummaryStat
          label="Taken"
          value={summary.totalRecords ? String(summary.takenCount) : "—"}
          color={summary.totalRecords ? DASH_COLORS.success : undefined}
        />
        <SummaryStat
          label="Total"
          value={summary.totalRecords ? String(summary.totalRecords) : "—"}
        />
        <SummaryStat
          label="Rate"
          value={summary.adherencePercent === null ? "—" : `${summary.adherencePercent}%`}
          color={summary.adherencePercent === null ? undefined : adherenceColor}
        />
      </View>

      {/* Slot-grouped adherence rows */}
      <AdherenceBlock records={records} />

      {/* Action buttons */}
      {actions.length ? (
        <View style={styles.cardActions}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={`${action.label}-${index}`}
              style={[
                styles.cardAction,
                action.tone === "secondary" && styles.cardActionSecondary,
                action.disabled && styles.cardActionDisabled,
              ]}
              onPress={action.onPress}
              activeOpacity={0.85}
              disabled={action.disabled}
            >
              <Text
                style={[
                  styles.cardActionText,
                  action.tone === "secondary" && styles.cardActionTextSecondary,
                ]}
              >
                {action.disabled && action.loadingLabel
                  ? action.loadingLabel
                  : action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [medications, setMedications] = useState([]);
  const [todayAdherence, setTodayAdherence] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [search, setSearch] = useState("");
  const [friendInput, setFriendInput] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);
  const [updatingFriendshipId, setUpdatingFriendshipId] = useState("");
  const [remindingFriendId, setRemindingFriendId] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const today = getTodayKey();
      const [userResponse, medicationsResponse, adherenceResponse, friendshipsResponse] =
        await Promise.all([
          callFunction("getUser", {}, { forceRefresh: true }),
          callFunction("getAllMedications"),
          callFunction("getTodayAdherence", { date: today }),
          callFunction("getUserFriendships", { date: today }),
        ]);

      const medicationList = medicationsResponse.data || [];
      const adherenceList = adherenceResponse.data || [];

      setUserProfile(userResponse.data || null);
      setMedications(medicationList);
      setTodayAdherence(adherenceList);
      setFriendships(
        (friendshipsResponse.data || []).filter((entry) => entry?.friend)
      );

      await syncDoseReminderNotifications({
        medications: medicationList,
        adherenceRecords: adherenceList,
      });
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  useEffect(() => {
    setupFriendMessaging().catch((err) => {
      console.log("Friend messaging setup error:", err?.message || err);
    });
    return () => teardownFriendMessaging();
  }, []);

  const onLogout = async () => {
    try {
      await unregisterFriendMessagingToken();
      await signOut(auth);
      router.replace("/");
    } catch (err) {
      console.log("Logout error:", err);
    }
  };

  const onAddFriend = async () => {
    const value = friendInput.trim();
    if (!value || addingFriend) return;
    setAddingFriend(true);
    try {
      const payload = value.includes("@")
        ? { recipientEmail: value }
        : { recipientId: value };
      await callFunction("createFriendshipRequest", payload, { forceRefresh: true });
      setFriendInput("");
      setShowAddFriend(false);
      await loadDashboard();
      Alert.alert("Friend Request Sent", "Your friend request has been added.");
    } catch (err) {
      console.error("Add friend error:", err);
      Alert.alert("Add Friend", err?.message || "We couldn't send that friend request yet.");
    } finally {
      setAddingFriend(false);
    }
  };

  const onAcceptInvitation = async (friendshipId) => {
    if (!friendshipId || updatingFriendshipId) return;
    setUpdatingFriendshipId(friendshipId);
    try {
      await callFunction(
        "updateFriendshipStatus",
        { friendshipId, status: "accepted" },
        { forceRefresh: true }
      );
      await loadDashboard();
      Alert.alert("Invitation Accepted", "Your friend invitation was accepted.");
    } catch (err) {
      console.error("Accept friend error:", err);
      Alert.alert("Accept Invitation", err?.message || "We couldn't accept that invitation yet.");
    } finally {
      setUpdatingFriendshipId("");
    }
  };

  const onRemindFriend = async (friendId) => {
    if (!friendId || remindingFriendId) return;
    setRemindingFriendId(friendId);
    try {
      const response = await callFunction(
        "sendFriendReminder",
        { recipientId: friendId },
        { forceRefresh: true }
      );

      Alert.alert(
        "Reminder Sent",
        response?.data?.delivered
          ? "Your reminder is on its way."
          : "We couldn't reach your friend right now."
      );
    } catch (err) {
      console.error("Friend reminder error:", err);
      Alert.alert("Send Reminder", err?.message || "We couldn't send that reminder yet.");
    } finally {
      setRemindingFriendId("");
    }
  };

  const filteredFriendships = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return friendships;
    return friendships.filter((entry) => {
      const name = entry.friend?.displayName?.toLowerCase() || "";
      const email = entry.friend?.email?.toLowerCase() || "";
      return name.includes(query) || email.includes(query);
    });
  }, [friendships, search]);

  const userName =
    userProfile?.displayName || auth.currentUser?.displayName || "Your account";
  const userSubtitle = userProfile?.email || auth.currentUser?.email || "";
  const currentUserId = userProfile?.userId || auth.currentUser?.uid || "";

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View>
          <Text style={styles.headerEyebrow}>FORGOTMYMEDS</Text>
          <Text style={styles.headerTitle}>Home</Text>
          <Text style={styles.headerSub}>{todayLabel()}</Text>
        </View>
        <Pressable onPress={onLogout} hitSlop={10}>
          <Ionicons name="log-out-outline" size={28} color={colors.white} />
        </Pressable>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadDashboard} />
        }
      >
        {/* ── Your Adherence ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Adherence</Text>
        </View>

        <PersonCard
          title={userName}
          subtitle={userSubtitle}
          records={todayAdherence}
          badge="You"
        />

        {/* ── Friends ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <TouchableOpacity
            style={styles.addFriendButton}
            onPress={() => setShowAddFriend((c) => !c)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={showAddFriend ? "close" : "person-add"}
              size={14}
              color={DASH_COLORS.success}
            />
            <Text style={styles.addFriendButtonText}>
              {showAddFriend ? "Close" : "Add Friend"}
            </Text>
          </TouchableOpacity>
        </View>

        {showAddFriend ? (
          <View style={styles.addFriendCard}>
            <Text style={styles.addFriendTitle}>Send a friend request</Text>
            <Text style={styles.addFriendSub}>
              Enter your friend's email or account ID.
            </Text>
            <View style={styles.searchBox}>
              <Ionicons name="person-add-outline" size={18} color={DASH_COLORS.muted} />
              <TextInput
                placeholder="friend@email.com or account ID"
                placeholderTextColor={DASH_COLORS.muted}
                style={styles.searchInput}
                value={friendInput}
                onChangeText={setFriendInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.primaryAction,
                (!friendInput.trim() || addingFriend) && styles.primaryActionDisabled,
              ]}
              onPress={onAddFriend}
              activeOpacity={0.85}
              disabled={!friendInput.trim() || addingFriend}
            >
              <Text style={styles.primaryActionText}>
                {addingFriend ? "Sending..." : "Send Request"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={DASH_COLORS.muted} />
          <TextInput
            placeholder="Search friends..."
            placeholderTextColor={DASH_COLORS.muted}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {filteredFriendships.length ? (
          filteredFriendships.map((entry) => {
            const canAccept =
              entry.status === "pending" && entry.recipientId === currentUserId;
            const canMessage =
              entry.status === "accepted" && Boolean(entry.friend?.id);
            const actions = [];

            if (canAccept) {
              actions.push({
                label: "Accept Invitation",
                loadingLabel: "Saving...",
                onPress: () => onAcceptInvitation(entry.id),
                disabled: updatingFriendshipId === entry.id,
              });
            }

            if (canMessage) {
              actions.push({
                label: "Messages",
                onPress: () =>
                  router.push({
                    pathname: "/messages/[friendId]",
                    params: {
                      friendId: entry.friend.id,
                      friendName: entry.friend.displayName || "",
                      friendEmail: entry.friend.email || "",
                    },
                  }),
                tone: "secondary",
              });
              actions.push({
                label: "Remind",
                loadingLabel: "Sending...",
                onPress: () => onRemindFriend(entry.friend.id),
                disabled: remindingFriendId === entry.friend.id,
              });
            }

            return (
              <PersonCard
                key={entry.id}
                title={entry.friend?.displayName || "Unknown user"}
                subtitle={entry.friend?.email || ""}
                records={entry.adherence?.records || []}
                badge={getFriendshipStatusLabel(entry.status)}
                actions={actions}
              />
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No friend adherence to show yet.</Text>
            <Text style={styles.emptySub}>
              Friend cards stay blank until there is activity to show.
            </Text>
          </View>
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
  header: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerEyebrow: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    opacity: 0.9,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  headerSub: {
    color: colors.white,
    opacity: 0.9,
    fontSize: 13,
    marginTop: 4,
  },
  scroll: { flex: 1 },
  content: {
    padding: 18,
    paddingBottom: 48,
    gap: 14,
  },

  // ── Stats strip ──
  summaryStat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: DASH_COLORS.text,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: DASH_COLORS.muted,
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Section headers ──
  sectionHeader: { marginTop: 6 },
  sectionHeaderRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: DASH_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── Add friend button ──
  addFriendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EAF6E5",
    borderWidth: 1,
    borderColor: "#BED9B5",
  },
  addFriendButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: DASH_COLORS.success,
  },

  // ── Person card ──
  card: {
    backgroundColor: DASH_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DASH_COLORS.border,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start" },
  cardHeaderCopy: { flex: 1 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: DASH_COLORS.text,
  },
  badge: {
    backgroundColor: "#EAF6E5",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BED9B5",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: DASH_COLORS.success,
  },
  cardSubtitle: {
    fontSize: 12,
    color: DASH_COLORS.muted,
    marginTop: 3,
  },
  cardStats: {
    flexDirection: "row",
    backgroundColor: DASH_COLORS.pale,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cardAction: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: DASH_COLORS.success,
    borderWidth: 1,
    borderColor: DASH_COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    flexGrow: 1,
  },
  cardActionSecondary: {
    backgroundColor: DASH_COLORS.surface,
    borderColor: DASH_COLORS.border,
  },
  cardActionDisabled: { opacity: 0.65 },
  cardActionText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  cardActionTextSecondary: { color: DASH_COLORS.text },

  // ── Adherence block (slot-grouped) ──
  adherenceBlock: {
    borderTopWidth: 1,
    borderTopColor: DASH_COLORS.border,
    paddingTop: 10,
    gap: 10,
  },

  // ── Slot group ──
  slotGroup: { gap: 4 },
  slotLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: DASH_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  // ── Micro adherence row ──
  microRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 7,
    backgroundColor: DASH_COLORS.pale,
  },
  microDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  microName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: DASH_COLORS.text,
  },
  microState: {
    fontSize: 12,
    fontWeight: "800",
  },

  // ── Search / add-friend ──
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DASH_COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DASH_COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: DASH_COLORS.text,
  },
  addFriendCard: {
    backgroundColor: DASH_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DASH_COLORS.border,
    padding: 16,
    gap: 12,
  },
  addFriendTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: DASH_COLORS.text,
  },
  addFriendSub: {
    fontSize: 13,
    lineHeight: 19,
    color: DASH_COLORS.muted,
  },
  primaryAction: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: DASH_COLORS.success,
    borderWidth: 1,
    borderColor: DASH_COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryActionDisabled: { opacity: 0.65 },
  primaryActionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },

  // ── Empty state ──
  emptyState: {
    borderWidth: 1,
    borderColor: DASH_COLORS.border,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: DASH_COLORS.surface,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: DASH_COLORS.text,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: DASH_COLORS.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
});
