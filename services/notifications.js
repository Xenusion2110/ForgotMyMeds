import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { auth, callFunction } from "./firebaseConfig";

const REMINDER_CHANNEL_ID = "dose-reminders";
const MESSAGE_CHANNEL_ID = "friend-messages";
const FRIEND_REMINDER_CHANNEL_ID = "friend-reminders";

const SLOT_CONFIG = [
  {
    identifier: "dose-reminder-morning",
    label: "Morning",
    medicationKey: "takesMorning",
    hour: 11,
    minute: 0,
  },
  {
    identifier: "dose-reminder-afternoon",
    label: "Afternoon",
    medicationKey: "takesAfternoon",
    hour: 16,
    minute: 0,
  },
  {
    identifier: "dose-reminder-evening",
    label: "Evening",
    medicationKey: "takesEvening",
    hour: 21,
    minute: 0,
  },
  {
    identifier: "dose-reminder-bedtime",
    label: "Bedtime",
    medicationKey: "takesBedtime",
    hour: 23,
    minute: 0,
  },
];

let notificationsConfigured = false;
let cachedMessagingModule;
let tokenRefreshUnsubscribe = null;
let foregroundMessageUnsubscribe = null;
let notificationOpenUnsubscribe = null;

const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  Constants.appOwnership === "expo";

const canUseNativeMessaging = () => Platform.OS !== "web" && !isExpoGo;

const hasGrantedPermission = (settings) =>
  Boolean(
    settings?.granted ||
      settings?.ios?.status ===
        Notifications.IosAuthorizationStatus?.PROVISIONAL
  );

const buildBodyForPendingSlot = (slotLabel, pendingCount) => {
  if (pendingCount <= 0) {
    return `Check in on your ${slotLabel.toLowerCase()} medications.`;
  }

  if (pendingCount === 1) {
    return `You still have a ${slotLabel.toLowerCase()} dose to take or check off.`;
  }

  return `You still have ${pendingCount} ${slotLabel.toLowerCase()} doses to take or check off.`;
};

const getTomorrowAt = (hour, minute) => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(hour, minute, 0, 0);
  return next;
};

const getTodayAt = (hour, minute) => {
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  return next;
};

const getNativeMessaging = () => {
  if (!canUseNativeMessaging()) {
    return null;
  }

  if (cachedMessagingModule !== undefined) {
    return cachedMessagingModule;
  }

  try {
    const module = require("@react-native-firebase/messaging");
    cachedMessagingModule = module.default || module;
  } catch (err) {
    console.log("Native messaging unavailable:", err?.message || err);
    cachedMessagingModule = null;
  }

  return cachedMessagingModule;
};

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const configureNotificationPresentation = () => {
  if (notificationsConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  notificationsConfigured = true;
};

const ensureAndroidChannel = async (channelId, name) => {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(channelId, {
    name,
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
  });
};

export const ensureLocalNotificationPermissions = async () => {
  configureNotificationPresentation();

  await Promise.all([
    ensureAndroidChannel(REMINDER_CHANNEL_ID, "Dose reminders"),
    ensureAndroidChannel(MESSAGE_CHANNEL_ID, "Friend messages"),
    ensureAndroidChannel(FRIEND_REMINDER_CHANNEL_ID, "Friend reminders"),
  ]);

  const existingPermissions = await Notifications.getPermissionsAsync();
  if (hasGrantedPermission(existingPermissions)) {
    return true;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  return hasGrantedPermission(requestedPermissions);
};

export const clearDoseReminderNotifications = async () => {
  await Promise.all(
    SLOT_CONFIG.map((slot) =>
      Notifications.cancelScheduledNotificationAsync(slot.identifier).catch(() => {})
    )
  );
};

export const syncDoseReminderNotifications = async ({
  medications,
  adherenceRecords,
} = {}) => {
  if (!auth.currentUser) {
    await clearDoseReminderNotifications();
    return;
  }

  const permissionGranted = await ensureLocalNotificationPermissions();
  if (!permissionGranted) {
    return;
  }

  const today = getLocalDateKey();
  const medicationList =
    Array.isArray(medications)
      ? medications
      : (await callFunction("getAllMedications", {}, { forceRefresh: true })).data || [];
  const todayRecords =
    Array.isArray(adherenceRecords)
      ? adherenceRecords.filter((record) => record?.date === today)
      : (await callFunction("getTodayAdherence", { date: today }, { forceRefresh: true })).data || [];

  for (const slot of SLOT_CONFIG) {
    await Notifications.cancelScheduledNotificationAsync(slot.identifier).catch(() => {});

    const slotMedications = medicationList.filter((medication) =>
      Boolean(medication?.[slot.medicationKey])
    );

    if (!slotMedications.length) {
      continue;
    }

    const takenMedicationIds = new Set(
      todayRecords
        .filter((record) => record?.timeSlot === slot.label && record?.taken)
        .map((record) => record?.medicationId)
        .filter(Boolean)
    );

    const pendingCount = slotMedications.filter(
      (medication) => !takenMedicationIds.has(medication.id)
    ).length;
    const cutoffToday = getTodayAt(slot.hour, slot.minute);
    const triggerDate =
      pendingCount > 0 && Date.now() < cutoffToday.getTime()
        ? cutoffToday
        : getTomorrowAt(slot.hour, slot.minute);

    await Notifications.scheduleNotificationAsync({
      identifier: slot.identifier,
      content: {
        title: `${slot.label} dose check-in`,
        body: buildBodyForPendingSlot(slot.label, pendingCount),
        data: {
          type: "dose-reminder",
          timeSlot: slot.label,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        ...(Platform.OS === "android" ? { channelId: REMINDER_CHANNEL_ID } : {}),
      },
    });
  }
};

const saveMessagingToken = async (token) => {
  if (!token || !auth.currentUser) {
    return null;
  }

  await callFunction(
    "registerMessagingToken",
    {
      token,
      platform: Platform.OS,
    },
    { forceRefresh: true }
  );

  return token;
};

const showForegroundMessageNotification = async (remoteMessage) => {
  const title =
    remoteMessage?.notification?.title ||
    remoteMessage?.data?.title ||
    "New message";
  const body = remoteMessage?.notification?.body || remoteMessage?.data?.body || "";
  const channelId =
    remoteMessage?.data?.type === "friend-reminder"
      ? FRIEND_REMINDER_CHANNEL_ID
      : MESSAGE_CHANNEL_ID;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: remoteMessage?.data || {},
      ...(Platform.OS === "android" ? { channelId } : {}),
    },
    trigger: null,
  });
};

export const teardownFriendMessaging = () => {
  foregroundMessageUnsubscribe?.();
  foregroundMessageUnsubscribe = null;

  notificationOpenUnsubscribe?.();
  notificationOpenUnsubscribe = null;

  tokenRefreshUnsubscribe?.();
  tokenRefreshUnsubscribe = null;
};

export const unregisterFriendMessagingToken = async () => {
  const messaging = getNativeMessaging();
  if (!messaging || !auth.currentUser) {
    teardownFriendMessaging();
    return;
  }

  try {
    const token = await messaging().getToken();
    if (token) {
      await callFunction(
        "unregisterMessagingToken",
        { token },
        { forceRefresh: true }
      );
    }
  } catch (err) {
    console.log("Messaging token unregister error:", err?.message || err);
  } finally {
    teardownFriendMessaging();
  }
};

export const setupFriendMessaging = async ({
  onMessageReceived,
  shouldShowForegroundNotification,
} = {}) => {
  if (!auth.currentUser) {
    teardownFriendMessaging();
    return {
      available: false,
      reason: "signed-out",
    };
  }

  const messaging = getNativeMessaging();
  if (!messaging) {
    return {
      available: false,
      reason: isExpoGo ? "expo-go" : "native-unavailable",
    };
  }

  const permissionGranted = await ensureLocalNotificationPermissions();
  if (!permissionGranted) {
    return {
      available: false,
      reason: "notifications-denied",
    };
  }

  const messagingInstance = messaging();

  if (Platform.OS === "ios") {
    await messagingInstance.registerDeviceForRemoteMessages();
    const status = await messagingInstance.requestPermission();
    const enabled =
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      return {
        available: false,
        reason: "messaging-denied",
      };
    }
  }

  const token = await messagingInstance.getToken();
  await saveMessagingToken(token);

  tokenRefreshUnsubscribe?.();
  tokenRefreshUnsubscribe = messagingInstance.onTokenRefresh((nextToken) => {
    saveMessagingToken(nextToken).catch((err) => {
      console.log("Messaging token refresh error:", err?.message || err);
    });
  });

  foregroundMessageUnsubscribe?.();
  foregroundMessageUnsubscribe = messagingInstance.onMessage(async (remoteMessage) => {
    if (shouldShowForegroundNotification?.(remoteMessage) !== false) {
      await showForegroundMessageNotification(remoteMessage);
    }
    onMessageReceived?.(remoteMessage);
  });

  notificationOpenUnsubscribe?.();
  notificationOpenUnsubscribe = messagingInstance.onNotificationOpenedApp(
    (remoteMessage) => {
      onMessageReceived?.(remoteMessage);
    }
  );

  return {
    available: true,
    token,
  };
};
