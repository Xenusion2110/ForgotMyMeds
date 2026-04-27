import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../../constants/colors";
import { auth, callFunction } from "../../services/firebaseConfig";

const SCREEN_COLORS = {
  surface: "#FFFFFF",
  border: "#D8E6D2",
  text: "#132A13",
  muted: "#5C7457",
  pale: "#F4F9F1",
  success: "#238636",
};

const asText = (value) => {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return typeof value === "string" ? value : "";
};

const formatMessageTime = (value) => {
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

const ConversationMessage = ({ item, currentUserId }) => {
  const isOwnMessage = item.senderId === currentUserId;

  return (
    <View style={[styles.messageRow, isOwnMessage && styles.messageRowOwn]}>
      {!isOwnMessage ? (
        <Text style={styles.messageSender}>
          {item.sender?.displayName || item.sender?.email || "Friend"}
        </Text>
      ) : null}
      <View
        style={[
          styles.messageBubble,
          isOwnMessage ? styles.messageBubbleOwn : styles.messageBubbleFriend,
        ]}
      >
        <Text style={[styles.messageText, isOwnMessage && styles.messageTextOwn]}>
          {item.text}
        </Text>
      </View>
      <Text style={styles.messageMeta}>{formatMessageTime(item.createdAt)}</Text>
    </View>
  );
};

export default function MessageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const scrollRef = useRef(null);

  const friendUserId = asText(params.friendId);
  const friendName = asText(params.friendName) || "Messages";
  const friendEmail = asText(params.friendEmail);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");

  const currentUserId = auth.currentUser?.uid || "";

  const screenTitle = useMemo(
    () => (friendName.trim() ? friendName.trim() : "Messages"),
    [friendName]
  );

  const loadConversation = useCallback(async () => {
    if (!friendUserId) {
      return;
    }

    setLoading(true);

    try {
      const response = await callFunction(
        "getFriendMessages",
        { friendUserId },
        { forceRefresh: true }
      );
      setMessages(response.data || []);
    } catch (err) {
      console.error("Conversation load error:", err);
      Alert.alert(
        "Messages",
        err?.message || "We couldn't load this conversation yet."
      );
    } finally {
      setLoading(false);
    }
  }, [friendUserId]);

  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [loadConversation])
  );

  useEffect(() => {
    if (!friendUserId) {
      router.back();
    }
  }, [friendUserId, router]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);

  const onSendMessage = async () => {
    const text = messageDraft.trim();

    if (!friendUserId || !text || sending) {
      return;
    }

    setSending(true);

    try {
      await callFunction(
        "sendFriendMessage",
        {
          recipientId: friendUserId,
          text,
        },
        { forceRefresh: true }
      );
      setMessageDraft("");
      await loadConversation();
    } catch (err) {
      console.error("Send message error:", err);
      Alert.alert(
        "Messages",
        err?.message || "We couldn't send that message yet."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={18} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>FORGOTMYMEDS</Text>
          <Text style={styles.headerTitle}>{screenTitle}</Text>
          <Text style={styles.headerSub}>
            {friendEmail || "Conversation with your friend"}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadConversation} />
        }
      >
        <View style={styles.threadCard}>
          {messages.length ? (
            messages.map((item) => (
              <ConversationMessage
                key={item.id}
                item={item}
                currentUserId={currentUserId}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No messages yet.</Text>
              <Text style={styles.emptySub}>
                Send a quick check-in to get the conversation started.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.composerCard}>
          <Text style={styles.composerLabel}>New Message</Text>
          <TextInput
            value={messageDraft}
            onChangeText={setMessageDraft}
            placeholder="Write a message..."
            placeholderTextColor={SCREEN_COLORS.muted}
            style={styles.messageInput}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageDraft.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={onSendMessage}
            activeOpacity={0.85}
            disabled={!messageDraft.trim() || sending}
          >
            <Text style={styles.sendButtonText}>
              {sending ? "Sending..." : "Send Message"}
            </Text>
          </TouchableOpacity>
        </View>
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
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
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
  threadCard: {
    backgroundColor: SCREEN_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SCREEN_COLORS.border,
    padding: 16,
    gap: 12,
  },
  messageRow: {
    alignItems: "flex-start",
  },
  messageRowOwn: {
    alignItems: "flex-end",
  },
  messageSender: {
    fontSize: 12,
    fontWeight: "700",
    color: SCREEN_COLORS.muted,
    marginBottom: 6,
  },
  messageBubble: {
    maxWidth: "88%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageBubbleFriend: {
    backgroundColor: SCREEN_COLORS.pale,
    borderWidth: 1,
    borderColor: SCREEN_COLORS.border,
  },
  messageBubbleOwn: {
    backgroundColor: SCREEN_COLORS.success,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: SCREEN_COLORS.text,
  },
  messageTextOwn: {
    color: colors.white,
  },
  messageMeta: {
    fontSize: 11,
    color: SCREEN_COLORS.muted,
    marginTop: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: SCREEN_COLORS.text,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: SCREEN_COLORS.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
  composerCard: {
    backgroundColor: SCREEN_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SCREEN_COLORS.border,
    padding: 16,
    gap: 12,
  },
  composerLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: SCREEN_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  messageInput: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SCREEN_COLORS.border,
    backgroundColor: SCREEN_COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: SCREEN_COLORS.text,
  },
  sendButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: SCREEN_COLORS.success,
    borderWidth: 1,
    borderColor: SCREEN_COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  sendButtonDisabled: {
    opacity: 0.65,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
});
