// app/index.js

import React, { useRef } from "react";
import { Text, View, Pressable, Animated, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import styles from "./styles";
import { colors } from "../constants/colors";

import Logo from "../assets/img/Logo.jpg";

export default function MainPage() {
  const router = useRouter();

  const scaleCreate = useRef(new Animated.Value(1)).current;
  const scaleLogin = useRef(new Animated.Value(1)).current;

  const pressIn = (anim) =>
    Animated.spring(anim, { toValue: 0.85, duration: 180, useNativeDriver: true }).start();

  const pressOut = (anim) =>
    Animated.spring(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <View style={styles.content}>
          <Image source={Logo} style={styles.image} />

          <Text style={styles.title}>ForgotMyMeds</Text>

          <Text style={styles.tagline}>Medicine Tracker App</Text>

          <Text style={styles.description}>
            Schedule your medication intake and never for your medicine again!
          </Text>

          {/* CREATE ACCOUNT */}
          <Pressable
            onPress={() => router.push("/createAccount")}
            onPressIn={() => pressIn(scaleCreate)}
            onPressOut={() => pressOut(scaleCreate)}
            style={styles.buttonWrapper}
          >
            <Animated.View
              style={[styles.animatedWrap, { transform: [{ scale: scaleCreate }] }]}
            >
              <LinearGradient
                colors={[colors.primaryStart, colors.primaryEnd]}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryText}>Create Account</Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>

          {/* LOGIN */}
          <Pressable
            onPress={() => router.push("/login")}
            onPressIn={() => pressIn(scaleLogin)}
            onPressOut={() => pressOut(scaleLogin)}
            style={styles.buttonWrapper}
          >
            <Animated.View
              style={[styles.animatedWrap, { transform: [{ scale: scaleLogin }] }]}
            >
              <View style={styles.secondaryButton}>
                <Text style={styles.secondaryText}>Log In</Text>
              </View>
            </Animated.View>
          </Pressable>

          {/* FORGOT PASSWORD */}
          <Pressable onPress={() => router.push("/forgetpassword")}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          {/* DIVIDER */}
          <View style={styles.divider} />

        
        </View>
      </View>
    </SafeAreaView>
  );
}