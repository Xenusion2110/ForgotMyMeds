// app/login.js

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router"; 
import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";

import styles from "../styles";
import { colors } from "../../constants/colors";
import { auth } from "../../services/firebaseConfig"; 

import { httpsCallable, getFunctions } from "firebase/functions";
const functions = getFunctions();

export default function Login() {
  const router = useRouter();
  const { firstTime } = useLocalSearchParams();

  const scaleLogin = useRef(new Animated.Value(1)).current;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);

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

  const onLogin = async () => {
    Keyboard.dismiss();

    const isFirstTime = String(firstTime) === "1";

    if (isFirstTime && auth.currentUser) {
      router.replace("home/homepage");
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const userCred = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      const getUser = httpsCallable(functions, "getUser");
      const userSnapshot = await getUser();

      console.log("Logged in user:", userCred.user);

      if(isFirstTime) {
        router.replace("duprconnect");
      } else {
        router.replace("/(tabs)/home/dashboard");
      }
      
    } catch (err) {
      Alert.alert("Login failed", err?.message || "Something went wrong.");
      console.log("Login error:", err);
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
          <View style={styles.screen}>
            <View style={styles.content}>
              {/* TITLE */}
              <Text style={styles.title}>Log In</Text>

              <Text style={loginStyles.subTitle}>
                {String(firstTime) === "1"
                  ? "Log in"
                  : "Welcome back — sign in to continue"}
              </Text>

              {/* EMAIL INPUT */}
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={colors.textGray}
                  value={email}
                  onChangeText={setEmail}
                  style={loginStyles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />

              {/* PASSWORD INPUT */}
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={colors.textGray}
                  value={password}
                  onChangeText={setPassword}
                  style={[loginStyles.input, { paddingRight: 44 }]}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={onLogin}
                  onFocus={() => setIsPassFocused(true)}
                  onBlur={() => setIsPassFocused(false)}
                />

                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={10}
                  style={loginStyles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={colors.textGray}
                  />
                </Pressable>

              {/* FORGOT PASSWORD */}
              <Pressable onPress={() => router.push("/forgetpassword")}>
                <Text style={loginStyles.forgotLink}>Forgot Password?</Text>
              </Pressable>

              {/* LOGIN BUTTON */}
              <Pressable
                onPress={onLogin}
                disabled={loading}
                onPressIn={() => !loading && pressIn(scaleLogin)}
                onPressOut={() => !loading && pressOut(scaleLogin)}
                style={[styles.buttonWrapper, loading && { opacity: 0.7 }]}
              >
                <Animated.View
                  style={[
                    styles.animatedWrap,
                    { transform: [{ scale: scaleLogin }] },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.primaryStart, colors.primaryEnd]}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryText}>
                      {loading ? "Logging in..." : "Log In"}
                    </Text>
                  </LinearGradient>
                </Animated.View>
              </Pressable>

              {/* ✅ DEV SHORTCUT (OPTIONAL) */}
              {__DEV__ && (
                <Pressable
                  onPress={() => router.push("home/dashboard")}
                  style={{ marginTop: 14 }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      color: "red",
                      fontWeight: "800",
                    }}
                  >
                    DEV: Skip to Homepage
                  </Text>
                </Pressable>
              )}

              {/* DIVIDER */}
              <View style={styles.divider} />

              {/* CREATE ACCOUNT LINK */}
              <Pressable onPress={() => router.push("/createAccount")}>
                <Text style={loginStyles.bottomLink}>
                  Don’t have an account?{" "}
                  <Text style={loginStyles.bottomLinkBold}>Create one</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const loginStyles = {
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

  input: { fontSize: 18, color: colors.textDark, 
    fontWeight: "600", 
    borderWidth: 1, 
    borderRadius: 14, 
    width: "100%", 
    height: 72, 
    borderColor: colors.border, 
    paddingHorizontal: 20,
    justifyContent: 20,
    marginBottom: 14 
  },

  eyeButton: {
    position: "absolute",
    right: 14,
    height: 72,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  forgotLink: {
    alignSelf: "center",
    marginTop: 2,
    marginBottom: 10,
    fontSize: 15,
    color: colors.textDark,
    fontWeight: "800",
  },

  bottomLink: {
    fontSize: 15,
    color: colors.textGray,
    fontWeight: "700",
    textAlign: "center",
  },

  bottomLinkBold: {
    color: colors.textDark,
    fontWeight: "900",
  },
};