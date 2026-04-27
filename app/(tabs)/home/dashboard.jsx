import React, { useCallback, useMemo, useState } from "react";
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

const DASH_COLORS = {
  surface: "#FFFFFF",
  border: "#D8E6D2",
  text: "#132A13",
  muted: "#5C7457",
  pale: "#F4F9F1",
  success: "#238636",
  danger: "#C0362C",
  warning: "#B97917",
};

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const getTodayKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getAdherenceSummary = (records = []) => {
  const totalRecords = records.length;
  const takenCount = records.filter((record) => record.taken).length;

  return {
    totalRecords,
    takenCount,
    adherencePercent: totalRecords
      ? Math.round((takenCount / totalRecords) * 100)
      : null,
  };
};

const getAdherenceTone = (percent) => {
  if (percent === null) {
    return DASH_COLORS.muted;
  }

  if (percent >= 80) {
    return DASH_COLORS.success;
  }

  if (percent >= 50) {
    return DASH_COLORS.warning;
  }

  return DASH_COLORS.danger;
};

const getFriendshipStatusLabel = (status) => {
  if (!status) {
    return "";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
};

const AdherenceRow = ({ record }) => (
  <View style={styles.recordRow}>
    <View
      style={[
        styles.recordDot,
        { backgroundColor: record.taken ? DASH_COLORS.success : DASH_COLORS.danger },
      ]}
    />
    <View style={styles.recordCopy}>
      <Text style={styles.recordMedication}>
        {record.medicationName || "Medication"}
      </Text>
      <Text style={styles.recordMeta}>
        {record.timeSlot || "Dose"}
        {record.date ? `  |  ${record.date}` : ""}
      </Text>
    </View>
    <Text
      style={[
        styles.recordState,
        { color: record.taken ? DASH_COLORS.success : DASH_COLORS.danger },
      ]}
    >
      {record.taken ? "Taken" : "Missed"}
    </Text>
  </View>
);

const SummaryStat = ({ label, value, color }) => (
  <View style={styles.summaryStat}>
    <Text style={[styles.summaryValue, color && { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const PersonCard = ({
  title,
  subtitle,
  records = [],
  badge,
  actionLabel,
  onAction,
  actionDisabled = false,
}) => {
  const summary = getAdherenceSummary(records);
  const adherenceColor = getAdherenceTone(summary.adherencePercent);

  return (
    <View style={styles.card}>
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

      <View style={styles.cardStats}>
        <SummaryStat
          label="Taken"
          value={summary.totalRecords ? String(summary.takenCount) : ""}
          color={summary.totalRecords ? DASH_COLORS.success : undefined}
        />
        <SummaryStat
          label="Records"
          value={summary.totalRecords ? String(summary.totalRecords) : ""}
        />
        <SummaryStat
          label="Adherence"
          value={
            summary.adherencePercent === null ? "" : `${summary.adherencePercent}%`
          }
          color={summary.adherencePercent === null ? undefined : adherenceColor}
        />
      </View>

      {actionLabel ? (
        <TouchableOpacity
          style={[
            styles.cardAction,
            actionDisabled && styles.cardActionDisabled,
          ]}
          onPress={onAction}
          activeOpacity={0.85}
          disabled={actionDisabled}
        >
          <Text style={styles.cardActionText}>
            {actionDisabled ? "Saving..." : actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}

      {records.length ? (
        <View style={styles.recordsWrap}>
          {records.map((record) => (
            <AdherenceRow key={record.id} record={record} />
          ))}
        </View>
      ) : null}
    </View>
  );
};

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

      setUserProfile(userResponse.data || null);
      setMedications(medicationsResponse.data || []);
      setTodayAdherence(adherenceResponse.data || []);
      setFriendships(
        (friendshipsResponse.data || []).filter((entry) => entry?.friend)
      );
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

  const onLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch (err) {
      console.log("Logout error:", err);
    }
  };

  const onAddFriend = async () => {
    const value = friendInput.trim();

    if (!value || addingFriend) {
      return;
    }

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
      Alert.alert(
        "Add Friend",
        err?.message || "We couldn't send that friend request yet."
      );
    } finally {
      setAddingFriend(false);
    }
  };

  const onAcceptInvitation = async (friendshipId) => {
    if (!friendshipId || updatingFriendshipId) {
      return;
    }

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
      Alert.alert(
        "Accept Invitation",
        err?.message || "We couldn't accept that invitation yet."
      );
    } finally {
      setUpdatingFriendshipId("");
    }
  };

  const filteredFriendships = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return friendships;
    }

    return friendships.filter((entry) => {
      const displayName = entry.friend?.displayName?.toLowerCase() || "";
      const email = entry.friend?.email?.toLowerCase() || "";

      return displayName.includes(query) || email.includes(query);
    });
  }, [friendships, search]);

  const userName =
    userProfile?.displayName || auth.currentUser?.displayName || "Your account";
  const userSubtitle = userProfile?.email || auth.currentUser?.email || "";
  const currentUserId = userProfile?.userId || auth.currentUser?.uid || "";

  const summary = getAdherenceSummary(todayAdherence);

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
        <View style={styles.summaryStrip}>
          <SummaryStat label="Medications" value={String(medications.length)} />
          <SummaryStat
            label="Records"
            value={summary.totalRecords ? String(summary.totalRecords) : ""}
          />
          <SummaryStat
            label="Taken"
            value={summary.totalRecords ? String(summary.takenCount) : ""}
            color={summary.totalRecords ? DASH_COLORS.success : undefined}
          />
          <SummaryStat
            label="Friends"
            value={String(friendships.length)}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Adherence</Text>
        </View>

        <PersonCard
          title={userName}
          subtitle={userSubtitle}
          records={todayAdherence}
          badge="You"
        />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <TouchableOpacity
            style={styles.addFriendButton}
            onPress={() => setShowAddFriend((current) => !current)}
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
              Enter your friend's email or their user ID.
            </Text>
            <View style={styles.searchBox}>
              <Ionicons name="person-add-outline" size={18} color={DASH_COLORS.muted} />
              <TextInput
                placeholder="friend@email.com or user ID"
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
              entry.status === "pending" &&
              entry.recipientId === currentUserId;

            return (
              <PersonCard
                key={entry.id}
                title={entry.friend?.displayName || "Unknown user"}
                subtitle={entry.friend?.email || ""}
                records={entry.adherence?.records || []}
                badge={getFriendshipStatusLabel(entry.status)}
                actionLabel={canAccept ? "Accept Invitation" : ""}
                onAction={
                  canAccept ? () => onAcceptInvitation(entry.id) : undefined
                }
                actionDisabled={updatingFriendshipId === entry.id}
              />
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No friend adherence to show yet.</Text>
            <Text style={styles.emptySub}>
              Friend cards stay blank until matching records exist in Firebase.
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 48,
    gap: 14,
  },
  summaryStrip: {
    flexDirection: "row",
    backgroundColor: DASH_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DASH_COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  summaryStat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "800",
    color: DASH_COLORS.text,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: DASH_COLORS.muted,
    marginTop: 4,
    textTransform: "uppercase",
  },
  sectionHeader: {
    marginTop: 6,
  },
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
  card: {
    backgroundColor: DASH_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DASH_COLORS.border,
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardHeaderCopy: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 18,
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
    fontSize: 13,
    color: DASH_COLORS.muted,
    marginTop: 4,
  },
  cardStats: {
    flexDirection: "row",
    backgroundColor: DASH_COLORS.pale,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  cardAction: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: DASH_COLORS.success,
    borderWidth: 1,
    borderColor: DASH_COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  cardActionDisabled: {
    opacity: 0.65,
  },
  cardActionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  recordsWrap: {
    gap: 10,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recordCopy: {
    flex: 1,
  },
  recordMedication: {
    fontSize: 14,
    fontWeight: "700",
    color: DASH_COLORS.text,
  },
  recordMeta: {
    fontSize: 12,
    color: DASH_COLORS.muted,
    marginTop: 2,
  },
  recordState: {
    fontSize: 12,
    fontWeight: "700",
  },
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
  primaryActionDisabled: {
    opacity: 0.65,
  },
  primaryActionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
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
