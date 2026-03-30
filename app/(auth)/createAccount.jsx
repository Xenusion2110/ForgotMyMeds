// app/createAccount.js

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Alert,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import styles from "../styles";
import { colors } from "../../constants/colors";

// ✅ Firebase Auth
import { auth } from "../../services/firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

export default function CreateAccount() {
  const router = useRouter();
  const scaleCreate = useRef(new Animated.Value(1)).current;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [focused, setFocused] = useState({
    first: false,
    last: false,
    email: false,
    pass: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);

  const pressIn = (anim) =>
    Animated.timing(anim, {
      toValue: 0.97,
      duration: 140,
      useNativeDriver: true,
    }).start();

  const pressOut = (anim) =>
    Animated.timing(anim, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true,
    }).start();

  const passwordsMatch =
    password.length === 0 && confirmPassword.length === 0
      ? true
      : password === confirmPassword;

  const friendlyAuthError = (code) => {
    switch (code) {
      case "auth/invalid-email":
        return "That email address looks invalid.";
      case "auth/email-already-in-use":
        return "An account with that email already exists.";
      case "auth/weak-password":
        return "Password is too weak. Try at least 6 characters.";
      case "auth/network-request-failed":
        return "Network error. Check your internet connection and try again.";
      default:
        return "Could not create your account. Please try again.";
    }
  };

  const onCreate = async () => {
    Keyboard.dismiss();
    if (loading) return;

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanFirst ||
      !cleanLast ||
      !cleanEmail ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Missing Info", "Please fill out all fields.");
      return;
    }

    if (!passwordsMatch) {
      Alert.alert(
        "Passwords Don't Match",
        "Please make sure both passwords match."
      );
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      await updateProfile(cred.user, {
        displayName: `${cleanFirst} ${cleanLast}`.trim(),
      });

      // ✅ Go to login ONLY after they press OK
      Alert.alert(
        "Account Created",
        "Your account was created. Please log in.",
        [
          {
            text: "OK",
            onPress: () =>
              router.replace({
                pathname: "/login",
                params: { firstTime: "1" },
              }),
          },
        ]
      );
    } catch (err) {
      Alert.alert("Sign Up Failed", friendlyAuthError(err?.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View style={styles.screen}>
              <View style={styles.content}>
                <Text style={styles.title}>Create</Text>
                <Text style={createStyles.subTitle}>
                  Make your Smashr account in seconds
                </Text>

                {/* FIRST NAME */}
                <View
                  style={[
                    createStyles.inputWrap,
                    focused.first && createStyles.inputWrapFocused,
                  ]}
                >
                  <TextInput
                    placeholder="First Name"
                    placeholderTextColor={colors.textGray}
                    value={firstName}
                    onChangeText={setFirstName}
                    style={createStyles.input}
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="givenName"
                    returnKeyType="next"
                    onFocus={() => setFocused((p) => ({ ...p, first: true }))}
                    onBlur={() => setFocused((p) => ({ ...p, first: false }))}
                  />
                </View>

                {/* LAST NAME */}
                <View
                  style={[
                    createStyles.inputWrap,
                    focused.last && createStyles.inputWrapFocused,
                  ]}
                >
                  <TextInput
                    placeholder="Last Name"
                    placeholderTextColor={colors.textGray}
                    value={lastName}
                    onChangeText={setLastName}
                    style={createStyles.input}
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="familyName"
                    returnKeyType="next"
                    onFocus={() => setFocused((p) => ({ ...p, last: true }))}
                    onBlur={() => setFocused((p) => ({ ...p, last: false }))}
                  />
                </View>

                {/* EMAIL */}
                <View
                  style={[
                    createStyles.inputWrap,
                    focused.email && createStyles.inputWrapFocused,
                  ]}
                >
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor={colors.textGray}
                    value={email}
                    onChangeText={setEmail}
                    style={createStyles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onFocus={() => setFocused((p) => ({ ...p, email: true }))}
                    onBlur={() => setFocused((p) => ({ ...p, email: false }))}
                  />
                </View>

                {/* PASSWORD */}
                <View
                  style={[
                    createStyles.inputWrap,
                    focused.pass && createStyles.inputWrapFocused,
                  ]}
                >
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={colors.textGray}
                    value={password}
                    onChangeText={setPassword}
                    style={[createStyles.input, { paddingRight: 44 }]}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onFocus={() => setFocused((p) => ({ ...p, pass: true }))}
                    onBlur={() => setFocused((p) => ({ ...p, pass: false }))}
                  />

                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={10}
                    style={createStyles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color={colors.textGray}
                    />
                  </Pressable>
                </View>

                {/* CONFIRM PASSWORD */}
                <View
                  style={[
                    createStyles.inputWrap,
                    focused.confirm && createStyles.inputWrapFocused,
                    !passwordsMatch && createStyles.inputWrapError,
                  ]}
                >
                  <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor={colors.textGray}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={[createStyles.input, { paddingRight: 44 }]}
                    secureTextEntry={!showConfirm}
                    textContentType="newPassword"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={onCreate}
                    onFocus={() => setFocused((p) => ({ ...p, confirm: true }))}
                    onBlur={() => setFocused((p) => ({ ...p, confirm: false }))}
                  />

                  <Pressable
                    onPress={() => setShowConfirm((v) => !v)}
                    hitSlop={10}
                    style={createStyles.eyeButton}
                  >
                    <Ionicons
                      name={showConfirm ? "eye-off" : "eye"}
                      size={20}
                      color={colors.textGray}
                    />
                  </Pressable>
                </View>

                {!passwordsMatch ? (
                  <Text style={createStyles.errorText}>
                    Passwords do not match.
                  </Text>
                ) : null}

                {/* CREATE BUTTON */}
                <Pressable
                  onPress={onCreate}
                  onPressIn={() => pressIn(scaleCreate)}
                  onPressOut={() => pressOut(scaleCreate)}
                  style={styles.buttonWrapper}
                  disabled={loading}
                >
                  <Animated.View
                    style={[
                      styles.animatedWrap,
                      {
                        transform: [{ scale: scaleCreate }],
                        opacity: loading ? 0.7 : 1,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[colors.primaryStart, colors.primaryEnd]}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryText}>
                        {loading ? "Creating..." : "Create Account"}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                </Pressable>

                {/* ✅ DEV SHORTCUT (OPTIONAL) */}
                {__DEV__ && (
                  <Pressable
                    onPress={() => router.push("/duprconnect")}
                    style={{ marginTop: 14 }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        color: "red",
                        fontWeight: "800",
                      }}
                    >
                      DEV: Skip to DUPR Connect
                    </Text>
                  </Pressable>
                )}

                <View style={styles.divider} />

                <Pressable onPress={() => router.push("/login")}>
                  <Text style={createStyles.bottomLink}>
                    Already have an account?{" "}
                    <Text style={createStyles.bottomLinkBold}>Log in</Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const createStyles = {
  subTitle: {
    fontSize: 16,
    color: colors.textGray,
    marginTop: 8,
    marginBottom: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  inputWrap: {
    width: "100%",
    height: 72,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    justifyContent: "center",
    marginBottom: 14,
  },
  inputWrapFocused: {
    borderColor: colors.primaryEnd,
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  inputWrapError: { borderColor: "#EF4444" },
  input: { fontSize: 18, color: colors.textDark, fontWeight: "600" },
  eyeButton: {
    position: "absolute",
    right: 14,
    height: 72,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    width: "100%",
    marginTop: -6,
    marginBottom: 10,
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "left",
  },
  bottomLink: {
    fontSize: 15,
    color: colors.textGray,
    fontWeight: "700",
    textAlign: "center",
  },
  bottomLinkBold: { color: colors.textDark, fontWeight: "900" },
};