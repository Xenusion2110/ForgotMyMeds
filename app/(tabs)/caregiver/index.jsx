import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "900", color: colors.textDark }}>
          Caregiver
        </Text>
      </View>
    </SafeAreaView>
  );
}