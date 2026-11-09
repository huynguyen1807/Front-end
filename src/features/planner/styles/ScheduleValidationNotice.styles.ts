import { StyleSheet } from "react-native";

export const scheduleValidationNoticeStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 12,
  },
  infoContainer: {
    backgroundColor: "#e7f5ee",
    borderColor: "#84bda1",
  },
  warningContainer: {
    backgroundColor: "#fff3d2",
    borderColor: "#d8a52f",
  },
  errorContainer: {
    backgroundColor: "#ffedea",
    borderColor: "#e49a92",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "#1c1b1b",
    fontSize: 13,
    fontWeight: "900",
  },
  message: {
    color: "#3e4942",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 2,
  },
  dismissButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
