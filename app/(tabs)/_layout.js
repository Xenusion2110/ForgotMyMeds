import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";

export default function TabsLayout() {
  return (
    <Tabs
    screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      
        tabBarStyle: {
          height: 78,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
      
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 12,
        },
      
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
    
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginBottom: 6,
        },
      
        tabBarActiveTintColor: colors.primaryEnd,
        tabBarInactiveTintColor: colors.textGray,
      }}
    >
      {/* Dashboard */}
      <Tabs.Screen
        name="home/dashboard"
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "reader" : "reader-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Dose Log */}
      <Tabs.Screen
        name="dose_log/index"
        options={{
          tabBarLabel: "Dose Log",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Medication */}
      <Tabs.Screen
        name="medication/index"
        options={{
          tabBarLabel: "Medication",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "medkit" : "medkit-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Hide any accidental auto-generated index route */}
      {/* <Tabs.Screen name="index" options={{ href: null }} /> */}

    </Tabs>
  );
}
