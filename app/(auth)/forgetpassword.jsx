// app/forgetpassword.js

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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import styles from "../styles";
import { colors } from "../../constants/colors";

export default function ForgetPassword() {
  const router = useRouter();

  const scaleReset = useRef(new Animated.Value(1)).current;

  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const onReset = () => {
    Keyboard.dismiss();
    setSubmitted(true);
    // Later: hook up real reset logic (Firebase etc.)
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
              <Text style={styles.title}>Reset</Text>

              <Text style={forgetStyles.subTitle}>
                Enter your email and we’ll send you a reset link.
              </Text>

              {/* EMAIL INPUT */}
              <View
                style={[
                  forgetStyles.inputWrap,
                  isFocused && forgetStyles.inputWrapFocused,
                ]}
              >
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={colors.textGray}
                  value={email}
                  onChangeText={setEmail}
                  style={forgetStyles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="done"
                  onSubmitEditing={onReset}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>

              {submitted && (
                <Text style={forgetStyles.successText}>
                  If an account exists, a reset link has been sent.
                </Text>
              )}

              {/* RESET BUTTON */}
              <Pressable
                onPress={onReset}
                onPressIn={() => pressIn(scaleReset)}
                onPressOut={() => pressOut(scaleReset)}
                style={styles.buttonWrapper}
              >
                <Animated.View
                  style={[
                    styles.animatedWrap,
                    { transform: [{ scale: scaleReset }] },
                  ]}
                >
                  <LinearGradient
                    colors={[colors.primaryStart, colors.primaryEnd]}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryText}>
                      Send Reset Link
                    </Text>
                  </LinearGradient>
                </Animated.View>
              </Pressable>

              {/* DIVIDER */}
              <View style={styles.divider} />

              {/* BACK TO LOGIN */}
              <Pressable onPress={() => router.push("/login")}>
                <Text style={forgetStyles.bottomLink}>
                  Back to{" "}
                  <Text style={forgetStyles.bottomLinkBold}>
                    Log In
                  </Text>
                </Text>
              </Pressable>

            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const forgetStyles = {
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

  input: {
    fontSize: 18,
    color: colors.textDark,
    fontWeight: "600",
  },

  successText: {
    width: "100%",
    marginBottom: 12,
    color: "#16A34A",
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

  bottomLinkBold: {
    color: colors.textDark,
    fontWeight: "900",
  },
};