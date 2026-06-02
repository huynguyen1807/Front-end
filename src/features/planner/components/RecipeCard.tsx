import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "../../../constants/colors";

interface RecipeCardProps {
  title: string;
  time: string;
  kcal: number;
  tags: string[];
  imageUrl: string;
}

export default function RecipeCard({
  title,
  time,
  kcal,
  tags,
  imageUrl,
}: RecipeCardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: imageUrl }} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <TouchableOpacity activeOpacity={0.75}>
            <Ionicons
              name="heart-outline"
              size={26}
              color={COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.onSurface} />
            <Text style={styles.metaText}>{time}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="fire" size={15} color={COLORS.primary} />
            <Text style={styles.kcalText}>{kcal} kcal</Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 126,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 16,
  },
  image: {
    width: 128,
    minHeight: 126,
    backgroundColor: COLORS.surfaceContainer,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: COLORS.onSurface,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 13,
    color: COLORS.onSurface,
    marginLeft: 4,
    fontWeight: "600",
  },
  kcalText: {
    fontSize: 13,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: "800",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  tag: {
    backgroundColor: "#e5e2e2",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.onSurfaceVariant,
  },
});
