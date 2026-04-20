// app/index.js

import React, { useRef, useState, useEffect } from "react";
import { Text, View, Pressable, Animated, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { httpsCallable, getFunctions } from "firebase/functions";
import { auth } from "../services/firebaseConfig";
const functions = getFunctions();

import styles from "./styles";
import { colors } from "../constants/colors";

import Logo from "../assets/img/Logo.jpg";

export default function App() {
  const router = useRouter();

  const scaleCreate = useRef(new Animated.Value(1)).current;
  const scaleLogin = useRef(new Animated.Value(1)).current;


  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name,setName] = useState("");
  const [dose, setDose] = useState("");
  const [capsuleQuantity, setCapsuleQuantity] = useState("");
  const [takesMorning, setTakesMorning] = useState(false);
  const[takesAfternoon, setTakesAfternoon] = useState(false);
  const [takesEvening, setTakesEvening] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const getAllMedications = httpsCallable(functions, "getAllMedications");
      const result = await getAllMedications();
      setMedications(result.data || []);
    } catch (err) {
      console.error("Error fetching meds:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async () => {
    try {
      setLoading(true);
      const createMedication = httpsCallable(functions, "createMedication");
      await createMedication ({
        name,
        dose,
        capsuleQuantity: parseInt(capsuleQuantity),
        takesMorning,
        takesAfternoon,
        takesEvening,
        notes,
      });

      setName("");
      setDose("");
      setCapsuleQuantity("");
      setTakesMorning(false);
      setTakesAfternoon(false);
      setTakesEvening(false);
      setNotes("");
      setShowForm(false);
      fetchMedications();
    } catch (err){
      console.error("Error adding meds:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedication = async (medicationId) => {
    try{
      const deleteMedication = httpsCallable(functions, "deleteMedication");
      await deleteMedication({ medicationId });
      fetchMedications();
    } catch (err) {
      console.error("Error deleting med:", err);
    }
  };

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

          {/* SOCIAL ICONS */}
          <View style={styles.footer}>
            <View style={styles.bottomIcons}>
              <Pressable style={styles.iconButton}>
                <FontAwesome name="google" size={26} color="#DB4437" />
              </Pressable>

              <Pressable style={styles.iconButton}>
                <Ionicons name="logo-apple" size={28} color={colors.black} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};


