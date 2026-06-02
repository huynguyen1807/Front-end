import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";

interface TimelineItemProps {
  time: string;
  title: string;
  statusText: string;
  kcal: number;
  status: "completed" | "current" | "upcoming";
}

export default function TimelineItem({
  time,
  title,
  statusText,
  kcal,
  status,
}: TimelineItemProps) {
  const isCompleted = status === "completed";
  const isCurrent = status === "current";
  const borderColor = isCompleted || isCurrent ? COLORS.primary : "#e0dddd";

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{time}</Text>

      <View style={[styles.card, { borderLeftColor: borderColor }]}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {statusText} • {kcal} kcal
          </Text>
        </View>

        <TouchableOpacity style={styles.iconButton} activeOpacity={0.75}>
          {isCompleted && (
            <Ionicons name="checkmark-circle-outline" size={26} color={COLORS.primary} />
          )}
          {isCurrent && (
            <Ionicons name="play-circle-outline" size={27} color={COLORS.onSurfaceVariant} />
          )}
          {!isCompleted && !isCurrent && (
            <View style={styles.plusIcon}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  time: {
    width: 58,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.onSurface,
  },
  card: {
    flex: 1,
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: "rgba(28, 27, 27, 0.08)",
    borderLeftWidth: 4,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  iconButton: {
    marginLeft: 12,
  },
  plusIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
});
