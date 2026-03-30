// styles.js

import { StyleSheet } from "react-native";
import { colors } from "../constants/colors";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  screen: {
    flex: 1,
    padding: 24,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  footer: {
    alignItems: "center",
    paddingBottom: 6,
  },

  image: {
    width: 150,
    height: 150,
    borderRadius: 24,
    resizeMode: "cover",
    marginBottom: 16,
  },

  title: {
    fontSize: 40,
    fontWeight: "900",
    color: colors.textDark,
    letterSpacing: 1,
  },

  tagline: {
    fontSize: 16,
    color: colors.textGray,
    marginBottom: 18,
    fontWeight: "500",
    textAlign: "center",
  },

  description: {
    fontSize: 17,
    color: colors.textGray,
    marginTop: 18,
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 15,
  },

  buttonWrapper: {
    width: "100%",
    marginTop: 12,
  },

  animatedWrap: {
    width: "100%",
    backgroundColor: "transparent",
    shadowColor: colors.black,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  primaryButton: {
    height: 72,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },

  secondaryButton: {
    height: 72,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },

  secondaryText: {
    color: colors.textDark,
    fontSize: 24,
    fontWeight: "900",
  },

  forgotText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.textDark,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    width: "100%",
    backgroundColor: colors.border,
    marginVertical: 16,
  },

  bottomIcons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },

  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 32,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
});

export default styles;